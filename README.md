# Blackjack Bot

A TypeScript blackjack bot that plays using basic strategy and runs simulations to generate win/loss statistics.

The bot reads its decisions from a basic strategy table (`strategy.json`) and plays thousands of simulated hands automatically. Results are logged to a JSONL file and summarized into an Excel report (win rate per situation, global win rate, and a bankroll simulation).

## Project structure

```
src/
  engine/        Core blackjack rules (cards, deck, hands, dealer, player, game loop)
  bot/            Decision logic — reads strategy.json and picks an action for each situation
  simulation/     Plays N hands automatically and logs every decision + result
  analysis/       Reads the simulation output and produces stats (console + Excel)
  launcher.ts     Entry point — asks how many hands to simulate, then runs everything

output/           Generated files (JSONL log, Excel report) — not tracked in git except for output/.gitkeep
```

## Setup

```bash
npm install
```

## Usage

```bash
npm run dev
```

You'll be prompted for the number of hands to simulate. The script will:

1. Run the simulation and write every decision + result to `output/output.jsonl`
2. Analyze the results and print a summary to the console
3. Generate `output/stats.xlsx` with a detailed breakdown per situation and a global summary (win rate, bankroll simulation at 10€/hand, doubles, natural blackjacks paid 3:2)

## Strategy table

`src/bot/strategy.json` contains the basic strategy chart the bot follows, split into three categories:

- `hard` — hands without a soft ace (e.g. 10-6 = hard 16)
- `soft` — hands with an ace still counted as 11 (e.g. A-6 = soft 17)
- `pairs` — the player's first two cards share the same value (split decision)

Actions: `H` (Hit), `S` (Stand), `D` (Double), `P` (Split).

## Notes

- The engine has no real betting/bankroll during play — doubling just draws one extra card and stands automatically. The bankroll simulation in the Excel report is computed after the fact, applying standard payout rules (1:1, double = 2x stake, blackjack = 3:2).
- Dealer stands on 17+ (no hit on soft 17).
