# Playtesting Agent — Design Spec

## Goal

A custom Claude Code agent that playtests the blackjack trainer app through real browser automation. It exercises the full game flow across multiple viewports, captures screenshots at key moments, reviews them visually for layout/aesthetic/functional issues, and produces a markdown report.

## Architecture

Three layers:

1. **Agent prompt** (`.superpowers/agents/game-playtester.md`) — instructs Claude to start the dev server, run Playwright, review screenshots, and write the report.
2. **Playwright test scripts** (`playtest/scenarios/`) — TypeScript files automating game interactions and capturing screenshots.
3. **Screenshot output** (`playtest/screenshots/`) — organized by `{scenario}/{viewport}/`, using absolute paths everywhere.

### Flow

```
Agent launched
  -> starts dev server (npm run dev)
  -> runs Playwright scenarios across 4 viewports
  -> screenshots saved to playtest/screenshots/ (absolute paths)
  -> Agent reviews each screenshot visually
  -> writes report to docs/playtest-report.md
  -> stops dev server
```

## Viewports

| Name | Resolution | Rationale |
|------|-----------|-----------|
| Large desktop | 2560x1440 | Big monitors, scaling upper bound |
| Desktop | 1920x1080 | Most common desktop |
| Small laptop/tablet | 1366x768 | Common small laptop, tablets |
| Phone (portrait) | 390x844 | iPhone 14 size |

## Scenarios

9 scenarios, each run at all 4 viewports. Element targeting uses text content selectors (`getByText`, `getByRole`) since no `data-testid` attributes exist.

### 1. Basic Flow
Bet $25 -> deal -> hit once -> stand -> result.
**Screenshots:** betting phase, cards dealt, after hit, result screen.

### 2. Double Down
Bet -> deal -> double down.
**Screenshots:** doubled hand, single card received, result.

### 3. Split
Deal until a pair appears (max attempts capped) -> split -> play both hands.
**Screenshots:** split animation (3-4 sequential captures), both hands visible, sequential play, result.

### 4. Surrender
Enable surrender rule first -> deal -> surrender.
**Screenshots:** half-bet returned, result display.

### 5. Bust
Hit repeatedly until bust.
**Screenshots:** each hit, bust state, result announcement.

### 6. Dealer Play
Stand immediately, watch dealer draw cards.
**Screenshots:** dealer hole card reveal, each dealer draw (3-4 sequential captures), final result.

### 7. Wrong Move Feedback
Make an intentionally incorrect play to trigger strategy modal.
**Screenshots:** strategy modal appearance, modal content, after dismiss/block.

### 8. Settings Modal
Open settings, toggle rules, change options, close.
**Screenshots:** modal open, toggled states, modal closed.

### 9. Extended Session
Play 10+ hands rapidly with mixed actions.
**Screenshots:** stats panel after session, balance changes, shoe state.

### Handling specific hands
Scenarios requiring specific hands (pairs for split, etc.) loop deals until the right hand appears, with a max attempt cap (50) to avoid infinite loops. Between attempts: bet -> deal -> check -> if wrong hand, wait for complete phase -> new hand -> repeat.

### Animation captures
For scenarios with animations (split, dealer play), the script takes 3-4 sequential screenshots with short delays (~200-300ms) between them to show progression.

## Element Targeting Strategy

No `data-testid` attributes exist. Targeting approach:

- **Buttons:** `page.getByText('Hit')`, `page.getByText('Deal')`, `page.getByText('Stand')`, etc.
- **Chips:** target by dollar amount text (`$5`, `$25`, `$100`, `$500`)
- **Modals:** wait for modal container to appear, target buttons within
- **Settings:** target by label text for toggles and dropdowns
- **Phase detection:** expose Zustand store on `window.__gameStore` in dev mode, then read phase via `page.evaluate(() => window.__gameStore.getState().phase)`. Alternatively, detect phase from DOM state (e.g., presence of action buttons = player_turn, Deal button = betting).

## File Structure

```
BlackjackTrainer/
  playtest/
    playwright.config.ts        # 4 viewports, base URL localhost:5173
    helpers.ts                  # wait-for-phase, screenshot util, deal-until-condition
    scenarios/
      01-basic-flow.spec.ts
      02-double-down.spec.ts
      03-split.spec.ts
      04-surrender.spec.ts
      05-bust.spec.ts
      06-dealer-play.spec.ts
      07-wrong-move.spec.ts
      08-settings-modal.spec.ts
      09-extended-session.spec.ts
    screenshots/                # gitignored, generated per run
      01-basic-flow/
        2560x1440/
        1920x1080/
        1366x768/
        390x844/
      ...
  .superpowers/agents/
    game-playtester.md          # Agent definition
  docs/
    playtest-report.md          # Generated report
```

## Screenshot Paths

All screenshot paths are absolute. The helpers resolve against the project root:

```typescript
const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'screenshots');
```

Report references also use absolute paths so there is no ambiguity regardless of where the report is opened.

## Report Format

Generated at `docs/playtest-report.md`:

```markdown
# Playtest Report -- {date}

## Summary
- Viewports tested: 4
- Scenarios run: 9
- Issues found: {count}
- Overall assessment: {pass / needs attention / failing}

## Issues
### Issue 1: {title}
- **Severity**: critical / warning / cosmetic
- **Viewport**: {which}
- **Scenario**: {which}
- **Description**: {what's wrong}
- **Screenshot**: {absolute path to screenshot}

## Scenario Results

### 1. Basic Flow
| Viewport | Status | Notes |
|----------|--------|-------|
| 2560x1440 | pass | -- |
| 1920x1080 | warning | Button text slightly small |
| ... | ... | ... |

#### Screenshots
{absolute paths to each screenshot}
```

Issues bubble to the top for quick scanning. Detailed per-scenario results with screenshots follow.

## npm Integration

Add to package.json:

```json
{
  "scripts": {
    "playtest": "npx playwright test --config=playtest/playwright.config.ts"
  }
}
```

## Agent Invocation

The agent is defined at `.superpowers/agents/game-playtester.md` and launched via the Agent tool with `subagent_type: "game-playtester"`. It handles the full pipeline: dev server lifecycle, Playwright execution, screenshot review, and report generation.

## Dependencies

- `@playwright/test` (dev dependency)
- Playwright browsers installed via `npx playwright install chromium`

Only Chromium is needed — the goal is functional/visual playtesting, not cross-browser compatibility testing.
