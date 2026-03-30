# Blackjack Trainer

A free, browser-based blackjack training app that helps you master perfect basic strategy. Get real-time feedback on every decision, track your accuracy, and build muscle memory for optimal play.

**[Play Now](https://gordonlee97.github.io/BlackjackTrainer/)**

## Features

- **Real-time strategy feedback** — Instantly see whether your hit, stand, double, split, or surrender decision matches basic strategy. Choose between blocking incorrect moves or showing feedback and playing your move anyway.
- **Configurable rules** — Set deck count (1/2/4/6/8), dealer soft 17 (H17/S17), double after split, surrender, and hit split aces to match any casino's table rules.
- **Practice modes** — Train on all hands, or focus on hard totals, soft totals, or splits.
- **Hi-Lo running count** — Optional always-visible or hover-to-reveal running count display for card counting practice.
- **Strategy charts** — Built-in reference charts for hard totals, soft totals, and pairs that adapt to your selected rules.
- **Session statistics** — Track your accuracy, hands played, and win rate. Reset anytime.
- **Fluid responsive design** — Works on phones (390px+), tablets, laptops, and large desktops with no breakpoints — pure fluid scaling.
- **Procedural sound effects** — Satisfying audio feedback for deals, actions, and results. Adjustable volume.
- **Smooth animations** — Card dealing from the shoe, split animations, payout text, and result reveals with polished motion design.
- **Keyboard shortcuts** — H (Hit), S (Stand), D (Double), P (Split), R (Surrender) for fast play.
- **No account required** — Runs entirely in your browser. Settings and stats persist in localStorage.

## How to Play

1. **Set your rules** — Configure the table rules on the setup page to match the casino you're training for (or use the defaults).
2. **Place your bet** — Click a chip to set your wager, then hit Deal.
3. **Make your decision** — Hit, Stand, Double, Split, or Surrender using the buttons or keyboard shortcuts.
4. **Learn from feedback** — If you make a mistake, the trainer shows you the correct play and explains why.
5. **Track your progress** — Check the stats panel to see your accuracy improve over time.

## Development

```bash
npm install        # Install dependencies
npm run dev        # Dev server at http://localhost:5173
npm run build      # Production build
npm run lint       # Run ESLint
```

### Tech Stack

React, TypeScript, Vite, Tailwind CSS, Framer Motion, Zustand

## License

MIT
