# Blackjack H17 Perfect Strategy + Hi-Lo Deviations
# For use in AI-assisted game implementation

---

## GAME RULES ASSUMED
- Decks: 8 (indices are valid for 6 or 8 deck games)
- Dealer hits soft 17 (H17)
- Double after split allowed (DAS)
- Resplit aces allowed (RSA)
- Double any two cards
- Late surrender available (LS)
- Counting system: Hi-Lo
- No surrender = omit the LS section entirely

---

## HOW TO READ THIS DOCUMENT

### Basic Strategy (no count)
All tables below define the default action with NO count information.

### Deviations
Deviations override basic strategy when the True Count (TC) meets a threshold.
Format: `[hand] vs [dealer upcard]: deviation_action if TC [condition]`

Conditions use standard notation:
- `TC >= N` → do the deviation action at that count and above
- `TC <= N` → do the deviation action at that count and below (negative deviation)
- `TC < 0` → any negative true count

### Action Codes
- `H`  = Hit
- `S`  = Stand
- `D`  = Double (if not allowed, Hit)
- `Ds` = Double (if not allowed, Stand)
- `SP` = Split
- `SUR`= Late Surrender (if not allowed, Hit unless noted)
- `SUR/S` = Late Surrender (if not allowed, Stand)

---

## PART 1: BASIC STRATEGY (H17, 8-DECK, DAS)

### 1A. HARD TOTALS
Rows = Player hand total. Columns = Dealer upcard (2–A).

```
Hand |  2    3    4    5    6    7    8    9   10    A
-----|----------------------------------------------------
 8   |  H    H    H    H    H    H    H    H    H    H
 9   |  H    D    D    D    D    H    H    H    H    H
10   |  D    D    D    D    D    D    D    D    H    H
11   |  D    D    D    D    D    D    D    D    D    D
12   |  H    H    S    S    S    H    H    H    H    H
13   |  S    S    S    S    S    H    H    H    H    H
14   |  S    S    S    S    S    H    H    H    H    H
15   |  S    S    S    S    S    H    H    H    H    H
16   |  S    S    S    S    S    H    H    H    H    H
17   |  S    S    S    S    S    S    S    S    S    S
```

Note: Hard 17+ always stands regardless of dealer upcard.

---

### 1B. SOFT TOTALS
Rows = Player soft hand. Columns = Dealer upcard (2–A).

```
Hand      |  2    3    4    5    6    7    8    9   10    A
----------|----------------------------------------------------
A,2 (13)  |  H    H    H    D    D    H    H    H    H    H
A,3 (14)  |  H    H    H    D    D    H    H    H    H    H
A,4 (15)  |  H    H    D    D    D    H    H    H    H    H
A,5 (16)  |  H    H    D    D    D    H    H    H    H    H
A,6 (17)  |  H    D    D    D    D    H    H    H    H    H
A,7 (18)  |  Ds   Ds   Ds   Ds   Ds   S    S    H    H    H
A,8 (19)  |  S    S    S    S    Ds   S    S    S    S    S
A,9 (20)  |  S    S    S    S    S    S    S    S    S    S
```

---

### 1C. PAIR SPLITTING
Rows = Pair. Columns = Dealer upcard (2–A).
Y = Always split. N = Never split. Y/N = Split only if DAS offered.

```
Pair  |  2    3    4    5    6    7    8    9   10    A
------|----------------------------------------------------
A,A   |  Y    Y    Y    Y    Y    Y    Y    Y    Y    Y
T,T   |  N    N    N    N    N    N    N    N    N    N
9,9   |  Y    Y    Y    Y    Y    N    Y    Y    N    N
8,8   |  Y    Y    Y    Y    Y    Y    Y    Y    Y    Y
7,7   |  Y    Y    Y    Y    Y    Y    N    N    N    N
6,6   | Y/N   Y    Y    Y    Y    N    N    N    N    N
5,5   |  N    N    N    N    N    N    N    N    N    N
4,4   |  N    N    N   Y/N  Y/N   N    N    N    N    N
3,3   | Y/N  Y/N   Y    Y    Y    Y    N    N    N    N
2,2   | Y/N  Y/N   Y    Y    Y    Y    N    N    N    N
```

Note: 8,8 vs A — split (never surrender 8,8 in H17 at neutral/positive counts).
Note: 5,5 is always treated as hard 10, never split.
Note: Y/N means split if DAS is offered, otherwise do not split.

---

### 1D. LATE SURRENDER (Basic Strategy, H17)
Surrender these hands BEFORE any other decision.

```
Hand  | Dealer upcard → Surrender?
------|----------------------------
17    | A         → SUR
16    | 9, 10, A  → SUR
15    | 10, A     → SUR
```

All other hands: do not surrender at neutral count.

---

## PART 2: HI-LO DEVIATIONS (H17)

Deviations override the basic strategy above.
Apply in this priority order: Insurance → Surrender → Split → Double → Stand/Hit.
TC = True Count (running count / decks remaining).

---

### 2A. INSURANCE
```
Always take insurance (side bet) if TC >= +3.
This is independent of your hand.
Even money on blackjack follows same rule: take if TC >= +3.
```

---

### 2B. SURRENDER DEVIATIONS

These modify when to surrender vs. when to deviate away from surrendering.

```
Hand  | Dealer | BS Action | Deviation
------|--------|-----------|------------------------------------------
17    |   A    |   SUR     | STAND instead of SUR if TC >= +2
      |        |           | (i.e., SUR only when TC < +2)
16    |   8    |    H      | SUR if TC >= +4
16    |   9    |   SUR     | HIT instead of SUR if TC <= -1
      |        |           | (i.e., SUR only when TC >= 0)
16    |  10    |   SUR     | No deviation — always SUR
16    |   A    |   SUR     | No deviation — always SUR
15    |   9    |    H      | SUR if TC >= +2
15    |  10    |   SUR     | HIT instead of SUR if TC < 0
      |        |           | (i.e., SUR only when TC >= 0)
15    |   A    |    H      | SUR if TC >= -1
14    |  10    |    H      | SUR if TC >= +3
```

---

### 2C. PAIR SPLITTING DEVIATIONS

```
Pair  | Dealer | BS Action | Deviation
------|--------|-----------|------------------------------------------
T,T   |   4    |    N      | SP if TC >= +6
T,T   |   5    |    N      | SP if TC >= +5
T,T   |   6    |    N      | SP if TC >= +4
```

All other pair splitting is count-independent (follow basic strategy table above).

---

### 2D. SOFT TOTAL DEVIATIONS

```
Hand      | Dealer | BS Action | Deviation
----------|--------|-----------|------------------------------------------
A,8 (19)  |   4    |    S      | DOUBLE if TC >= +3
A,8 (19)  |   5    |    S      | DOUBLE if TC >= +1
A,8 (19)  |   6    |   Ds      | STAND instead of DOUBLE if TC < 0
           |        |           | (i.e., double only when TC >= 0)
A,6 (17)  |   2    |    H      | DOUBLE if TC >= +1
```

---

### 2E. HARD TOTAL DEVIATIONS

```
Hand | Dealer | BS Action | Deviation
-----|--------|-----------|------------------------------------------
 8   |   6    |    H      | DOUBLE if TC >= +2
 9   |   2    |    H      | DOUBLE if TC >= +1
 9   |   7    |    H      | DOUBLE if TC >= +3
10   |  10    |    H      | DOUBLE if TC >= +4
10   |   A    |    H      | DOUBLE if TC >= +3
12   |   2    |    H      | STAND if TC >= +3
12   |   3    |    H      | STAND if TC >= +2
12   |   4    |    S      | HIT if TC < 0
13   |   2    |    S      | HIT if TC <= -1
15   |  10    |    H*     | STAND if TC >= +4  (*only if no surrender)
15   |   A    |    H*     | STAND if TC >= +5  (*only if no surrender)
16   |   9    |    H*     | STAND if TC >= +4  (*only if no surrender)
16   |  10    |    H*     | STAND if TC >= 0   (*only if no surrender)
16   |   A    |    H*     | STAND if TC >= +3  (*only if no surrender)
```

Note on 15/16 stand deviations: These are superseded by surrender deviations
when surrender is available. If surrender IS offered, always prefer surrendering
at the correct count over standing. The stand indices are only for no-surrender games.

---

## PART 3: IMPLEMENTATION LOGIC

### Decision Priority (per hand)
```
1. Can player take insurance?     → Check TC >= +3 (independent of hand)
2. Can player surrender?          → Check surrender deviations first, then BS surrender
3. Can player split?              → Check split deviations first, then BS split rules
4. Can player double?             → Check double deviations first, then BS double rules
5. Stand or Hit                   → Check stand deviations first, then BS stand/hit rules
```

### True Count Calculation
```
TC = Running Count / Decks Remaining
Decks Remaining = Cards Remaining / 52
Floor TC when using for index comparison (round down, not nearest integer).
```

### Resplit Aces Rule
```
If a split ace receives another ace as its first card,
allow resplitting up to the table maximum (typically 3 or 4 total hands).
Split aces receive exactly ONE card each — no further hitting.
Exception: If the one card dealt to a split ace is another ace and RSA is allowed, resplit.
```

### DAS (Double After Split)
```
After splitting any pair, player may double on the resulting 2-card hand
following the same doubling rules as a normal hand.
Exception: Split aces — no doubling on aces in standard rules.
```

### Soft vs Hard Hand Tracking
```
A hand is SOFT if it contains an ace counted as 11 without busting.
If adding a card would bust a soft hand, convert ace to 1 (hand becomes hard).
Always recheck soft/hard status after each card.
```

---

## PART 4: QUICK REFERENCE — HIGHEST PRIORITY DEVIATIONS

Ranked by EV impact (learn these first):

```
Priority | Deviation
---------|----------------------------------------------------------
1        | Insurance at TC >= +3
2        | 16 vs 10: SUR (or stand if no SUR) at TC >= 0
3        | 15 vs 10: SUR at TC >= 0 (hit if TC < 0)
4        | T,T vs 5: SP at TC >= +5
5        | T,T vs 6: SP at TC >= +4
6        | 15 vs A:  SUR at TC >= -1 (H17 specific)
7        | 14 vs 10: SUR at TC >= +3
8        | 16 vs 9:  SUR (BS); HIT at TC <= -1
9        | 10 vs 10: DOUBLE at TC >= +4
10       | 12 vs 3:  STAND at TC >= +2
11       | 12 vs 2:  STAND at TC >= +3
12       | 9 vs 2:   DOUBLE at TC >= +1
13       | 10 vs A:  DOUBLE at TC >= +3
14       | 9 vs 7:   DOUBLE at TC >= +3
15       | T,T vs 4: SP at TC >= +6
16       | 12 vs 4:  HIT at TC < 0
17       | 13 vs 2:  HIT at TC <= -1
18       | A,8 vs 6: DOUBLE at TC >= 0 (stand at TC < 0)
```

---
---

# Blackjack S17 Perfect Strategy + Hi-Lo Deviations
# For use in AI-assisted game implementation

---

## GAME RULES ASSUMED
- Decks: 8 (indices are valid for 6 or 8 deck games)
- Dealer STANDS on soft 17 (S17)
- Double after split allowed (DAS)
- Resplit aces allowed (RSA)
- Double any two cards
- Late surrender available (LS)
- Counting system: Hi-Lo
- No surrender = omit the LS section entirely

---

## KEY DIFFERENCES FROM H17

The following plays differ between S17 and H17. Everything else is identical.

```
Situation            | H17 Action        | S17 Action
---------------------|-------------------|-------------------
Hard 11 vs A (BS)    | D (always double) | H (hit; deviate to D at TC >= +1)
Hard 17 vs A (BS)    | SUR               | S (always stand; no surrender)
Soft 19 vs 6 (BS)    | Ds                | S (stand; deviate to D at TC >= 0)
Hard 16 vs A (BS LS) | SUR               | SUR (same, but index differs)
15 vs A (Fab 4 LS)   | SUR at TC >= -1   | SUR at TC >= +2
10 vs A (deviation)  | D at TC >= +3     | D at TC >= +4
```

---

## PART 5: BASIC STRATEGY (S17, 8-DECK, DAS)

### 5A. HARD TOTALS
Rows = Player hand total. Columns = Dealer upcard (2–A).

```
Hand |  2    3    4    5    6    7    8    9   10    A
-----|----------------------------------------------------
 8   |  H    H    H    H    H    H    H    H    H    H
 9   |  H    D    D    D    D    H    H    H    H    H
10   |  D    D    D    D    D    D    D    D    H    H
11   |  D    D    D    D    D    D    D    D    D    H
12   |  H    H    S    S    S    H    H    H    H    H
13   |  S    S    S    S    S    H    H    H    H    H
14   |  S    S    S    S    S    H    H    H    H    H
15   |  S    S    S    S    S    H    H    H    H    H
16   |  S    S    S    S    S    H    H    H    H    H
17   |  S    S    S    S    S    S    S    S    S    S
```

CRITICAL DIFFERENCE from H17:
- Hard 11 vs A → H (hit) in S17. In H17 it is D (double).
- All other hard totals are identical to H17.

---

### 5B. SOFT TOTALS
Rows = Player soft hand. Columns = Dealer upcard (2–A).

```
Hand      |  2    3    4    5    6    7    8    9   10    A
----------|----------------------------------------------------
A,2 (13)  |  H    H    H    D    D    H    H    H    H    H
A,3 (14)  |  H    H    H    D    D    H    H    H    H    H
A,4 (15)  |  H    H    D    D    D    H    H    H    H    H
A,5 (16)  |  H    H    D    D    D    H    H    H    H    H
A,6 (17)  |  H    D    D    D    D    H    H    H    H    H
A,7 (18)  |  Ds   Ds   Ds   Ds   Ds   S    S    H    H    H
A,8 (19)  |  S    S    S    S    S    S    S    S    S    S
A,9 (20)  |  S    S    S    S    S    S    S    S    S    S
```

CRITICAL DIFFERENCE from H17:
- Soft 19 (A,8) vs 6 → S (stand) in S17. In H17 it is Ds (double/else stand).
  Deviation can still trigger a double at TC >= 0 (see Part 6D).
- All other soft totals are identical to H17.

---

### 5C. PAIR SPLITTING
Identical to H17. See Part 1C above.

```
Pair  |  2    3    4    5    6    7    8    9   10    A
------|----------------------------------------------------
A,A   |  Y    Y    Y    Y    Y    Y    Y    Y    Y    Y
T,T   |  N    N    N    N    N    N    N    N    N    N
9,9   |  Y    Y    Y    Y    Y    N    Y    Y    N    N
8,8   |  Y    Y    Y    Y    Y    Y    Y    Y    Y    Y
7,7   |  Y    Y    Y    Y    Y    Y    N    N    N    N
6,6   | Y/N   Y    Y    Y    Y    N    N    N    N    N
5,5   |  N    N    N    N    N    N    N    N    N    N
4,4   |  N    N    N   Y/N  Y/N   N    N    N    N    N
3,3   | Y/N  Y/N   Y    Y    Y    Y    N    N    N    N
2,2   | Y/N  Y/N   Y    Y    Y    Y    N    N    N    N
```

---

### 5D. LATE SURRENDER (Basic Strategy, S17)
Surrender these hands BEFORE any other decision.

```
Hand  | Dealer upcard → Surrender?
------|----------------------------
16    | 9, 10, A  → SUR
15    | 10, A     → SUR
```

CRITICAL DIFFERENCE from H17:
- Hard 17 vs A → do NOT surrender in S17 (stand is BS). H17 surrenders it.
- All other surrender BS plays are identical.

---

## PART 6: HI-LO DEVIATIONS (S17)

Deviations override the basic strategy above.
Apply in this priority order: Insurance → Surrender → Split → Double → Stand/Hit.
TC = True Count (running count / decks remaining).

---

### 6A. INSURANCE
```
Identical to H17: Take insurance if TC >= +3.
```

---

### 6B. SURRENDER DEVIATIONS (S17)

```
Hand  | Dealer | BS Action | Deviation
------|--------|-----------|------------------------------------------
16    |   8    |    H      | SUR if TC >= +4
16    |   9    |   SUR     | HIT instead of SUR if TC <= -1
      |        |           | (i.e., SUR only when TC >= 0)
16    |  10    |   SUR     | No deviation — always SUR
16    |   A    |   SUR     | No deviation — always SUR
15    |   9    |    H      | SUR if TC >= +2
15    |  10    |   SUR     | HIT instead of SUR if TC < 0
      |        |           | (i.e., SUR only when TC >= 0)
15    |   A    |   SUR     | No deviation (already BS surrender in S17)
      |        |           | NOTE: Hit if TC < 0 (BS surrender only at TC >= 0)
14    |  10    |    H      | SUR if TC >= +3
```

NOTE on 15 vs A (S17): Unlike H17 where this is a white-cell (hit BS) with a
deviation to surrender at TC >= -1, in S17 the Fab 4 index is TC >= +2.
The cell is SUR (BS) at neutral/positive counts; deviate to HIT at TC < 0.

NOTE: No 17 vs A surrender row exists for S17 — standing 17 vs A is always
correct in S17 (dealer cannot improve a soft 17 by hitting).

---

### 6C. PAIR SPLITTING DEVIATIONS (S17)
Identical to H17:

```
Pair  | Dealer | BS Action | Deviation
------|--------|-----------|------------------------------------------
T,T   |   4    |    N      | SP if TC >= +6
T,T   |   5    |    N      | SP if TC >= +5
T,T   |   6    |    N      | SP if TC >= +4
```

---

### 6D. SOFT TOTAL DEVIATIONS (S17)

```
Hand      | Dealer | BS Action | Deviation
----------|--------|-----------|------------------------------------------
A,8 (19)  |   4    |    S      | DOUBLE if TC >= +3
A,8 (19)  |   5    |    S      | DOUBLE if TC >= +1
A,8 (19)  |   6    |    S      | DOUBLE if TC >= 0
           |        |           | (BJA chart shows 1+ here — CORRECTED to 0+)
A,6 (17)  |   2    |    H      | DOUBLE if TC >= +1
```

CORRECTION NOTE: The BJA S17 chart shows A,8 vs 6 deviation as 1+ (TC >= +1).
The correct index verified against Schlesinger/Wong sources is TC >= 0.
The H17 chart correctly shows 0- for the same cell (double when TC >= 0,
stand when TC < 0). S17 should match: double at TC >= 0.

---

### 6E. HARD TOTAL DEVIATIONS (S17)

```
Hand | Dealer | BS Action | Deviation
-----|--------|-----------|------------------------------------------
 8   |   6    |    H      | DOUBLE if TC >= +2
 9   |   2    |    H      | DOUBLE if TC >= +1
 9   |   7    |    H      | DOUBLE if TC >= +3
10   |  10    |    H      | DOUBLE if TC >= +4
10   |   A    |    H      | DOUBLE if TC >= +4
     |        |           | (NOTE: H17 is +3 here; S17 requires higher count)
11   |   A    |    H      | DOUBLE if TC >= +1
     |        |           | (NOTE: H17 always doubles 11vA as BS; S17 hits by default)
12   |   2    |    H      | STAND if TC >= +3
12   |   3    |    H      | STAND if TC >= +2
12   |   4    |    S      | HIT if TC < 0
13   |   2    |    S      | HIT if TC <= -1
15   |  10    |    H*     | STAND if TC >= +4  (*only if no surrender)
16   |   9    |    H*     | STAND if TC >= +4  (*only if no surrender)
16   |  10    |    H*     | STAND if TC >= 0   (*only if no surrender)
16   |   A    |    H*     | STAND if TC >= +3  (*only if no surrender)
```

Note on 15/16 stand deviations: Superseded by surrender when available.
These only apply in no-surrender games.

Note on 15 vs A (no surrender): In S17 this index is approximately +5 to +6,
significantly higher than H17's +5. In practice it is so rare that most
counters omit it. Not included in standard I18.

---

## PART 7: QUICK REFERENCE — S17 HIGHEST PRIORITY DEVIATIONS

Ranked by EV impact:

```
Priority | Deviation
---------|----------------------------------------------------------
1        | Insurance at TC >= +3
2        | 16 vs 10: SUR (or stand if no SUR) at TC >= 0
3        | 15 vs 10: SUR at TC >= 0 (hit if TC < 0)
4        | T,T vs 5: SP at TC >= +5
5        | T,T vs 6: SP at TC >= +4
6        | 15 vs A:  SUR at TC >= +2 (S17; higher than H17's -1)
7        | 14 vs 10: SUR at TC >= +3
8        | 16 vs 9:  SUR (BS); HIT at TC <= -1
9        | 11 vs A:  DOUBLE at TC >= +1 (S17 specific — BS is hit)
10       | 10 vs 10: DOUBLE at TC >= +4
11       | 12 vs 3:  STAND at TC >= +2
12       | 12 vs 2:  STAND at TC >= +3
13       | 9 vs 2:   DOUBLE at TC >= +1
14       | 10 vs A:  DOUBLE at TC >= +4 (S17; H17 is +3)
15       | 9 vs 7:   DOUBLE at TC >= +3
16       | T,T vs 4: SP at TC >= +6
17       | 12 vs 4:  HIT at TC < 0
18       | 13 vs 2:  HIT at TC <= -1
19       | A,8 vs 6: DOUBLE at TC >= 0 (stand at TC < 0)
```
