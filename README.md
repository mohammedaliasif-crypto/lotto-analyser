# 🎱 Lotto Analyser Pro

Advanced statistical analyser for **Tuesday Lotto (Pick 6/45)** — a single-file PWA with 7 analytical modules.

**Live demo:** https://mohammedaliasif-crypto.github.io/lotto-analyser

---

## Features

### 📊 Overview
Live summary metrics — Shannon entropy, uniformity index, avg draw sum, consecutive rate — plus a sum histogram and decade distribution chart generated from 5,000 simulated draws.

### 📈 Frequency
All 45 numbers ranked with frequency bars, percentage, last-seen draw, and overdue score. Sortable by frequency, overdue, or number order. Includes a top-10 pair co-occurrence matrix and decade frequency vs expected chart.

### ✦ Generator
6 generation methods (balanced, hot-biased, cold-biased, overdue-focused, max-entropy, pure random) combined with sum targeting, odd/even filter, and low/high split filter. Generates up to 20 lines with per-line scores and a visual score bar.

### 🎯 Analyser
Pick your 6 by clicking the number grid, then get a full breakdown: 8 statistical checks, an overall 0–100 score, and a prize probability table showing odds for all 6 divisions.

### 🎲 Monte Carlo
Simulate up to 50,000 draws. Outputs empirical sum distribution chart, odd-count breakdown by percentage, and — if you've picked numbers in the Analyser tab — how many times your exact pick matched each division.

### ☸ Wheel
Select 7–10 numbers for a full covering wheel. Shows all lines, total AUD cost at $1.30/line, and a Div 1 guarantee statement.

### 🔬 Deep Math
Combinatorics breakdown (C(45,6) through C(45,2)), Shannon entropy deficit analysis, expected value / RTP / house edge calculator, per-number z-score chart (red = hot outlier, blue = cold outlier), and birthday paradox applied to shared-number risk across groups of 10–500 players.

---

## File Structure

```
lotto-analyser/
├── index.html      # Main HTML — all 7 tab layouts
├── style.css       # Full dark-theme stylesheet
├── data.js         # Simulated historical data & statistics engine
├── app.js          # All tab logic, Chart.js rendering, Monte Carlo
├── manifest.json   # PWA manifest for install-to-home-screen
└── README.md
```

## Deployment

Push all files to the `main` branch of your GitHub repository. GitHub Pages will serve `index.html` automatically.

**No build step required** — pure HTML, CSS, and vanilla JS. Chart.js is loaded from CDN.

---

## Disclaimer

⚠ All generation methods produce numbers with identical odds (1 in 8,145,060). No algorithm can predict certified random draws. This tool is for entertainment and statistical exploration only.

**Play responsibly. Gambling Help Line: 1800 858 858**
