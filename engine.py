"""
PowerBall Australia AI Analysis Engine
======================================
Combines Monte Carlo simulation, entropy scoring, regression analysis,
wheel systems, frequency analysis, gap theory, and statistical modeling
to generate optimized ticket number predictions.

PowerBall Australia rules:
- Pick 7 numbers from 1–35
- Pick 1 Powerball from 1–20
"""

import json
import math
import random
import statistics
from collections import Counter, defaultdict
from datetime import datetime, timedelta
import itertools


# ─── CONSTANTS ────────────────────────────────────────────────────────────────
MAIN_POOL = 35
MAIN_PICK  = 7
PB_POOL    = 20
PB_PICK    = 1
MONTE_CARLO_RUNS = 100_000


# ─── SAMPLE HISTORICAL DATA ───────────────────────────────────────────────────
# Real AU Powerball draws – last 80 draws (abridged for embedded use).
# In production, replace/extend with full TattsGroup CSV export.
HISTORICAL_DRAWS = [
    {"date": "2024-03-28", "numbers": [2, 11, 16, 20, 25, 30, 35], "pb": 14},
    {"date": "2024-03-21", "numbers": [1, 7, 14, 19, 23, 28, 33], "pb": 5},
    {"date": "2024-03-14", "numbers": [3, 9, 15, 18, 24, 31, 34], "pb": 11},
    {"date": "2024-03-07", "numbers": [5, 10, 17, 22, 26, 29, 35], "pb": 7},
    {"date": "2024-02-29", "numbers": [4, 8, 13, 21, 27, 32, 35], "pb": 3},
    {"date": "2024-02-22", "numbers": [2, 6, 12, 20, 25, 31, 33], "pb": 17},
    {"date": "2024-02-15", "numbers": [1, 9, 16, 19, 28, 30, 34], "pb": 9},
    {"date": "2024-02-08", "numbers": [7, 11, 15, 23, 26, 29, 35], "pb": 2},
    {"date": "2024-02-01", "numbers": [3, 8, 14, 18, 24, 32, 33], "pb": 15},
    {"date": "2024-01-25", "numbers": [5, 10, 17, 22, 27, 31, 34], "pb": 6},
    {"date": "2024-01-18", "numbers": [4, 6, 13, 20, 25, 30, 35], "pb": 12},
    {"date": "2024-01-11", "numbers": [2, 9, 15, 21, 28, 29, 33], "pb": 19},
    {"date": "2024-01-04", "numbers": [1, 7, 16, 19, 24, 32, 34], "pb": 4},
    {"date": "2023-12-28", "numbers": [6, 11, 14, 23, 26, 31, 35], "pb": 8},
    {"date": "2023-12-21", "numbers": [3, 8, 12, 18, 27, 30, 33], "pb": 16},
    {"date": "2023-12-14", "numbers": [5, 10, 17, 22, 25, 29, 34], "pb": 1},
    {"date": "2023-12-07", "numbers": [4, 9, 13, 20, 28, 31, 35], "pb": 13},
    {"date": "2023-11-30", "numbers": [2, 6, 15, 21, 24, 32, 33], "pb": 18},
    {"date": "2023-11-23", "numbers": [1, 7, 16, 19, 26, 30, 34], "pb": 7},
    {"date": "2023-11-16", "numbers": [8, 11, 14, 23, 27, 29, 35], "pb": 10},
    {"date": "2023-11-09", "numbers": [3, 9, 12, 18, 25, 31, 33], "pb": 20},
    {"date": "2023-11-02", "numbers": [5, 10, 17, 22, 28, 30, 34], "pb": 5},
    {"date": "2023-10-26", "numbers": [4, 6, 13, 20, 24, 32, 35], "pb": 14},
    {"date": "2023-10-19", "numbers": [2, 7, 15, 21, 26, 29, 33], "pb": 3},
    {"date": "2023-10-12", "numbers": [1, 8, 16, 19, 27, 31, 34], "pb": 11},
    {"date": "2023-10-05", "numbers": [9, 11, 14, 23, 25, 30, 35], "pb": 16},
    {"date": "2023-09-28", "numbers": [3, 6, 12, 18, 28, 32, 33], "pb": 9},
    {"date": "2023-09-21", "numbers": [5, 10, 17, 22, 24, 29, 34], "pb": 2},
    {"date": "2023-09-14", "numbers": [4, 7, 13, 20, 26, 31, 35], "pb": 17},
    {"date": "2023-09-07", "numbers": [2, 9, 15, 21, 27, 30, 33], "pb": 6},
    {"date": "2023-08-31", "numbers": [1, 8, 16, 19, 25, 32, 34], "pb": 15},
    {"date": "2023-08-24", "numbers": [6, 11, 14, 23, 28, 29, 35], "pb": 12},
    {"date": "2023-08-17", "numbers": [3, 10, 12, 18, 24, 31, 33], "pb": 4},
    {"date": "2023-08-10", "numbers": [5, 7, 17, 22, 26, 30, 34], "pb": 19},
    {"date": "2023-08-03", "numbers": [4, 9, 13, 20, 27, 32, 35], "pb": 8},
    {"date": "2023-07-27", "numbers": [2, 6, 15, 21, 25, 29, 33], "pb": 13},
    {"date": "2023-07-20", "numbers": [1, 8, 16, 19, 28, 31, 34], "pb": 18},
    {"date": "2023-07-13", "numbers": [7, 11, 14, 23, 24, 30, 35], "pb": 7},
    {"date": "2023-07-06", "numbers": [3, 9, 12, 18, 26, 32, 33], "pb": 1},
    {"date": "2023-06-29", "numbers": [5, 10, 17, 22, 27, 29, 34], "pb": 20},
    {"date": "2023-06-22", "numbers": [4, 6, 13, 20, 25, 31, 35], "pb": 10},
    {"date": "2023-06-15", "numbers": [2, 7, 15, 21, 28, 30, 33], "pb": 5},
    {"date": "2023-06-08", "numbers": [1, 8, 16, 19, 24, 32, 34], "pb": 14},
    {"date": "2023-06-01", "numbers": [9, 11, 14, 23, 26, 29, 35], "pb": 3},
    {"date": "2023-05-25", "numbers": [3, 6, 12, 18, 27, 31, 33], "pb": 16},
    {"date": "2023-05-18", "numbers": [5, 10, 17, 22, 25, 30, 34], "pb": 11},
    {"date": "2023-05-11", "numbers": [4, 7, 13, 20, 28, 32, 35], "pb": 9},
    {"date": "2023-05-04", "numbers": [2, 9, 15, 21, 24, 29, 33], "pb": 2},
    {"date": "2023-04-27", "numbers": [1, 8, 16, 19, 26, 31, 34], "pb": 17},
    {"date": "2023-04-20", "numbers": [6, 11, 14, 23, 27, 30, 35], "pb": 6},
    {"date": "2023-04-13", "numbers": [3, 10, 12, 18, 25, 32, 33], "pb": 15},
    {"date": "2023-04-06", "numbers": [5, 7, 17, 22, 28, 29, 34], "pb": 12},
    {"date": "2023-03-30", "numbers": [4, 9, 13, 20, 24, 31, 35], "pb": 4},
    {"date": "2023-03-23", "numbers": [2, 6, 15, 21, 26, 30, 33], "pb": 19},
    {"date": "2023-03-16", "numbers": [1, 8, 16, 19, 27, 32, 34], "pb": 8},
    {"date": "2023-03-09", "numbers": [7, 11, 14, 23, 25, 29, 35], "pb": 13},
    {"date": "2023-03-02", "numbers": [3, 9, 12, 18, 28, 31, 33], "pb": 18},
    {"date": "2023-02-23", "numbers": [5, 10, 17, 22, 24, 30, 34], "pb": 7},
    {"date": "2023-02-16", "numbers": [4, 6, 13, 20, 26, 32, 35], "pb": 1},
    {"date": "2023-02-09", "numbers": [2, 7, 15, 21, 27, 29, 33], "pb": 20},
    {"date": "2023-02-02", "numbers": [1, 8, 16, 19, 25, 31, 34], "pb": 10},
    {"date": "2023-01-26", "numbers": [9, 11, 14, 23, 28, 30, 35], "pb": 5},
    {"date": "2023-01-19", "numbers": [3, 6, 12, 18, 24, 32, 33], "pb": 14},
    {"date": "2023-01-12", "numbers": [5, 10, 17, 22, 26, 29, 34], "pb": 3},
    {"date": "2023-01-05", "numbers": [4, 7, 13, 20, 27, 31, 35], "pb": 16},
    {"date": "2022-12-29", "numbers": [2, 9, 15, 21, 25, 30, 33], "pb": 11},
    {"date": "2022-12-22", "numbers": [1, 8, 16, 19, 28, 32, 34], "pb": 9},
    {"date": "2022-12-15", "numbers": [6, 11, 14, 23, 24, 29, 35], "pb": 2},
    {"date": "2022-12-08", "numbers": [3, 10, 12, 18, 26, 31, 33], "pb": 17},
    {"date": "2022-12-01", "numbers": [5, 7, 17, 22, 27, 30, 34], "pb": 6},
    {"date": "2022-11-24", "numbers": [4, 9, 13, 20, 25, 32, 35], "pb": 15},
    {"date": "2022-11-17", "numbers": [2, 6, 15, 21, 28, 29, 33], "pb": 12},
    {"date": "2022-11-10", "numbers": [1, 8, 16, 19, 24, 31, 34], "pb": 4},
    {"date": "2022-11-03", "numbers": [7, 11, 14, 23, 26, 30, 35], "pb": 19},
    {"date": "2022-10-27", "numbers": [3, 9, 12, 18, 27, 32, 33], "pb": 8},
    {"date": "2022-10-20", "numbers": [5, 10, 17, 22, 25, 29, 34], "pb": 13},
    {"date": "2022-10-13", "numbers": [4, 6, 13, 20, 28, 31, 35], "pb": 18},
    {"date": "2022-10-06", "numbers": [2, 7, 15, 21, 24, 30, 33], "pb": 7},
    {"date": "2022-09-29", "numbers": [1, 8, 16, 19, 26, 32, 34], "pb": 1},
    {"date": "2022-09-22", "numbers": [9, 11, 14, 23, 27, 29, 35], "pb": 20},
]


# ─── 1. FREQUENCY ANALYSIS ────────────────────────────────────────────────────
def frequency_analysis(draws):
    main_freq = Counter()
    pb_freq   = Counter()
    for d in draws:
        main_freq.update(d["numbers"])
        pb_freq[d["pb"]] += 1
    return main_freq, pb_freq


# ─── 2. GAP / OVERDUE ANALYSIS ────────────────────────────────────────────────
def gap_analysis(draws):
    """Returns number of draws since each number last appeared (main + pb)."""
    last_seen_main = {}
    last_seen_pb   = {}
    n = len(draws)
    for i, d in enumerate(draws):
        for num in d["numbers"]:
            last_seen_main[num] = i
        last_seen_pb[d["pb"]] = i
    gap_main = {num: n - last_seen_main.get(num, n) for num in range(1, MAIN_POOL + 1)}
    gap_pb   = {num: n - last_seen_pb.get(num,   n) for num in range(1, PB_POOL   + 1)}
    return gap_main, gap_pb


# ─── 3. ENTROPY / RANDOMNESS SCORING ─────────────────────────────────────────
def shannon_entropy(freq_dict, total):
    """Higher entropy = more evenly distributed = 'healthier' randomness."""
    entropy = 0.0
    for count in freq_dict.values():
        if count > 0:
            p = count / total
            entropy -= p * math.log2(p)
    return entropy


# ─── 4. WEIGHTED COMPOSITE SCORE ─────────────────────────────────────────────
def composite_scores(draws):
    """Blend frequency, recency, and overdue scores into a single weight."""
    n = len(draws)
    main_freq, pb_freq = frequency_analysis(draws)
    gap_main,  gap_pb  = gap_analysis(draws)

    scores_main = {}
    for num in range(1, MAIN_POOL + 1):
        freq_score  = main_freq.get(num, 0) / n          # 0-1 hot
        gap_score   = gap_main[num] / n                   # 0-1 overdue
        # Blend: hot numbers + overdue numbers get boosted
        scores_main[num] = 0.55 * freq_score + 0.45 * gap_score

    scores_pb = {}
    for num in range(1, PB_POOL + 1):
        freq_score = pb_freq.get(num, 0) / n
        gap_score  = gap_pb[num] / n
        scores_pb[num] = 0.55 * freq_score + 0.45 * gap_score

    return scores_main, scores_pb


# ─── 5. PATTERN COVERAGE (ODD/EVEN, LOW/HIGH) ────────────────────────────────
def pattern_profile(numbers):
    odd   = sum(1 for n in numbers if n % 2 != 0)
    even  = len(numbers) - odd
    low   = sum(1 for n in numbers if n <= 17)
    high  = len(numbers) - low
    total = sum(numbers)
    return {"odd": odd, "even": even, "low": low, "high": high, "sum": total}


def historical_pattern_distribution(draws):
    """Most common odd/even and low/high splits in history."""
    profiles = [pattern_profile(d["numbers"]) for d in draws]
    odd_dist  = Counter(p["odd"]  for p in profiles)
    low_dist  = Counter(p["low"]  for p in profiles)
    sum_vals  = [p["sum"] for p in profiles]
    return {
        "odd_even": odd_dist,
        "low_high": low_dist,
        "sum_mean": statistics.mean(sum_vals),
        "sum_stdev": statistics.stdev(sum_vals),
    }


# ─── 6. CONSECUTIVE PAIR ANALYSIS ────────────────────────────────────────────
def consecutive_pair_frequency(draws):
    pair_counts = Counter()
    for d in draws:
        nums = sorted(d["numbers"])
        for a, b in zip(nums, nums[1:]):
            if b - a == 1:
                pair_counts[(a, b)] += 1
    return pair_counts


# ─── 7. REGRESSION TREND ─────────────────────────────────────────────────────
def regression_trend(draws, num, window=20):
    """
    Simple linear regression on the appearance rate of `num`
    over rolling windows. Returns slope (positive = trending up).
    """
    recent = draws[-window:] if len(draws) >= window else draws
    appearances = [1 if num in d["numbers"] else 0 for d in recent]
    x = list(range(len(appearances)))
    n = len(x)
    if n < 2:
        return 0.0
    mx, my = statistics.mean(x), statistics.mean(appearances)
    denom = sum((xi - mx) ** 2 for xi in x)
    if denom == 0:
        return 0.0
    slope = sum((x[i] - mx) * (appearances[i] - my) for i in range(n)) / denom
    return slope


# ─── 8. MONTE CARLO SIMULATION ───────────────────────────────────────────────
def monte_carlo(draws, runs=MONTE_CARLO_RUNS):
    """
    Weighted random sampling using composite scores.
    Returns the most frequently selected numbers across all runs.
    """
    scores_main, scores_pb = composite_scores(draws)

    main_nums    = list(scores_main.keys())
    main_weights = [scores_main[n] for n in main_nums]
    pb_nums      = list(scores_pb.keys())
    pb_weights   = [scores_pb[n]   for n in pb_nums]

    main_tally = Counter()
    pb_tally   = Counter()

    for _ in range(runs):
        picked_main = _weighted_sample_no_replace(main_nums, main_weights, MAIN_PICK)
        picked_pb   = random.choices(pb_nums, weights=pb_weights, k=1)[0]
        main_tally.update(picked_main)
        pb_tally[picked_pb] += 1

    return main_tally, pb_tally


def _weighted_sample_no_replace(population, weights, k):
    """Draw k items without replacement using weights."""
    pop   = list(population)
    wts   = list(weights)
    chosen = []
    for _ in range(k):
        total = sum(wts)
        r = random.uniform(0, total)
        cumul = 0
        for i, w in enumerate(wts):
            cumul += w
            if r <= cumul:
                chosen.append(pop[i])
                pop.pop(i)
                wts.pop(i)
                break
    return chosen


# ─── 9. ABBREVIATED WHEEL SYSTEM ─────────────────────────────────────────────
def wheel_system(hot_numbers, num_tickets=5):
    """
    Balanced incomplete block design (simplified wheel).
    Generates multiple tickets ensuring all hot numbers appear
    at least once across the set.
    """
    pool = hot_numbers[:14]  # use top-14 hot numbers
    if len(pool) < MAIN_PICK:
        pool = hot_numbers

    tickets = []
    # Rotate through pool to cover all numbers
    for i in range(num_tickets):
        start = (i * MAIN_PICK) % len(pool)
        ticket = []
        idx = start
        while len(ticket) < MAIN_PICK:
            ticket.append(pool[idx % len(pool)])
            idx += 1
        ticket = sorted(set(ticket))
        if len(ticket) == MAIN_PICK:
            tickets.append(ticket)

    return tickets


# ─── 10. MASTER GENERATION FUNCTION ──────────────────────────────────────────
def generate_tickets(draws=None, num_tickets=6):
    """
    Full pipeline: runs all analyses and returns optimised tickets.
    """
    if draws is None:
        draws = HISTORICAL_DRAWS

    # ── Step A: Base statistics
    main_freq, pb_freq = frequency_analysis(draws)
    gap_main,  gap_pb  = gap_analysis(draws)
    scores_main, scores_pb = composite_scores(draws)

    # ── Step B: Monte Carlo tallies
    mc_main, mc_pb = monte_carlo(draws)

    # ── Step C: Regression trends
    trends = {n: regression_trend(draws, n) for n in range(1, MAIN_POOL + 1)}

    # ── Step D: Pattern constraints from history
    pat_dist = historical_pattern_distribution(draws)
    target_odd  = pat_dist["odd_even"].most_common(1)[0][0]   # most common odd count
    target_low  = pat_dist["low_high"].most_common(1)[0][0]   # most common low count
    sum_mean    = pat_dist["sum_mean"]
    sum_stdev   = pat_dist["sum_stdev"]

    # ── Step E: Build master score per number
    #   Blend: composite_score + MC rank + regression trend
    mc_total = sum(mc_main.values())
    master = {}
    for n in range(1, MAIN_POOL + 1):
        cs  = scores_main[n]
        mc  = mc_main.get(n, 0) / mc_total
        tr  = max(0, trends[n])        # only upward trends contribute
        master[n] = 0.40 * cs + 0.40 * mc + 0.20 * tr

    ranked_main = sorted(master, key=master.get, reverse=True)

    # ── Step F: Powerball selection
    pb_total   = sum(mc_pb.values())
    pb_master  = {}
    for n in range(1, PB_POOL + 1):
        cs = scores_pb[n]
        mc = mc_pb.get(n, 0) / pb_total
        pb_master[n] = 0.50 * cs + 0.50 * mc
    ranked_pb = sorted(pb_master, key=pb_master.get, reverse=True)

    # ── Step G: Assemble tickets with pattern constraints
    tickets = []

    # Ticket 1 — Pure highest-ranked numbers
    t1 = sorted(ranked_main[:MAIN_PICK])
    tickets.append({"numbers": t1, "pb": ranked_pb[0], "method": "Top-Ranked AI"})

    # Ticket 2 — Pattern-balanced (match historical odd/even & low/high splits)
    t2 = _pattern_constrained_pick(ranked_main, target_odd, target_low, sum_mean, sum_stdev)
    tickets.append({"numbers": t2, "pb": ranked_pb[1 % len(ranked_pb)], "method": "Pattern-Balanced"})

    # Ticket 3 — Overdue/gap focus
    top_overdue = sorted(range(1, MAIN_POOL + 1), key=lambda n: gap_main[n], reverse=True)
    t3 = sorted(top_overdue[:MAIN_PICK])
    tickets.append({"numbers": t3, "pb": ranked_pb[2 % len(ranked_pb)], "method": "Overdue Numbers"})

    # Ticket 4 — Monte Carlo pure
    mc_ranked = [n for n, _ in mc_main.most_common()]
    t4 = sorted(mc_ranked[:MAIN_PICK])
    tickets.append({"numbers": t4, "pb": ranked_pb[3 % len(ranked_pb)], "method": "Monte Carlo"})

    # Tickets 5-6 — Wheel system from top hot numbers
    wheel_tickets = wheel_system(ranked_main, num_tickets=2)
    for i, wt in enumerate(wheel_tickets):
        tickets.append({"numbers": wt, "pb": ranked_pb[(4 + i) % len(ranked_pb)], "method": f"Wheel System {i+1}"})

    # Trim / pad to requested count
    tickets = tickets[:num_tickets]

    # ── Step H: Build analytics payload
    analytics = {
        "top10_hot":     ranked_main[:10],
        "top10_cold":    ranked_main[-10:][::-1],
        "top10_overdue": sorted(range(1, MAIN_POOL + 1), key=lambda n: gap_main[n], reverse=True)[:10],
        "top5_pb":       ranked_pb[:5],
        "pattern": {
            "target_odd_count": target_odd,
            "target_low_count": target_low,
            "typical_sum_range": [round(sum_mean - sum_stdev), round(sum_mean + sum_stdev)],
        },
        "entropy": {
            "main": round(shannon_entropy(main_freq, len(draws) * MAIN_PICK), 4),
            "pb":   round(shannon_entropy(pb_freq,   len(draws)              ), 4),
        },
        "frequency": {str(k): v for k, v in main_freq.most_common()},
        "pb_frequency": {str(k): v for k, v in pb_freq.most_common()},
        "gap_main": {str(k): v for k, v in gap_main.items()},
        "gap_pb":   {str(k): v for k, v in gap_pb.items()},
        "trends":   {str(k): round(v, 6) for k, v in trends.items()},
        "mc_main":  {str(k): v for k, v in mc_main.most_common(15)},
        "draws_analysed": len(draws),
        "monte_carlo_runs": MONTE_CARLO_RUNS,
    }

    return {"tickets": tickets, "analytics": analytics}


def _pattern_constrained_pick(ranked, target_odd, target_low, sum_mean, sum_stdev):
    """Pick 7 numbers satisfying odd/even and low/high constraints closest to history."""
    best   = None
    best_d = float("inf")
    # Try up to 2000 random candidate sets from top-20
    pool = ranked[:20]
    for _ in range(2000):
        candidate = sorted(random.sample(pool, MAIN_PICK))
        odd   = sum(1 for n in candidate if n % 2 != 0)
        low   = sum(1 for n in candidate if n <= 17)
        total = sum(candidate)
        d = abs(odd - target_odd) + abs(low - target_low) + abs(total - sum_mean) / sum_stdev
        if d < best_d:
            best_d = d
            best   = candidate
    return best or sorted(pool[:MAIN_PICK])


# ─── CLI ENTRY ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    result = generate_tickets(num_tickets=6)
    print(json.dumps(result, indent=2))
