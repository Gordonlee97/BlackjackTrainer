import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomSelectProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  minWidth?: string;
}

export default function CustomSelect({ value, options, onChange, minWidth = 'clamp(160px, 20vw, 220px)' }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const selectedLabel = options.find(o => o.value === value)?.label ?? value;

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleScroll = () => updatePosition();

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [open, updatePosition]);

  return (
    <>
      <div style={{ position: 'relative', minWidth }}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full text-left cursor-pointer flex items-center justify-between"
          style={{
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            background: open ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.09)',
            border: open ? '1px solid rgba(255,255,255,0.20)' : '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px',
            padding: '12px 18px',
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          <span>{selectedLabel}</span>
          <svg
            width="12" height="8" viewBox="0 0 12 8"
            style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
          >
            <path d="M1 1l5 5 5-5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {createPortal(
        <AnimatePresence>
          {open && pos && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'fixed',
                top: pos.top,
                left: pos.left,
                width: pos.width,
                zIndex: 9999,
                background: 'linear-gradient(to bottom, #1c2b22, #0f1c15)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '14px',
                padding: '6px',
                boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)',
                overflow: 'hidden',
              }}
            >
              {options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className="w-full text-left cursor-pointer"
                  style={{
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: opt.value === value ? 700 : 500,
                    color: opt.value === value ? '#f59e0b' : 'rgba(255,255,255,0.75)',
                    background: opt.value === value ? 'rgba(245,158,11,0.10)' : 'transparent',
                    borderRadius: '10px',
                    border: 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => {
                    if (opt.value !== value) (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                  }}
                  onMouseLeave={e => {
                    (e.target as HTMLElement).style.background = opt.value === value ? 'rgba(245,158,11,0.10)' : 'transparent';
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
