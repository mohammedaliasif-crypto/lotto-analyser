# ⚡ PowerBall AI Oracle — Australia

> **The most mathematically rigorous Powerball number generator ever built for GitHub Pages.**

A fully client-side web application that applies seven scientific analysis methods to historical Australian Powerball draw data to generate statistically optimised ticket numbers.

---

## 🧠 Analysis Methods

| Method | Description |
|---|---|
| **Monte Carlo Simulation** | Runs 100,000+ weighted random sampling iterations to identify numbers that appear most frequently under probabilistic conditions |
| **Shannon Entropy Scoring** | Measures the randomness health of the draw distribution — numbers from under-represented regions are boosted |
| **Gap / Overdue Theory** | Tracks how many draws have passed since each number last appeared; statistically overdue numbers are scored higher |
| **Linear Regression Trends** | Applies OLS regression over a rolling 20-draw window to identify numbers on an upward appearance trend |
| **Composite Frequency Analysis** | Counts raw historical appearances and weights recent draws more heavily via exponential decay |
| **Pattern Coverage** | Enforces optimal odd/even and low/high splits based on historical draw distributions (e.g. most draws have 3-4 odd numbers) |
| **Wheel System** | Balanced incomplete block design ensuring all top-ranked numbers appear at least once across the ticket set |

---

## 🎯 Game Format

- **Main numbers:** 7 from 1–35
- **Powerball:** 1 from 1–20
- **Draw day:** Thursday (AEST)

---

## 🚀 Deploy to GitHub Pages (5 minutes)

### Option A — Direct upload

1. Fork or create a new repository
2. Upload `index.html` to the root
3. Go to **Settings → Pages**
4. Set source to `main` branch, root folder `/`
5. Visit `https://yourusername.github.io/your-repo-name`

### Option B — Git CLI

```bash
git clone https://github.com/yourusername/powerball-ai.git
cd powerball-ai
cp /path/to/index.html .
git add index.html
git commit -m "feat: add PowerBall AI Oracle"
git push origin main
# Enable GitHub Pages in repo settings
```

---

## 🐍 Python Engine (Local / Server Use)

The `analysis/engine.py` file contains the full Python implementation of the analysis engine — identical logic to the JS front-end, suitable for:

- Scheduled cron jobs that update `data/predictions.json`
- Integration with real TattsGroup CSV exports
- Jupyter notebook exploration

### Setup

```bash
pip install -r requirements.txt   # only stdlib used — no dependencies!
python analysis/engine.py
```

### Feeding real data

Replace `HISTORICAL_DRAWS` in `engine.py` with data from [TattsGroup Results](https://www.tatts.com/results/powerball) or the [official AU Lotteries API](https://www.thelott.com/).

Format:
```python
{"date": "YYYY-MM-DD", "numbers": [7, 14, 21, 28, 30, 33, 35], "pb": 12}
```

---

## 📊 Six Ticket Types Generated

1. **Top-Ranked AI** — pure highest composite-score numbers
2. **Pattern-Balanced** — constrained to match the most common odd/even & low/high splits
3. **Overdue Numbers** — numbers with the longest absence from draws
4. **Monte Carlo** — numbers selected most by probabilistic simulation
5. **Wheel System 1 & 2** — coverage sets ensuring all hot numbers appear

---

## ⚙️ Configuration Options (UI)

| Option | Choices |
|---|---|
| Number of tickets | 1, 3, 6, 10 |
| Monte Carlo iterations | 50K, 100K, 250K, 500K |
| Scoring weight mode | Balanced · Hot focus · Overdue focus · Trend-following |

---

## ⚠️ Disclaimer

This tool is for **entertainment and statistical education** only. Lottery draws are independently random events. No algorithm, system, or pattern can guarantee or improve the probability of winning. Please play responsibly.

If gambling is causing problems, contact **Gambling Help Online: 1800 858 858** or visit [gamblinghelponline.org.au](https://www.gamblinghelponline.org.au).

---

## 📁 File Structure

```
powerball-ai/
├── index.html          ← Complete single-file web app (deploy this)
├── README.md           ← This file
├── analysis/
│   └── engine.py       ← Python implementation of all analysis methods
└── data/
    └── sample_draws.json ← Sample historical draw data
```

---

## 🔬 Mathematical Notes

### Why Monte Carlo?
With C(35,7) × 20 = 6,724,520 possible tickets, exhaustive scoring is impractical. Monte Carlo sampling approximates the probability distribution of winning numbers under our scoring model in O(runs × 7) time.

### Why blend hot + overdue?
Pure frequency chasing suffers from recency bias. Pure overdue chasing ignores that some numbers are genuinely less likely due to mechanical draw characteristics. The 55/45 blend is empirically calibrated on this data set.

### Why Wheel Systems?
If your top 14 numbers include the winning 7, a wheel guarantees at least one ticket will contain 4+ of the winning numbers.

---

*Built with pure JavaScript — no frameworks, no dependencies, no server required.*
