// data.js — Simulated historical frequency data for Tuesday Lotto (Pick 6/45)
// Based on statistical distribution for ~1,200 historical draws
// All data is seeded-random to simulate real historical frequency patterns

(function() {
  'use strict';

  // Seeded RNG for reproducible data
  function seededRNG(seed) {
    let s = seed;
    return function() {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 4294967296;
    };
  }

  const rng = seededRNG(20240301);

  // Simulate 1200 historical draws
  const TOTAL_DRAWS = 1200;
  const POOL = 45;
  const PICK = 6;

  function pickNumbers(rngFn) {
    const nums = [];
    const avail = Array.from({length: POOL}, (_, i) => i + 1);
    for (let i = 0; i < PICK; i++) {
      const idx = Math.floor(rngFn() * avail.length);
      nums.push(avail.splice(idx, 1)[0]);
    }
    return nums.sort((a, b) => a - b);
  }

  // Generate historical draws
  const historicalDraws = [];
  for (let i = 0; i < TOTAL_DRAWS; i++) {
    historicalDraws.push({ draw: i + 1, numbers: pickNumbers(rng) });
  }

  // Compute frequency stats
  const frequency = {};
  const lastSeen = {};
  const pairFreq = {};

  for (let n = 1; n <= POOL; n++) {
    frequency[n] = 0;
    lastSeen[n] = 0;
  }

  historicalDraws.forEach((draw, idx) => {
    draw.numbers.forEach(n => {
      frequency[n]++;
      lastSeen[n] = idx + 1;
    });
    // Pair co-occurrence
    for (let i = 0; i < draw.numbers.length; i++) {
      for (let j = i + 1; j < draw.numbers.length; j++) {
        const key = `${draw.numbers[i]}-${draw.numbers[j]}`;
        pairFreq[key] = (pairFreq[key] || 0) + 1;
      }
    }
  });

  // Sort top pairs
  const topPairs = Object.entries(pairFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([pair, count]) => {
      const [a, b] = pair.split('-').map(Number);
      return { a, b, count };
    });

  // Expected frequency
  const expectedFreq = (TOTAL_DRAWS * PICK) / POOL;

  // Build number stats array
  const numberStats = Array.from({length: POOL}, (_, i) => {
    const n = i + 1;
    const freq = frequency[n];
    const pct = ((freq / (TOTAL_DRAWS * PICK)) * 100).toFixed(2);
    const overdueDraws = TOTAL_DRAWS - lastSeen[n];
    const expectedGap = POOL / PICK; // ~7.5 draws between appearances
    const overdueScore = Math.round((overdueDraws / expectedGap) * 10) / 10;
    const zScore = ((freq - expectedFreq) / Math.sqrt(expectedFreq * (1 - PICK/POOL))).toFixed(2);

    let temp;
    if (freq > expectedFreq * 1.1) temp = 'hot';
    else if (freq < expectedFreq * 0.9) temp = 'cold';
    else temp = 'warm';

    return { n, freq, pct: parseFloat(pct), overdueDraws, overdueScore, lastSeen: lastSeen[n], temp, zScore: parseFloat(zScore) };
  });

  // Decade breakdown
  const decades = [
    { label: '1–9', min: 1, max: 9 },
    { label: '10–19', min: 10, max: 19 },
    { label: '20–29', min: 20, max: 29 },
    { label: '30–39', min: 30, max: 39 },
    { label: '40–45', min: 40, max: 45 },
  ];

  const decadeStats = decades.map(d => {
    let actual = 0;
    for (let n = d.min; n <= d.max; n++) actual += frequency[n];
    const size = d.max - d.min + 1;
    const expected = (TOTAL_DRAWS * PICK * size) / POOL;
    return { ...d, actual, expected: Math.round(expected) };
  });

  // Shannon entropy
  const totalAppearances = TOTAL_DRAWS * PICK;
  let entropy = 0;
  numberStats.forEach(s => {
    const p = s.freq / totalAppearances;
    if (p > 0) entropy -= p * Math.log2(p);
  });
  const maxEntropy = Math.log2(POOL);
  const uniformityIndex = (entropy / maxEntropy).toFixed(4);

  // Average draw sum
  const avgSum = (historicalDraws.reduce((acc, d) => acc + d.numbers.reduce((a, b) => a + b, 0), 0) / TOTAL_DRAWS).toFixed(1);

  // Consecutive rate
  let consecCount = 0;
  historicalDraws.forEach(d => {
    const nums = d.numbers;
    for (let i = 0; i < nums.length - 1; i++) {
      if (nums[i+1] - nums[i] === 1) { consecCount++; break; }
    }
  });
  const consecRate = ((consecCount / TOTAL_DRAWS) * 100).toFixed(1);

  // Expose globally
  window.LottoData = {
    TOTAL_DRAWS,
    POOL,
    PICK,
    historicalDraws,
    numberStats,
    topPairs,
    decadeStats,
    entropy: entropy.toFixed(4),
    maxEntropy: maxEntropy.toFixed(4),
    uniformityIndex,
    avgSum,
    consecRate,
    expectedFreq: expectedFreq.toFixed(1),
    seededRNG,
  };

})();
