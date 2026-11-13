/* =====================================================
   EXPENSE & BUDGET VISUALIZER — app.js
   Vanilla JS (ES6+) · Zero dependencies
   Optional Challenges: Dark Mode · Custom Categories · Sort
   ===================================================== */

'use strict';

/* ─────────────────────────────────────────────────────
   1. CONSTANTS & DEFAULT DATA
   ───────────────────────────────────────────────────── */

const STORAGE_KEYS = {
  TRANSACTIONS:  'bv_transactions',
  BUDGET:        'bv_budget',
  CUSTOM_CATS:   'bv_custom_cats',
  THEME:         'bv_theme',
};

/** Built-in categories — always available */
const DEFAULT_CATEGORIES = [
  { id: 'food',          label: 'Food & Dining',    icon: '🍔', color: '#F97316' },
  { id: 'transport',     label: 'Transport',         icon: '🚗', color: '#3B82F6' },
  { id: 'shopping',      label: 'Shopping',          icon: '🛍️', color: '#A855F7' },
  { id: 'bills',         label: 'Bills & Utils',     icon: '💡', color: '#EAB308' },
  { id: 'entertainment', label: 'Entertainment',     icon: '🎬', color: '#EC4899' },
  { id: 'health',        label: 'Health',            icon: '💊', color: '#14B8A6' },
  { id: 'other',         label: 'Other',             icon: '📦', color: '#94A3B8' },
  /* Income-specific */
  { id: 'salary',        label: 'Salary',            icon: '💰', color: '#10B981' },
  { id: 'freelance',     label: 'Freelance',         icon: '💼', color: '#6366F1' },
];

/** Curated palette for custom-category color picker */
const SWATCH_COLORS = [
  '#F43F5E', '#F97316', '#EAB308', '#10B981',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
  '#64748B', '#0F172A',
];

/** Sample seed data for the "Load Sample" button */
const SAMPLE_TRANSACTIONS = [
  { type: 'income',  amount: 8500000,  description: 'Gaji Bulanan',             category: 'salary',        date: todayOffset(-28) },
  { type: 'expense', amount: 1500000,  description: 'Sewa Kos / Kontrakan',      category: 'bills',         date: todayOffset(-27) },
  { type: 'expense', amount: 350000,   description: 'Belanja Mingguan',          category: 'food',          date: todayOffset(-20) },
  { type: 'expense', amount: 150000,   description: 'Tagihan Listrik',           category: 'bills',         date: todayOffset(-19) },
  { type: 'expense', amount: 85000,    description: 'GoFood / ShopeeFood',       category: 'food',          date: todayOffset(-15) },
  { type: 'expense', amount: 54000,    description: 'Netflix & Spotify',         category: 'entertainment', date: todayOffset(-14) },
  { type: 'income',  amount: 1200000,  description: 'Proyek Freelance Desain',   category: 'freelance',     date: todayOffset(-12) },
  { type: 'expense', amount: 100000,   description: 'Kartu Langganan TransJ',    category: 'transport',     date: todayOffset(-10) },
  { type: 'expense', amount: 450000,   description: 'Sepatu Baru',               category: 'shopping',      date: todayOffset(-8)  },
  { type: 'expense', amount: 150000,   description: 'Biaya Dokter & Obat',       category: 'health',        date: todayOffset(-7)  },
  { type: 'expense', amount: 75000,    description: 'Kopi & Camilan',            category: 'food',          date: todayOffset(-5)  },
  { type: 'expense', amount: 60000,    description: 'Tiket Bioskop',             category: 'entertainment', date: todayOffset(-3)  },
  { type: 'expense', amount: 220000,   description: 'Belanja Tokopedia',         category: 'shopping',      date: todayOffset(-2)  },
  { type: 'expense', amount: 15000,    description: 'Langganan Aplikasi',        category: 'other',         date: todayOffset(-1)  },
  { type: 'expense', amount: 25000,    description: 'Parkir & Tol',              category: 'transport',     date: todayOffset(0)   },
];

/* ─────────────────────────────────────────────────────
   2. UTILITY HELPERS
   ───────────────────────────────────────────────────── */

/** Short unique id */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** ISO date `days` offset from today */
function todayOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Format number as IDR currency string */
function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);
}

/** Format ISO date string to readable label */
function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Sanitize a string before injecting into innerHTML */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ─────────────────────────────────────────────────────
   3. LOCALSTORAGE LAYER
   ───────────────────────────────────────────────────── */

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { showToast('Storage error — data may not persist.', 'error'); }
}

function loadBudget()   { return loadJSON(STORAGE_KEYS.BUDGET, 0); }
function saveBudget(v)  { saveJSON(STORAGE_KEYS.BUDGET, v); }

function loadTheme()    { return loadJSON(STORAGE_KEYS.THEME, 'light'); }
function saveTheme(v)   { saveJSON(STORAGE_KEYS.THEME, v); }

/* ─────────────────────────────────────────────────────
   4. APP STATE
   ───────────────────────────────────────────────────── */

let transactions    = loadJSON(STORAGE_KEYS.TRANSACTIONS, []);
let budget          = loadBudget();
let customCats      = loadJSON(STORAGE_KEYS.CUSTOM_CATS, []);
let theme           = loadTheme();

// UI filters / search / sort
let activeFilter         = 'all';   // 'all' | 'expense' | 'income'
let activeCategoryFilter = null;    // category id or null
let searchQuery          = '';
let sortMode             = 'date-desc'; // see SORT_MODES

// Modal form state
let selectedType     = 'expense';
let selectedCategory = 'food';

// Custom category builder state
let customCatColor   = SWATCH_COLORS[0]; // currently selected swatch

/* ─────────────────────────────────────────────────────
   5. CATEGORY HELPERS
   ───────────────────────────────────────────────────── */

/** All categories: defaults + user-defined custom ones */
function allCategories() {
  return [...DEFAULT_CATEGORIES, ...customCats];
}

/** Look up a category by id; fall back to 'other' */
function getCat(id) {
  return allCategories().find(c => c.id === id) || DEFAULT_CATEGORIES.find(c => c.id === 'other');
}

/* ─────────────────────────────────────────────────────
   6. DOM REFERENCES
   ───────────────────────────────────────────────────── */

const $ = id => document.getElementById(id);

// Overview
const elBalance        = $('total-balance');
const elIncome         = $('total-income');
const elExpenses       = $('total-expenses');
const elBudgetDisplay  = $('budget-display');
const elBudgetInputRow = $('budget-input-row');
const elBudgetInput    = $('budget-input');
const elProgressBar    = $('progress-bar');
const elProgressTrack  = $('progress-track');
const elBudgetSpent    = $('budget-spent-label');
const elBudgetPct      = $('budget-pct-label');

// Chart
const elDonutSlices      = $('donut-slices');
const elDonutCenterLabel  = $('donut-center-label');
const elDonutCenterAmount = $('donut-center-amount');
const elDonutCenterPct    = $('donut-center-pct');
const elChartLegend      = $('chart-legend');
const elChartEmpty       = $('chart-empty');

// Transactions
const elTxList          = $('tx-list');
const elTxEmpty         = $('tx-empty');
const elSearchInput     = $('search-input');
const elSortSelect      = $('sort-select');
const elActiveCatFilter = $('active-cat-filter');
const elActiveCatLabel  = $('active-cat-label');

// Modal + form
const elModalOverlay    = $('modal-overlay');
const elTxForm          = $('tx-form');
const elTxAmount        = $('tx-amount');
const elTxDescription   = $('tx-description');
const elTxDate          = $('tx-date');
const elCategoryGrid    = $('category-grid');

// Custom category drawer
const elCustomCatDrawer = $('custom-cat-drawer');
const elCustomCatEmoji  = $('custom-cat-emoji');
const elCustomCatName   = $('custom-cat-name');
const elColorSwatchRow  = $('color-swatch-row');

// Toast
const elToast = $('toast');

/* ─────────────────────────────────────────────────────
   7. TOAST
   ───────────────────────────────────────────────────── */

let _toastTimer = null;

/**
 * @param {string} msg
 * @param {'success'|'error'|'info'} type
 * @param {number} [ms]
 */
function showToast(msg, type = 'success', ms = 2500) {
  elToast.textContent = msg;
  elToast.className   = `show ${type}`;
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { elToast.className = ''; }, ms);
}

/* ─────────────────────────────────────────────────────
   8. THEME — Optional Challenge #1
   ───────────────────────────────────────────────────── */

function applyTheme(t) {
  theme = t;
  document.documentElement.setAttribute('data-theme', t);
  const btn = $('btn-theme');
  btn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  saveTheme(t);
  // Re-render chart so SVG text fill colours update
  renderDonutChart();
}

function toggleTheme() {
  applyTheme(theme === 'dark' ? 'light' : 'dark');
}

/* ─────────────────────────────────────────────────────
   9. OVERVIEW CARD
   ───────────────────────────────────────────────────── */

function calcSummary() {
  let totalIncome = 0, totalExpenses = 0;
  transactions.forEach(tx => {
    if (tx.type === 'income')  totalIncome   += tx.amount;
    if (tx.type === 'expense') totalExpenses += tx.amount;
  });
  return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses };
}

function renderOverview() {
  const { totalIncome, totalExpenses, balance } = calcSummary();

  elBalance.textContent  = formatCurrency(balance);
  elIncome.textContent   = formatCurrency(totalIncome);
  elExpenses.textContent = formatCurrency(totalExpenses);

  // Balance colour
  elBalance.style.color = balance >= 0
    ? 'var(--text-primary)'
    : 'var(--expense)';

  // Budget progress
  elBudgetDisplay.textContent = budget > 0 ? formatCurrency(budget) : 'Not set';
  elBudgetSpent.textContent   = `${formatCurrency(totalExpenses)} terpakai`;

  if (budget > 0) {
    const pct    = Math.min((totalExpenses / budget) * 100, 100);
    const rawPct = (totalExpenses / budget) * 100;

    elProgressBar.style.width = pct + '%';
    elProgressTrack.setAttribute('aria-valuenow', Math.round(pct));
    elBudgetPct.textContent   = `${Math.round(rawPct)}%`;

    // Colour shift: emerald ➜ amber ➜ rose
    elProgressBar.className = 'progress-bar';
    if (rawPct >= 100) elProgressBar.classList.add('rose');
    else if (rawPct >= 75) elProgressBar.classList.add('amber');
  } else {
    elProgressBar.style.width = '0%';
    elProgressTrack.setAttribute('aria-valuenow', 0);
    elBudgetPct.textContent   = '—';
  }
}

/* ─────────────────────────────────────────────────────
   10. DONUT CHART (native SVG)
   ───────────────────────────────────────────────────── */

/** Convert polar → Cartesian on the SVG viewBox */
function polarToXY(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Build a donut arc <path> d-attribute */
function arcPath(cx, cy, oR, iR, start, end) {
  const s  = polarToXY(cx, cy, oR, start);
  const e  = polarToXY(cx, cy, oR, end);
  const is = polarToXY(cx, cy, iR, end);
  const ie = polarToXY(cx, cy, iR, start);
  const lg = end - start > 180 ? 1 : 0;
  return [
    `M ${s.x} ${s.y}`,
    `A ${oR} ${oR} 0 ${lg} 1 ${e.x} ${e.y}`,
    `L ${is.x} ${is.y}`,
    `A ${iR} ${iR} 0 ${lg} 0 ${ie.x} ${ie.y}`,
    'Z',
  ].join(' ');
}

function renderDonutChart() {
  const catTotals = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });

  const entries = Object.entries(catTotals).filter(([, v]) => v > 0);
  const total   = entries.reduce((s, [, v]) => s + v, 0);

  elDonutSlices.innerHTML = '';
  elChartLegend.innerHTML = '';

  if (total === 0) {
    elChartEmpty.classList.add('visible');
    elChartLegend.style.display = 'none';
    elDonutCenterLabel.textContent  = 'Total';
    elDonutCenterAmount.textContent = 'Rp0';
    elDonutCenterPct.textContent    = '';
    return;
  }

  elChartEmpty.classList.remove('visible');
  elChartLegend.style.display = '';

  const cx = 100, cy = 100, oR = 80, iR = 50;
  let angle = 0;

  entries.forEach(([catId, amount]) => {
    const cat   = getCat(catId);
    const pct   = (amount / total) * 100;
    const sweep = (amount / total) * 360;
    const end   = angle + sweep >= 360 ? 359.999 : angle + sweep;

    // ── Slice ──
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', arcPath(cx, cy, oR, iR, angle, end));
    path.setAttribute('fill', cat.color);
    path.setAttribute('class', 'donut-slice');
    path.setAttribute('data-cat', catId);
    path.setAttribute('tabindex', '0');
    path.setAttribute('role', 'button');
    path.setAttribute('aria-label', `${cat.label}: ${formatCurrency(amount)} (${pct.toFixed(1)}%)`);

    const onIn  = () => setChartHighlight(catId, amount, pct, cat.color);
    const onOut = () => setChartHighlight(null, total, 100, null);

    path.addEventListener('mouseenter', onIn);
    path.addEventListener('focus',      onIn);
    path.addEventListener('mouseleave', onOut);
    path.addEventListener('blur',       onOut);
    path.addEventListener('click',      () => setCategoryFilter(catId));
    path.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCategoryFilter(catId); }
    });

    elDonutSlices.appendChild(path);
    angle += sweep;

    // ── Legend item ──
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.setAttribute('role', 'listitem');
    item.setAttribute('tabindex', '0');
    item.setAttribute('data-cat', catId);

    const dot = document.createElement('div');
    dot.className        = 'legend-dot';
    dot.style.background = cat.color;

    const name = document.createElement('span');
    name.className   = 'legend-name';
    name.textContent = cat.label;

    const pctEl = document.createElement('span');
    pctEl.className   = 'legend-pct';
    pctEl.textContent = `${pct.toFixed(0)}%`;

    item.append(dot, name, pctEl);

    item.addEventListener('mouseenter', onIn);
    item.addEventListener('focus',      onIn);
    item.addEventListener('mouseleave', onOut);
    item.addEventListener('blur',       onOut);
    item.addEventListener('click',      () => setCategoryFilter(catId));
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCategoryFilter(catId); }
    });

    elChartLegend.appendChild(item);
  });

  // Default: show total
  setChartHighlight(null, total, 100, null);
}

/** Update center labels + dim non-highlighted slices */
function setChartHighlight(catId, amount, pct, color) {
  if (catId) {
    const cat = getCat(catId);
    elDonutCenterLabel.textContent  = cat.label;
    elDonutCenterAmount.textContent = formatCurrency(amount);
    elDonutCenterPct.textContent    = `${pct.toFixed(1)}%`;
    elDonutCenterAmount.style.fill  = color || cat.color;
  } else {
    elDonutCenterLabel.textContent  = 'Total';
    elDonutCenterAmount.textContent = formatCurrency(amount);
    elDonutCenterPct.textContent    = '';
    elDonutCenterAmount.style.fill  = 'var(--text-primary)';
  }

  // Highlight slice & legend
  elDonutSlices.querySelectorAll('.donut-slice').forEach(el => {
    const isCurrent = el.getAttribute('data-cat') === catId;
    el.classList.toggle('active',  catId !== null &&  isCurrent);
    el.classList.toggle('dimmed',  catId !== null && !isCurrent);
  });
  elChartLegend.querySelectorAll('.legend-item').forEach(el => {
    el.classList.toggle('active', catId !== null && el.getAttribute('data-cat') === catId);
  });
}

/* ─────────────────────────────────────────────────────
   11. SORT — Optional Challenge #3
   ───────────────────────────────────────────────────── */

/**
 * Sort and filter the transaction list.
 * Runs after every state change.
 */
function getSortedFilteredTransactions() {
  const q = searchQuery.toLowerCase().trim();

  let list = transactions.filter(tx => {
    if (activeFilter === 'expense' && tx.type !== 'expense') return false;
    if (activeFilter === 'income'  && tx.type !== 'income')  return false;
    if (activeCategoryFilter && tx.category !== activeCategoryFilter) return false;
    if (q) {
      const catLabel = getCat(tx.category).label.toLowerCase();
      if (!tx.description.toLowerCase().includes(q) && !catLabel.includes(q)) return false;
    }
    return true;
  });

  // Apply sort
  switch (sortMode) {
    case 'date-desc':    list.sort((a, b) => (a.date < b.date ? 1 : -1)); break;
    case 'date-asc':     list.sort((a, b) => (a.date > b.date ? 1 : -1)); break;
    case 'amount-desc':  list.sort((a, b) => b.amount - a.amount);         break;
    case 'amount-asc':   list.sort((a, b) => a.amount - b.amount);         break;
    case 'category-az':  list.sort((a, b) => getCat(a.category).label.localeCompare(getCat(b.category).label)); break;
    default: break;
  }

  return list;
}

/* ─────────────────────────────────────────────────────
   12. TRANSACTION LIST RENDER
   ───────────────────────────────────────────────────── */

function renderTransactions() {
  const list = getSortedFilteredTransactions();
  elTxList.innerHTML = '';

  if (list.length === 0) {
    elTxEmpty.classList.add('visible');
    return;
  }
  elTxEmpty.classList.remove('visible');

  list.forEach(tx => {
    const cat     = getCat(tx.category);
    const isInc   = tx.type === 'income';
    const sign    = isInc ? '+' : '−';
    const amtCls  = isInc ? 'income' : 'expense';

    const li = document.createElement('li');
    li.className = 'tx-item';
    li.setAttribute('data-id', tx.id);
    li.style.maxHeight = '200px'; // needed for collapse animation

    li.innerHTML = `
      <div class="tx-cat-icon" style="background:${cat.color}18;" aria-hidden="true">${cat.icon}</div>
      <div class="tx-info">
        <div class="tx-desc">${esc(tx.description)}</div>
        <div class="tx-meta">
          <span class="tx-date">${formatDate(tx.date)}</span>
          <span class="tx-cat-badge" style="color:${cat.color};border-color:${cat.color}44;background:${cat.color}14;">${esc(cat.label)}</span>
        </div>
      </div>
      <div class="tx-amount-col">
        <span class="tx-amount ${amtCls}">${sign}${formatCurrency(tx.amount)}</span>
        <button class="btn-delete" data-id="${tx.id}" aria-label="Delete: ${esc(tx.description)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>`;

    elTxList.appendChild(li);
  });

  // Delegate delete clicks (single listener on ul)
  elTxList.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', e => deleteTransaction(e.currentTarget.getAttribute('data-id')));
  });
}

/* ─────────────────────────────────────────────────────
   13. TRANSACTION CRUD
   ───────────────────────────────────────────────────── */

function addTransaction(tx) {
  transactions.unshift(tx);
  saveJSON(STORAGE_KEYS.TRANSACTIONS, transactions);
  renderAll();
  showToast(`${tx.type === 'income' ? 'Income' : 'Expense'} added!`, 'success');
}

function deleteTransaction(id) {
  const li = elTxList.querySelector(`[data-id="${id}"]`);
  if (li) {
    li.classList.add('removing');
    setTimeout(() => {
      transactions = transactions.filter(t => t.id !== id);
      saveJSON(STORAGE_KEYS.TRANSACTIONS, transactions);
      renderAll();
      showToast('Transaction deleted', 'info');
    }, 300);
  } else {
    transactions = transactions.filter(t => t.id !== id);
    saveJSON(STORAGE_KEYS.TRANSACTIONS, transactions);
    renderAll();
  }
}

/* ─────────────────────────────────────────────────────
   14. CATEGORY FILTER (driven by chart)
   ───────────────────────────────────────────────────── */

function setCategoryFilter(catId) {
  activeCategoryFilter = catId;
  const cat = getCat(catId);
  elActiveCatLabel.textContent = `Filtered by: ${cat.label}`;
  elActiveCatFilter.classList.remove('hidden');
  renderTransactions();
}

function clearCategoryFilter() {
  activeCategoryFilter = null;
  elActiveCatFilter.classList.add('hidden');
  renderTransactions();
}

/* ─────────────────────────────────────────────────────
   15. FULL RE-RENDER
   ───────────────────────────────────────────────────── */

function renderAll() {
  renderOverview();
  renderDonutChart();
  renderTransactions();
}

/* ─────────────────────────────────────────────────────
   16. MODAL OPEN / CLOSE
   ───────────────────────────────────────────────────── */

function openModal() {
  // Reset form
  elTxForm.reset();
  elTxDate.value   = new Date().toISOString().slice(0, 10);
  selectedType     = 'expense';
  selectedCategory = 'food';

  // Sync type toggle UI
  document.querySelectorAll('.type-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-type') === selectedType);
  });

  // Build category grid for current type
  buildCategoryGrid();

  // Close custom cat drawer if open
  closeCustomCatDrawer();

  // Clear error states
  [elTxAmount, elTxDescription, elTxDate].forEach(el => el.classList.remove('error'));

  // Lock body scroll (prevents background page scroll on iOS)
  document.body.classList.add('modal-open');

  elModalOverlay.classList.add('open');
  elModalOverlay.setAttribute('aria-hidden', 'false');

  // Only auto-focus on non-touch devices to avoid iOS keyboard pushing layout
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (!isTouch) {
    setTimeout(() => elTxAmount.focus(), 320);
  }
}

function closeModal() {
  elModalOverlay.classList.remove('open');
  elModalOverlay.setAttribute('aria-hidden', 'true');
  // Restore body scroll
  document.body.classList.remove('modal-open');
}

/* ─────────────────────────────────────────────────────
   17. CATEGORY GRID
   ───────────────────────────────────────────────────── */

/**
 * Rebuild the category selector chips inside the form.
 * Shows relevant categories for the current transaction type.
 */
function buildCategoryGrid() {
  elCategoryGrid.innerHTML = '';

  const incomeIds  = ['salary', 'freelance', 'other'];
  const expenseIds = DEFAULT_CATEGORIES.filter(c => !['salary', 'freelance'].includes(c.id)).map(c => c.id);

  const relevant = allCategories().filter(c => {
    if (selectedType === 'income')  return incomeIds.includes(c.id) || customCats.some(cc => cc.id === c.id && cc.forIncome);
    return !['salary', 'freelance'].includes(c.id);
  });

  // Auto-correct selectedCategory if it's not relevant
  if (!relevant.find(c => c.id === selectedCategory)) {
    selectedCategory = relevant[0]?.id || 'other';
  }

  relevant.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className  = 'cat-option' + (cat.id === selectedCategory ? ' selected' : '');
    btn.setAttribute('role', 'option');
    btn.setAttribute('aria-selected', cat.id === selectedCategory ? 'true' : 'false');
    btn.setAttribute('data-cat', cat.id);

    btn.innerHTML = `
      <span class="cat-option-icon">${cat.icon}</span>
      <span class="cat-option-name">${esc(cat.label)}</span>`;

    btn.addEventListener('click', () => {
      selectedCategory = cat.id;
      elCategoryGrid.querySelectorAll('.cat-option').forEach(b => {
        const me = b.getAttribute('data-cat') === cat.id;
        b.classList.toggle('selected', me);
        b.setAttribute('aria-selected', me ? 'true' : 'false');
      });
    });

    elCategoryGrid.appendChild(btn);
  });
}

/* ─────────────────────────────────────────────────────
   18. CUSTOM CATEGORY — Optional Challenge #2
   ───────────────────────────────────────────────────── */

/** Build the colour-swatch row in the custom-category drawer */
function buildColorSwatches() {
  elColorSwatchRow.innerHTML = '';
  SWATCH_COLORS.forEach(hex => {
    const sw = document.createElement('button');
    sw.type = 'button';
    sw.className   = 'color-swatch' + (hex === customCatColor ? ' selected' : '');
    sw.setAttribute('role', 'option');
    sw.setAttribute('aria-selected', hex === customCatColor ? 'true' : 'false');
    sw.setAttribute('aria-label', `Color: ${hex}`);
    sw.style.background = hex;
    sw.setAttribute('data-color', hex);

    sw.addEventListener('click', () => {
      customCatColor = hex;
      elColorSwatchRow.querySelectorAll('.color-swatch').forEach(s => {
        const me = s.getAttribute('data-color') === hex;
        s.classList.toggle('selected', me);
        s.setAttribute('aria-selected', me ? 'true' : 'false');
      });
    });

    elColorSwatchRow.appendChild(sw);
  });
}

function openCustomCatDrawer() {
  elCustomCatDrawer.classList.remove('hidden');
  // Animate on next frame
  requestAnimationFrame(() => {
    elCustomCatDrawer.classList.add('open');
    elCustomCatDrawer.setAttribute('aria-hidden', 'false');
  });
  buildColorSwatches();
  elCustomCatEmoji.value = '';
  elCustomCatName.value  = '';
  customCatColor = SWATCH_COLORS[0];
  $('btn-open-custom-cat').setAttribute('aria-expanded', 'true');
  setTimeout(() => elCustomCatEmoji.focus(), 100);
}

function closeCustomCatDrawer() {
  elCustomCatDrawer.classList.remove('open');
  elCustomCatDrawer.setAttribute('aria-hidden', 'true');
  $('btn-open-custom-cat').setAttribute('aria-expanded', 'false');
  // Hide after transition
  setTimeout(() => {
    if (!elCustomCatDrawer.classList.contains('open')) {
      elCustomCatDrawer.classList.add('hidden');
    }
  }, 300);
}

function saveCustomCategory() {
  const icon  = (elCustomCatEmoji.value.trim() || '🏷️').slice(0, 2);
  const label = elCustomCatName.value.trim();

  if (!label) {
    elCustomCatName.classList.add('error');
    elCustomCatName.focus();
    showToast('Please enter a category name.', 'error');
    return;
  }
  elCustomCatName.classList.remove('error');

  // Prevent duplicate names (case-insensitive)
  if (allCategories().some(c => c.label.toLowerCase() === label.toLowerCase())) {
    showToast('A category with that name already exists.', 'error');
    return;
  }

  const newCat = {
    id:    'custom_' + uid(),
    label,
    icon,
    color: customCatColor,
  };

  customCats.push(newCat);
  saveJSON(STORAGE_KEYS.CUSTOM_CATS, customCats);
  selectedCategory = newCat.id;

  closeCustomCatDrawer();
  buildCategoryGrid(); // refresh category chips with new entry selected
  showToast(`"${label}" category added!`, 'success');
}

/* ─────────────────────────────────────────────────────
   19. FORM VALIDATION & SUBMIT
   ───────────────────────────────────────────────────── */

function validateForm() {
  let ok = true;
  [elTxAmount, elTxDescription, elTxDate].forEach(el => el.classList.remove('error'));

  const amount = parseFloat(elTxAmount.value);
  if (!elTxAmount.value || isNaN(amount) || amount <= 0) {
    elTxAmount.classList.add('error');
    ok = false;
  }
  if (!elTxDescription.value.trim()) {
    elTxDescription.classList.add('error');
    ok = false;
  }
  if (!elTxDate.value) {
    elTxDate.classList.add('error');
    ok = false;
  }
  return ok;
}

/* ─────────────────────────────────────────────────────
   20. EVENT LISTENERS
   ───────────────────────────────────────────────────── */

function attachEventListeners() {

  /* ── Theme toggle ── */
  $('btn-theme').addEventListener('click', toggleTheme);

  /* ── Open modal ── */
  $('btn-add-trigger').addEventListener('click', openModal);

  /* ── Close modal (overlay click + X button + ESC) ── */
  elModalOverlay.addEventListener('click', e => { if (e.target === elModalOverlay) closeModal(); });
  $('btn-close-modal').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && elModalOverlay.classList.contains('open')) closeModal();
  });

  /* ── Type toggle (Expense / Income) ── */
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedType = btn.getAttribute('data-type');
      document.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('active', b === btn));
      buildCategoryGrid();
    });
  });

  /* ── Form submit ── */
  elTxForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    const tx = {
      id:          uid(),
      type:        selectedType,
      amount:      Math.round(parseFloat(elTxAmount.value)),
      description: elTxDescription.value.trim(),
      category:    selectedCategory,
      date:        elTxDate.value,
    };
    closeModal();
    addTransaction(tx);
  });

  /* ── Budget edit ── */
  $('btn-edit-budget').addEventListener('click', () => {
    elBudgetInputRow.classList.remove('hidden');
    elBudgetInput.value = budget > 0 ? budget : '';
    elBudgetInput.focus();
  });

  function commitBudget() {
    const val = parseFloat(elBudgetInput.value);
    if (!isNaN(val) && val >= 0) {
      budget = val;
      saveBudget(budget);
      renderOverview();
      showToast('Budget updated!', 'success');
    } else {
      showToast('Enter a valid budget amount.', 'error');
    }
    elBudgetInputRow.classList.add('hidden');
  }

  $('btn-save-budget').addEventListener('click', commitBudget);
  elBudgetInput.addEventListener('keydown', e => {
    if (e.key === 'Enter')  commitBudget();
    if (e.key === 'Escape') elBudgetInputRow.classList.add('hidden');
  });

  /* ── Filter pills ── */
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      activeFilter = pill.getAttribute('data-filter');
      document.querySelectorAll('.filter-pill').forEach(p => {
        const me = p === pill;
        p.classList.toggle('active', me);
        p.setAttribute('aria-selected', me ? 'true' : 'false');
      });
      renderTransactions();
    });
  });

  /* ── Sort dropdown ── */
  elSortSelect.addEventListener('change', () => {
    sortMode = elSortSelect.value;
    renderTransactions();
  });

  /* ── Search ── */
  elSearchInput.addEventListener('input', () => {
    searchQuery = elSearchInput.value;
    renderTransactions();
  });

  /* ── Clear category filter ── */
  $('btn-clear-cat').addEventListener('click', clearCategoryFilter);

  /* ── Custom category drawer ── */
  $('btn-open-custom-cat').addEventListener('click', () => {
    if (elCustomCatDrawer.classList.contains('open')) {
      closeCustomCatDrawer();
    } else {
      openCustomCatDrawer();
    }
  });

  $('btn-cancel-custom-cat').addEventListener('click', closeCustomCatDrawer);
  $('btn-save-custom-cat').addEventListener('click',   saveCustomCategory);

  elCustomCatName.addEventListener('input', () => elCustomCatName.classList.remove('error'));

  /* ── Load Sample ── */
  $('btn-load-sample').addEventListener('click', () => {
    if (transactions.length > 0) {
      if (!confirm('This will add sample data alongside your existing transactions. Continue?')) return;
    }
    const samples = SAMPLE_TRANSACTIONS.map(tx => ({ ...tx, id: uid() }));
    transactions = [...samples, ...transactions];
    saveJSON(STORAGE_KEYS.TRANSACTIONS, transactions);
    if (budget === 0) { budget = 5000000; saveBudget(budget); }
    renderAll();
    showToast('Sample data loaded!', 'success');
  });

  /* ── Reset ── */
  $('btn-reset').addEventListener('click', () => {
    if (!confirm('Delete ALL transactions and reset the budget? This cannot be undone.')) return;
    transactions = [];
    budget       = 0;
    saveJSON(STORAGE_KEYS.TRANSACTIONS, transactions);
    saveBudget(budget);

    // Reset UI state
    activeFilter         = 'all';
    activeCategoryFilter = null;
    searchQuery          = '';
    sortMode             = 'date-desc';
    elSearchInput.value  = '';
    elSortSelect.value   = 'date-desc';

    document.querySelectorAll('.filter-pill').forEach((p, i) => {
      p.classList.toggle('active', i === 0);
      p.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    });
    clearCategoryFilter();
    renderAll();
    showToast('All data reset.', 'info');
  });
}

/* ─────────────────────────────────────────────────────
   21. INIT
   ───────────────────────────────────────────────────── */

function init() {
  // Apply persisted theme before anything renders
  applyTheme(theme);

  // Set today's date as default
  elTxDate.value = new Date().toISOString().slice(0, 10);

  // Build initial category grid
  buildCategoryGrid();

  // Wire up all event listeners
  attachEventListeners();

  // Initial UI render
  renderAll();
}

// Kick off when DOM is fully parsed
document.addEventListener('DOMContentLoaded', init);
