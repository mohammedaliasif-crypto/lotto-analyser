// app.js — Lotto Analyser Pro — Full Application Logic
'use strict';

const D = window.LottoData;
const charts = {};

// ============================================================
// UTILITIES
// ============================================================
function C(n, r) {
  if (r > n) return 0;
  if (r === 0 || r === n) return 1;
  r = Math.min(r, n - r);
  let result = 1;
  for (let i = 0; i < r; i++) result = result * (n - i) / (i + 1);
  return Math.round(result);
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng ? Math.floor(rng() * (i + 1)) : Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(pool, n) {
  return shuffle([...pool]).slice(0, n).sort((a, b) => a - b);
}

function sum(arr) { return arr.reduce((a, b) => a + b, 0); }

function ballClass(n) {
  const s = D.numberStats.find(x => x.n === n);
  return s ? s.temp : 'warm';
}

function createBalls(nums) {
  return nums.map(n => `<div class="ball ${ballClass(n)}">${n}</div>`).join('');
}

function createPickBalls(nums, size = 36) {
  return nums.map(n => `<div class="ball ${ballClass(n)}" style="width:${size}px;height:${size}px">${n}</div>`).join('');
}

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

const CHART_DEFAULTS = {
  color: '#e8e0f8',
  plugins: { legend: { labels: { color: '#9d8ec4', font: { size: 11 } } }, tooltip: { backgroundColor: '#1a1230', borderColor: '#3d2a6e', borderWidth: 1 } },
  scales: {
    x: { ticks: { color: '#9d8ec4', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
    y: { ticks: { color: '#9d8ec4', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
  }
};

// ============================================================
// TAB NAVIGATION
// ============================================================
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
    if (tab === 'deepmath') initDeepMath();
  });
});

// ============================================================
// TAB 1: OVERVIEW
// ============================================================
function initOverview() {
  const metrics = [
    { label: 'Shannon Entropy', value: D.entropy, sub: `Max possible: ${D.maxEntropy} bits` },
    { label: 'Uniformity Index', value: D.uniformityIndex, sub: '1.0 = perfectly uniform distribution' },
    { label: 'Avg Draw Sum', value: D.avgSum, sub: 'Theoretical mean ≈ 138.0' },
    { label: 'Consecutive Rate', value: `${D.consecRate}%`, sub: 'Draws with ≥1 consecutive pair' },
  ];

  document.getElementById('overviewMetrics').innerHTML = metrics.map(m => `
    <div class="metric-card">
      <div class="metric-label">${m.label}</div>
      <div class="metric-value">${m.value}</div>
      <div class="metric-sub">${m.sub}</div>
    </div>`).join('');

  // Sum histogram from 5000 simulated draws
  const simRNG = D.seededRNG(42);
  const sums = Array(271).fill(0); // sums 21-270
  for (let i = 0; i < 5000; i++) {
    const nums = [];
    const pool = Array.from({length: 45}, (_, j) => j + 1);
    for (let k = 0; k < 6; k++) {
      const idx = Math.floor(simRNG() * pool.length);
      nums.push(pool.splice(idx, 1)[0]);
    }
    const s = sum(nums);
    if (s >= 21 && s <= 270) sums[s - 21]++;
  }

  const bucketSize = 10;
  const buckets = [];
  const bucketLabels = [];
  for (let b = 60; b <= 230; b += bucketSize) {
    let cnt = 0;
    for (let j = b; j < b + bucketSize && j - 21 < sums.length; j++) cnt += sums[j - 21];
    buckets.push(cnt);
    bucketLabels.push(`${b}–${b + bucketSize - 1}`);
  }

  const sweetStart = bucketLabels.findIndex(l => parseInt(l) >= 115);
  const sweetEnd = bucketLabels.findIndex(l => parseInt(l) >= 175);
  const bgColors = bucketLabels.map((l, i) => {
    const v = parseInt(l);
    return (v >= 115 && v < 175) ? 'rgba(124,58,237,0.7)' : 'rgba(124,58,237,0.3)';
  });

  destroyChart('sumHistogram');
  charts['sumHistogram'] = new Chart(document.getElementById('sumHistogram'), {
    type: 'bar',
    data: {
      labels: bucketLabels,
      datasets: [{ label: 'Draw Count', data: buckets, backgroundColor: bgColors, borderColor: 'rgba(168,85,247,0.6)', borderWidth: 1 }]
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false }, annotation: {} },
      scales: { ...CHART_DEFAULTS.scales, x: { ...CHART_DEFAULTS.scales.x, ticks: { ...CHART_DEFAULTS.scales.x.ticks, maxRotation: 45 } } }
    }
  });

  // Decade distribution
  const decadeLabels = D.decadeStats.map(d => d.label);
  const decadeActual = D.decadeStats.map(d => d.actual);
  const decadeExpected = D.decadeStats.map(d => d.expected);

  destroyChart('decadeChart');
  charts['decadeChart'] = new Chart(document.getElementById('decadeChart'), {
    type: 'bar',
    data: {
      labels: decadeLabels,
      datasets: [
        { label: 'Actual', data: decadeActual, backgroundColor: 'rgba(124,58,237,0.7)', borderColor: '#7c3aed', borderWidth: 1 },
        { label: 'Expected', data: decadeExpected, backgroundColor: 'rgba(16,185,129,0.3)', borderColor: '#10b981', borderWidth: 2, type: 'line', tension: 0.3, pointRadius: 4 }
      ]
    },
    options: { ...CHART_DEFAULTS }
  });
}

// ============================================================
// TAB 2: FREQUENCY
// ============================================================
let currentSort = 'frequency';

function renderFreqTable() {
  let stats = [...D.numberStats];
  if (currentSort === 'frequency') stats.sort((a, b) => b.freq - a.freq);
  else if (currentSort === 'overdue') stats.sort((a, b) => b.overdueScore - a.overdueScore);
  else stats.sort((a, b) => a.n - b.n);

  const maxFreq = Math.max(...stats.map(s => s.freq));
  const tbody = document.getElementById('freqTableBody');
  tbody.innerHTML = stats.map((s, i) => {
    const barWidth = Math.round((s.freq / maxFreq) * 140);
    const overdueClass = s.overdueScore > 8 ? 'overdue-high' : s.overdueScore > 4 ? 'overdue-mid' : 'overdue-low';
    return `<tr>
      <td style="color:var(--text-muted);font-size:0.78rem">${i+1}</td>
      <td><span class="num-badge">${s.n}</span></td>
      <td>
        <div class="freq-bar-wrap">
          <div class="freq-bar ${s.temp}" style="width:${barWidth}px"></div>
          <span class="freq-bar-val">${s.freq}</span>
        </div>
      </td>
      <td style="color:var(--text-muted)">${s.pct}%</td>
      <td style="color:var(--text-muted)">Draw #${s.lastSeen}</td>
      <td class="${overdueClass} overdue-score">${s.overdueScore}</td>
      <td><span class="temp-badge ${s.temp}">${s.temp.toUpperCase()}</span></td>
    </tr>`;
  }).join('');
}

function initFrequency() {
  renderFreqTable();

  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.sort;
      renderFreqTable();
    });
  });

  // Pair matrix
  const matrix = document.getElementById('pairMatrix');
  matrix.innerHTML = D.topPairs.map(p => {
    const rating = p.count > 20 ? '⭐⭐⭐' : p.count > 15 ? '⭐⭐' : '⭐';
    return `<div class="pair-cell">
      <div class="pair-nums">${p.a} — ${p.b}</div>
      <div class="pair-count">${p.count} times</div>
      <div class="pair-rating">${rating}</div>
    </div>`;
  }).join('');

  // Decade freq vs expected
  destroyChart('decadeFreqChart');
  charts['decadeFreqChart'] = new Chart(document.getElementById('decadeFreqChart'), {
    type: 'bar',
    data: {
      labels: D.decadeStats.map(d => d.label),
      datasets: [
        { label: 'Actual Frequency', data: D.decadeStats.map(d => d.actual), backgroundColor: 'rgba(124,58,237,0.7)', borderColor: '#7c3aed', borderWidth: 1 },
        { label: 'Expected Frequency', data: D.decadeStats.map(d => d.expected), backgroundColor: 'transparent', borderColor: '#10b981', borderWidth: 2, type: 'line', tension: 0.3, pointRadius: 5, pointBackgroundColor: '#10b981' }
      ]
    },
    options: { ...CHART_DEFAULTS, plugins: { ...CHART_DEFAULTS.plugins } }
  });
}

// ============================================================
// TAB 3: GENERATOR
// ============================================================
let selectedMethod = 'balanced';

function generateLine(method, sumTarget, oeFilter, lhFilter) {
  const pool = Array.from({length: 45}, (_, i) => i + 1);
  const stats = D.numberStats;
  let weights = pool.map(n => 1);

  if (method === 'hot') {
    const maxF = Math.max(...stats.map(s => s.freq));
    weights = pool.map(n => {
      const s = stats.find(x => x.n === n);
      return s ? (s.freq / maxF) * 3 + 0.5 : 1;
    });
  } else if (method === 'cold') {
    const maxF = Math.max(...stats.map(s => s.freq));
    weights = pool.map(n => {
      const s = stats.find(x => x.n === n);
      return s ? ((maxF - s.freq) / maxF) * 3 + 0.5 : 1;
    });
  } else if (method === 'overdue') {
    const maxO = Math.max(...stats.map(s => s.overdueScore));
    weights = pool.map(n => {
      const s = stats.find(x => x.n === n);
      return s ? (s.overdueScore / maxO) * 4 + 0.5 : 1;
    });
  } else if (method === 'entropy') {
    // max entropy = most uniform = boost underrepresented
    const avgF = D.expectedFreq;
    weights = pool.map(n => {
      const s = stats.find(x => x.n === n);
      if (!s) return 1;
      const diff = parseFloat(avgF) - s.freq;
      return Math.max(0.3, 1 + diff * 0.05);
    });
  }

  // Weighted random pick
  function weightedPick(exclude) {
    const avail = pool.filter(n => !exclude.includes(n));
    const ws = avail.map(n => weights[n - 1]);
    const total = ws.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < avail.length; i++) {
      r -= ws[i];
      if (r <= 0) return avail[i];
    }
    return avail[avail.length - 1];
  }

  // Generate with filters (max 200 attempts)
  for (let attempt = 0; attempt < 200; attempt++) {
    let nums = [];
    if (method === 'random') {
      nums = pickRandom(pool, 6);
    } else {
      while (nums.length < 6) nums.push(weightedPick(nums));
      nums.sort((a, b) => a - b);
    }

    const s = sum(nums);
    // Sum filter
    if (sumTarget === 'low' && (s < 80 || s > 115)) continue;
    if (sumTarget === 'sweet' && (s < 115 || s > 175)) continue;
    if (sumTarget === 'high' && (s < 175 || s > 210)) continue;

    // Odd/even
    const odds = nums.filter(n => n % 2 !== 0).length;
    const evens = 6 - odds;
    if (oeFilter === '3-3' && !(odds === 3 && evens === 3)) continue;
    if (oeFilter === '4-2' && !(odds === 4 && evens === 2)) continue;
    if (oeFilter === '2-4' && !(odds === 2 && evens === 4)) continue;

    // Low/high
    const lows = nums.filter(n => n <= 22).length;
    const highs = 6 - lows;
    if (lhFilter === '3-3' && !(lows === 3 && highs === 3)) continue;
    if (lhFilter === '4-2' && !(lows === 4 && highs === 2)) continue;
    if (lhFilter === '2-4' && !(lows === 2 && highs === 4)) continue;

    return nums;
  }

  // Fallback: pure random
  return pickRandom(pool, 6);
}

function scoreSet(nums) {
  const s = sum(nums);
  let score = 50;
  // Sum sweet spot
  if (s >= 115 && s <= 175) score += 15;
  else if (s >= 90 && s <= 200) score += 5;
  // Odd/even
  const odds = nums.filter(n => n % 2 !== 0).length;
  if (odds === 3) score += 10;
  else if (odds === 2 || odds === 4) score += 5;
  // Low/high
  const lows = nums.filter(n => n <= 22).length;
  if (lows >= 2 && lows <= 4) score += 10;
  // No consecutive pair
  let hasConsec = false;
  for (let i = 0; i < nums.length - 1; i++) if (nums[i+1] - nums[i] === 1) { hasConsec = true; break; }
  if (!hasConsec) score += 10;
  // Decade spread
  const decades = new Set(nums.map(n => Math.ceil(n / 10)));
  if (decades.size >= 4) score += 5;
  return Math.min(100, score);
}

function initGenerator() {
  document.querySelectorAll('.method-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedMethod = btn.dataset.method;
    });
  });

  const lineCountSlider = document.getElementById('lineCount');
  const lineCountVal = document.getElementById('lineCountVal');
  lineCountSlider.addEventListener('input', () => { lineCountVal.textContent = lineCountSlider.value; });

  document.getElementById('generateBtn').addEventListener('click', () => {
    const count = parseInt(lineCountSlider.value);
    const sumTarget = document.getElementById('sumTarget').value;
    const oeFilter = document.getElementById('oddEvenFilter').value;
    const lhFilter = document.getElementById('lowhighFilter').value;

    const lines = [];
    for (let i = 0; i < count; i++) lines.push(generateLine(selectedMethod, sumTarget, oeFilter, lhFilter));

    const container = document.getElementById('generatedLines');
    container.innerHTML = lines.map((nums, i) => {
      const sc = scoreSet(nums);
      const s = sum(nums);
      return `<div class="gen-line">
        <span class="gen-line-num">#${i+1}</span>
        <div class="gen-balls">${createBalls(nums)}</div>
        <div class="gen-line-meta">
          <div class="gen-line-score">Score: ${sc}/100</div>
          <div class="score-bar-wrap"><div class="score-bar" style="width:${sc}%"></div></div>
          <div class="gen-line-sum">Sum: ${s}</div>
        </div>
      </div>`;
    }).join('');
  });
}

// ============================================================
// TAB 4: ANALYSER
// ============================================================
let pickedNums = [];

function initAnalyser() {
  const picker = document.getElementById('numberPicker');
  picker.innerHTML = Array.from({length: 45}, (_, i) => i + 1).map(n =>
    `<div class="pick-ball" data-n="${n}">${n}</div>`
  ).join('');

  picker.addEventListener('click', e => {
    const ball = e.target.closest('.pick-ball');
    if (!ball) return;
    const n = parseInt(ball.dataset.n);
    if (pickedNums.includes(n)) {
      pickedNums = pickedNums.filter(x => x !== n);
      ball.classList.remove('selected');
    } else if (pickedNums.length < 6) {
      pickedNums.push(n);
      ball.classList.add('selected');
    }
  });

  document.getElementById('clearPick').addEventListener('click', () => {
    pickedNums = [];
    document.querySelectorAll('.pick-ball.selected').forEach(b => b.classList.remove('selected'));
    document.getElementById('analysisResult').classList.add('hidden');
  });

  document.getElementById('analysePick').addEventListener('click', () => {
    if (pickedNums.length !== 6) {
      alert('Please select exactly 6 numbers.');
      return;
    }
    analyseNumbers([...pickedNums].sort((a, b) => a - b));
  });
}

function analyseNumbers(nums) {
  const s = sum(nums);
  const odds = nums.filter(n => n % 2 !== 0).length;
  const evens = 6 - odds;
  const lows = nums.filter(n => n <= 22).length;
  const highs = 6 - lows;
  let consecPairs = 0;
  for (let i = 0; i < nums.length - 1; i++) if (nums[i+1] - nums[i] === 1) consecPairs++;
  const decadeSet = new Set(nums.map(n => Math.ceil(n / 10)));
  const avgFreq = nums.reduce((acc, n) => {
    const s = D.numberStats.find(x => x.n === n);
    return acc + (s ? s.freq : 0);
  }, 0) / 6;
  const totalFreq = parseFloat(D.expectedFreq);
  const temperature = nums.map(n => D.numberStats.find(x => x.n === n)?.temp || 'warm');
  const hotCount = temperature.filter(t => t === 'hot').length;
  const coldCount = temperature.filter(t => t === 'cold').length;

  const checks = [
    { icon: '📊', label: 'Sum Range', detail: `Sum = ${s} — ${s >= 115 && s <= 175 ? '✅ Sweet spot (115–175)' : s >= 90 && s <= 200 ? '⚠ Acceptable range' : '❌ Outside normal range'}` },
    { icon: '⚖', label: 'Odd/Even Balance', detail: `${odds} odd / ${evens} even — ${odds === 3 ? '✅ Ideal 3/3 split' : (odds === 2 || odds === 4) ? '✅ Good balance' : '⚠ Imbalanced'}` },
    { icon: '📍', label: 'Low/High Split', detail: `${lows} low (1–22) / ${highs} high (23–45) — ${lows >= 2 && lows <= 4 ? '✅ Balanced' : '⚠ Skewed'}` },
    { icon: '🔗', label: 'Consecutive Pairs', detail: `${consecPairs} consecutive pair(s) — ${consecPairs === 0 ? '✅ None (common)' : consecPairs === 1 ? '✅ One pair (most common)' : '⚠ Multiple consecutive'}` },
    { icon: '🗂', label: 'Decade Coverage', detail: `${decadeSet.size} of 5 decades covered — ${decadeSet.size >= 4 ? '✅ Good spread' : decadeSet.size === 3 ? '⚠ Limited spread' : '❌ Poor spread'}` },
    { icon: '🌡', label: 'Temperature Mix', detail: `${hotCount} hot, ${6 - hotCount - coldCount} warm, ${coldCount} cold — ${hotCount <= 3 && coldCount <= 3 ? '✅ Balanced mix' : '⚠ Skewed to ' + (hotCount > 3 ? 'hot' : 'cold')}` },
    { icon: '📈', label: 'Avg Number Frequency', detail: `Avg ${avgFreq.toFixed(1)} appearances vs expected ${totalFreq} — ${Math.abs(avgFreq - totalFreq) < 5 ? '✅ Near average' : '⚠ Deviation from mean'}` },
    { icon: '🎯', label: 'Pair Co-occurrence', detail: (() => {
      let topMatch = null;
      let topCount = 0;
      for (let i = 0; i < nums.length; i++) for (let j = i+1; j < nums.length; j++) {
        const p = D.topPairs.find(p => (p.a === nums[i] && p.b === nums[j]) || (p.a === nums[j] && p.b === nums[i]));
        if (p && p.count > topCount) { topMatch = p; topCount = p.count; }
      }
      return topMatch ? `Pair ${topMatch.a}–${topMatch.b} has co-occurred ${topMatch.count}× in history` : 'No historically frequent pairs in selection';
    })() }
  ];

  const sc = scoreSet(nums);
  const scoreColor = sc >= 75 ? '#10b981' : sc >= 50 ? '#f59e0b' : '#ef4444';
  const scoreDesc = sc >= 75 ? 'Strong statistical profile' : sc >= 50 ? 'Average statistical profile' : 'Weak statistical profile';

  const divisions = [
    { div: 'Div 1', match: '6 main', odds: C(45,6), chance: 1/C(45,6) },
    { div: 'Div 2', match: '5 + 1 supp', odds: 678755, chance: 1/678755 },
    { div: 'Div 3', match: '5 main', odds: 36689, chance: 1/36689 },
    { div: 'Div 4', match: '4 main', odds: 733, chance: 1/733 },
    { div: 'Div 5', match: '3 + 1 supp', odds: 297, chance: 1/297 },
    { div: 'Div 6', match: '3 main', odds: 57, chance: 1/57 },
  ];

  const resultEl = document.getElementById('analysisResult');
  resultEl.classList.remove('hidden');
  resultEl.innerHTML = `
    <div class="analysis-checks">${checks.map(c => `
      <div class="check-item">
        <div class="check-icon">${c.icon}</div>
        <div><div class="check-label">${c.label}</div><div class="check-detail">${c.detail}</div></div>
      </div>`).join('')}
    </div>
    <div class="score-display">
      <div class="gen-balls" style="justify-content:center;display:flex;margin-bottom:16px">${createPickBalls(nums, 40)}</div>
      <div class="score-big" style="color:${scoreColor}">${sc}<span style="font-size:1.5rem;color:var(--text-muted)">/100</span></div>
      <div class="score-label">Statistical Score</div>
      <div class="score-desc">${scoreDesc}</div>
    </div>
    <div class="chart-card">
      <h3 class="chart-title">Prize Division Probabilities</h3>
      <table class="prize-table">
        <thead><tr><th>Division</th><th>Match</th><th>Odds</th><th>Probability</th></tr></thead>
        <tbody>${divisions.map(d => `
          <tr class="${d.div === 'Div 1' ? 'div1-row' : ''}">
            <td>${d.div}</td>
            <td>${d.match}</td>
            <td>1 in ${d.odds.toLocaleString()}</td>
            <td>${(d.chance * 100).toFixed(6)}%</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;

  // Store picked nums for Monte Carlo
  window._analyserPick = nums;
}

// ============================================================
// TAB 5: MONTE CARLO
// ============================================================
function initMonteCarlo() {
  document.getElementById('runMC').addEventListener('click', runMonteCarlo);
}

async function runMonteCarlo() {
  const drawCount = parseInt(document.getElementById('mcDraws').value);
  const statusEl = document.getElementById('mcStatus');
  const resultsEl = document.getElementById('mcResults');

  statusEl.classList.remove('hidden');
  statusEl.innerHTML = `<span class="loading-spinner"></span>Running ${drawCount.toLocaleString()} simulated draws…<div class="progress-wrap" style="margin-top:10px"><div class="progress-bar" id="mcProgress" style="width:0%"></div></div>`;
  resultsEl.classList.add('hidden');

  await new Promise(r => setTimeout(r, 50));

  const sumCounts = {};
  const oddCounts = [0,0,0,0,0,0,0]; // 0–6 odds
  const divMatches = [0,0,0,0,0,0]; // Div1-Div6
  const myPick = window._analyserPick || null;
  const pool = Array.from({length: 45}, (_, i) => i + 1);

  const BATCH = 1000;
  for (let batch = 0; batch < drawCount; batch += BATCH) {
    const end = Math.min(batch + BATCH, drawCount);
    for (let i = batch; i < end; i++) {
      const nums = pickRandom(pool, 6);
      const s = sum(nums);
      sumCounts[s] = (sumCounts[s] || 0) + 1;
      const odds = nums.filter(n => n % 2 !== 0).length;
      oddCounts[odds]++;

      if (myPick) {
        const matchCount = nums.filter(n => myPick.includes(n)).length;
        // Simulate supplementaries (2 random from remaining)
        const supp = pickRandom(pool.filter(n => !nums.includes(n)), 2);
        const suppMatch = supp.filter(n => myPick.includes(n)).length;
        if (matchCount === 6) divMatches[0]++;
        else if (matchCount === 5 && suppMatch >= 1) divMatches[1]++;
        else if (matchCount === 5) divMatches[2]++;
        else if (matchCount === 4) divMatches[3]++;
        else if (matchCount === 3 && suppMatch >= 1) divMatches[4]++;
        else if (matchCount === 3) divMatches[5]++;
      }
    }
    const pct = Math.round((end / drawCount) * 100);
    document.getElementById('mcProgress').style.width = pct + '%';
    await new Promise(r => setTimeout(r, 0));
  }

  statusEl.classList.add('hidden');
  resultsEl.classList.remove('hidden');

  // Sum chart
  const allSums = Object.keys(sumCounts).map(Number).sort((a, b) => a - b);
  const buckets = {};
  allSums.forEach(s => {
    const b = Math.floor(s / 10) * 10;
    buckets[b] = (buckets[b] || 0) + sumCounts[s];
  });
  const bKeys = Object.keys(buckets).map(Number).sort((a, b) => a - b);

  destroyChart('mcSumChart');
  charts['mcSumChart'] = new Chart(document.getElementById('mcSumChart'), {
    type: 'bar',
    data: {
      labels: bKeys.map(k => `${k}–${k+9}`),
      datasets: [{ label: 'Draws', data: bKeys.map(k => buckets[k]), backgroundColor: 'rgba(124,58,237,0.65)', borderColor: '#7c3aed', borderWidth: 1 }]
    },
    options: { ...CHART_DEFAULTS, plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } } }
  });

  // Odd count chart
  destroyChart('mcOddChart');
  charts['mcOddChart'] = new Chart(document.getElementById('mcOddChart'), {
    type: 'bar',
    data: {
      labels: ['0 odd','1 odd','2 odd','3 odd','4 odd','5 odd','6 odd'],
      datasets: [{ label: '%', data: oddCounts.map(c => ((c/drawCount)*100).toFixed(2)), backgroundColor: ['rgba(59,130,246,0.7)','rgba(59,130,246,0.7)','rgba(124,58,237,0.7)','rgba(16,185,129,0.7)','rgba(124,58,237,0.7)','rgba(249,115,22,0.7)','rgba(239,68,68,0.7)'], borderWidth: 1 }]
    },
    options: { ...CHART_DEFAULTS, plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } } }
  });

  // My pick results
  const pickResultEl = document.getElementById('mcPickResults');
  if (myPick) {
    const divNames = ['Division 1 (6 match)','Division 2 (5+supp)','Division 3 (5 match)','Division 4 (4 match)','Division 5 (3+supp)','Division 6 (3 match)'];
    pickResultEl.innerHTML = `
      <div class="mc-pick-title">Your Pick Results: <span style="color:var(--accent-bright)">${myPick.join(', ')}</span></div>
      ${divNames.map((name, i) => `
        <div class="mc-div-row">
          <span>${name}</span>
          <span style="color:${divMatches[i] > 0 ? 'var(--green)' : 'var(--text-muted)'}">
            ${divMatches[i]} times (${((divMatches[i]/drawCount)*100).toFixed(4)}%)
          </span>
        </div>`).join('')}`;
  } else {
    pickResultEl.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem">Select numbers in the Analyser tab to see how your pick performs in the simulation.</p>`;
  }
}

// ============================================================
// TAB 6: WHEEL
// ============================================================
let wheelNums = [];

function initWheel() {
  const picker = document.getElementById('wheelPicker');
  picker.innerHTML = Array.from({length: 45}, (_, i) => i + 1).map(n =>
    `<div class="pick-ball" data-n="${n}">${n}</div>`
  ).join('');

  picker.addEventListener('click', e => {
    const ball = e.target.closest('.pick-ball');
    if (!ball) return;
    const n = parseInt(ball.dataset.n);
    if (wheelNums.includes(n)) {
      wheelNums = wheelNums.filter(x => x !== n);
      ball.classList.remove('selected');
    } else if (wheelNums.length < 10) {
      wheelNums.push(n);
      ball.classList.add('selected');
    }
  });

  document.getElementById('clearWheel').addEventListener('click', () => {
    wheelNums = [];
    document.querySelectorAll('#wheelPicker .pick-ball.selected').forEach(b => b.classList.remove('selected'));
    document.getElementById('wheelResult').classList.add('hidden');
  });

  document.getElementById('generateWheel').addEventListener('click', () => {
    if (wheelNums.length < 7 || wheelNums.length > 10) {
      alert('Please select 7–10 numbers for a covering wheel.');
      return;
    }
    generateCoveringWheel([...wheelNums].sort((a, b) => a - b));
  });
}

function generateCoveringWheel(nums) {
  // Generate all C(n,6) combinations
  const lines = [];
  const n = nums.length;
  function combo(start, current) {
    if (current.length === 6) { lines.push([...current]); return; }
    for (let i = start; i < n; i++) combo(i + 1, [...current, nums[i]]);
  }
  combo(0, []);

  const costPerLine = 1.30;
  const totalCost = (lines.length * costPerLine).toFixed(2);

  const resultEl = document.getElementById('wheelResult');
  resultEl.classList.remove('hidden');
  resultEl.innerHTML = `
    <div class="wheel-info">
      <div class="wheel-stat-row"><span>Selected Numbers</span><span class="wheel-stat-val">${nums.join(', ')}</span></div>
      <div class="wheel-stat-row"><span>Total Lines</span><span class="wheel-stat-val">${lines.length}</span></div>
      <div class="wheel-stat-row"><span>Total Cost (AUD $1.30/line)</span><span class="wheel-stat-val">$${totalCost}</span></div>
      <div class="wheel-stat-row"><span>Combination Formula</span><span class="wheel-stat-val">C(${nums.length},6) = ${lines.length}</span></div>
    </div>
    <div class="wheel-guarantee">
      ✅ Div 1 Guarantee: If all ${nums.length} selected numbers are drawn, at least one line will match all 6 main numbers.
    </div>
    <div class="wheel-lines">${lines.map((line, i) => `
      <div class="wheel-line">
        <span class="wheel-line-num">#${i+1}</span>
        <div class="gen-balls">${createBalls(line)}</div>
        <span style="margin-left:auto;color:var(--text-muted);font-size:0.75rem">Sum: ${sum(line)}</span>
      </div>`).join('')}
    </div>`;
}

// ============================================================
// TAB 7: DEEP MATH
// ============================================================
function initDeepMath() {
  // Combinatorics
  const combos = [
    { label: 'C(45,6) — Full game', val: C(45,6).toLocaleString(), desc: 'Total unique picks' },
    { label: 'C(45,5) — 5 from 45', val: C(45,5).toLocaleString(), desc: 'Div 3 base combinations' },
    { label: 'C(45,4) — 4 from 45', val: C(45,4).toLocaleString(), desc: 'Div 4 base combinations' },
    { label: 'C(45,3) — 3 from 45', val: C(45,3).toLocaleString(), desc: 'Div 6 base combinations' },
    { label: 'C(45,2) — 2 from 45', val: C(45,2).toLocaleString(), desc: 'Possible pairs' },
    { label: 'C(6,3) — 3 from pick', val: C(6,3).toLocaleString(), desc: 'Ways to get 3 from your pick' },
  ];
  document.getElementById('combinatoricsTable').innerHTML = combos.map(c => `
    <div class="combo-row">
      <span>${c.label}<br><span style="font-size:0.72rem;color:var(--text-muted)">${c.desc}</span></span>
      <span class="combo-val">${c.val}</span>
    </div>`).join('');

  // Entropy analysis
  const maxH = Math.log2(45);
  const currentH = parseFloat(D.entropy);
  const deficit = (maxH - currentH).toFixed(4);
  const fillPct = Math.round((currentH / maxH) * 100);
  document.getElementById('entropyAnalysis').innerHTML = `
    <div class="entropy-row">
      <div class="entropy-label">Current Shannon Entropy</div>
      <div class="entropy-val">${D.entropy} bits</div>
      <div class="entropy-bar-wrap"><div class="entropy-bar" style="width:${fillPct}%"></div></div>
    </div>
    <div class="entropy-row">
      <div class="entropy-label">Maximum Possible Entropy (perfectly uniform)</div>
      <div class="entropy-val">${maxH.toFixed(4)} bits</div>
    </div>
    <div class="entropy-row">
      <div class="entropy-label">Entropy Deficit</div>
      <div class="entropy-val" style="color:var(--gold)">${deficit} bits</div>
      <div class="entropy-bar-wrap"><div class="entropy-bar" style="width:${(parseFloat(deficit)/maxH*100).toFixed(1)}%;background:linear-gradient(90deg,var(--gold),var(--warm))"></div></div>
    </div>
    <div class="entropy-row">
      <div class="entropy-label">Uniformity Index</div>
      <div class="entropy-val">${D.uniformityIndex} <span style="font-size:0.75rem;color:var(--text-muted)">(1.0 = perfect)</span></div>
    </div>
    <div style="font-size:0.75rem;color:var(--text-muted);margin-top:8px;line-height:1.6">
      Entropy measures the unpredictability of number selection. A perfect lottery would have entropy = ${maxH.toFixed(2)} bits (all numbers equally likely). The current deficit of ${deficit} bits suggests minor variance from uniformity — consistent with a small historical sample.
    </div>`;

  // Expected value
  // Approximate prize pool data for Tuesday Lotto
  const ticketPrice = 1.30;
  const divOdds = [C(45,6), 678755, 36689, 733, 297, 57];
  const divPrizes = [1000000, 6500, 4500, 300, 21, 12]; // approx average prizes AUD
  let expectedReturn = 0;
  divOdds.forEach((odds, i) => expectedReturn += divPrizes[i] / odds);
  const rtp = ((expectedReturn / ticketPrice) * 100).toFixed(2);
  const houseEdge = (100 - parseFloat(rtp)).toFixed(2);

  document.getElementById('evAnalysis').innerHTML = `
    <div class="ev-row"><span>Ticket Price</span><span class="ev-val ev-neutral">$${ticketPrice.toFixed(2)} AUD</span></div>
    <div class="ev-row"><span>Expected Return per Ticket</span><span class="ev-val ev-negative">$${expectedReturn.toFixed(4)}</span></div>
    <div class="ev-row"><span>Return to Player (RTP)</span><span class="ev-val ev-negative">${rtp}%</span></div>
    <div class="ev-row"><span>House Edge</span><span class="ev-val ev-negative">${houseEdge}%</span></div>
    <div class="ev-row"><span>Net EV per Ticket</span><span class="ev-val ev-negative">-$${(ticketPrice - expectedReturn).toFixed(4)}</span></div>
    <div class="ev-row"><span>Div 1 Avg Prize</span><span class="ev-val ev-positive">~$1,000,000</span></div>
    <div style="font-size:0.73rem;color:var(--text-muted);margin-top:10px;line-height:1.6">
      Prize amounts are approximate averages. Jackpots vary. Powerball and rollovers change the EV significantly. These calculations use expected value math — in reality, you will almost certainly lose your $${ticketPrice.toFixed(2)}.
    </div>`;

  // Z-score chart
  const ns = D.numberStats.map(s => s.n);
  const zs = D.numberStats.map(s => parseFloat(s.zScore));
  const zColors = zs.map(z => z > 1.5 ? 'rgba(239,68,68,0.8)' : z < -1.5 ? 'rgba(59,130,246,0.8)' : 'rgba(124,58,237,0.5)');
  const borderColors = zs.map(z => z > 1.5 ? '#ef4444' : z < -1.5 ? '#3b82f6' : '#7c3aed');

  destroyChart('zscoreChart');
  charts['zscoreChart'] = new Chart(document.getElementById('zscoreChart'), {
    type: 'bar',
    data: {
      labels: ns,
      datasets: [{ label: 'Z-Score', data: zs, backgroundColor: zColors, borderColor: borderColors, borderWidth: 1 }]
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: {
        ...CHART_DEFAULTS.plugins,
        annotation: {},
        tooltip: { ...CHART_DEFAULTS.plugins.tooltip, callbacks: { label: ctx => `Z = ${ctx.raw} (${ctx.raw > 1.5 ? 'HOT' : ctx.raw < -1.5 ? 'COLD' : 'Normal'})` } }
      }
    }
  });

  // Birthday paradox
  // P(at least 2 share ≥1 number) = 1 - P(all unique)
  // Simplified: probability that among k players, at least 2 share at least 1 of their 6 numbers
  const groupSizes = [10, 25, 50, 100, 200, 300, 400, 500];
  const birthProbs = groupSizes.map(k => {
    // For each pair of players: P(share ≥1 number) = 1 - C(39,6)/C(45,6) ≈ 0.616
    // P(at least one shared pair among C(k,2) pairs)
    const pSharePair = 1 - C(39, 6) / C(45, 6);
    const pairs = k * (k - 1) / 2;
    // Inclusion-exclusion approximation (Bonferroni)
    const probAtLeastOne = Math.min(0.9999, 1 - Math.pow(1 - pSharePair, pairs));
    return (probAtLeastOne * 100).toFixed(2);
  });

  destroyChart('birthdayChart');
  charts['birthdayChart'] = new Chart(document.getElementById('birthdayChart'), {
    type: 'line',
    data: {
      labels: groupSizes.map(k => `${k} players`),
      datasets: [{
        label: 'Prob. of Shared Number (%)',
        data: birthProbs,
        borderColor: '#a855f7', backgroundColor: 'rgba(124,58,237,0.15)',
        borderWidth: 2, tension: 0.4, fill: true,
        pointBackgroundColor: '#a855f7', pointRadius: 5
      }]
    },
    options: {
      ...CHART_DEFAULTS,
      scales: { ...CHART_DEFAULTS.scales, y: { ...CHART_DEFAULTS.scales.y, min: 0, max: 100, ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: v => v + '%' } } }
    }
  });
}

// ============================================================
// INIT ALL
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initOverview();
  initFrequency();
  initGenerator();
  initAnalyser();
  initMonteCarlo();
  initWheel();
  // Deep Math inits on tab click to avoid rendering off-screen canvases
});
