// ═══════════════════════════════════════════════════════════
//  ZONE DATA & CONSTANTS
// ═══════════════════════════════════════════════════════════
const zones = {
  koramangala: { risk: 72, label: 'High',   city: 'Bengaluru', avgRain: 18, avgTemp: 34, traffic: 'High' },
  indiranagar: { risk: 55, label: 'Medium', city: 'Bengaluru', avgRain: 12, avgTemp: 32, traffic: 'Moderate' },
  whitefield:  { risk: 40, label: 'Low',    city: 'Bengaluru', avgRain: 8,  avgTemp: 30, traffic: 'Low' },
  bandra:      { risk: 68, label: 'High',   city: 'Mumbai',    avgRain: 22, avgTemp: 35, traffic: 'High' },
  andheri:     { risk: 60, label: 'Medium', city: 'Mumbai',    avgRain: 16, avgTemp: 34, traffic: 'Moderate' },
  connaught:   { risk: 50, label: 'Medium', city: 'Delhi',     avgRain: 10, avgTemp: 38, traffic: 'Moderate' },
  gurgaon:     { risk: 45, label: 'Low',    city: 'Delhi NCR', avgRain: 8,  avgTemp: 37, traffic: 'Low' }
};

const planLimits = { basic: 300, premium: 600 };
const BASE_PRICE  = { basic: 49, premium: 89 };

const eventMeta = {
  rain:   { label: 'Heavy rain',       icon: '🌧️', type: 'rain'   },
  heat:   { label: 'Extreme heat',     icon: '☀️',  type: 'heat'   },
  outage: { label: 'Platform outage',  icon: '📡', type: 'outage' },
  curfew: { label: 'Area curfew',      icon: '🚫', type: 'outage' }
};

let state = {
  registered: false,
  name: '', zone: '', platform: '', plan: 'premium',
  totalEarned: 0, disruptions: 0, autoTriggered: 0,
  workers: [],
  policyStartTime: null
};

let conditionInterval = null;
let policyInterval    = null;
let toastTimer        = null;

// ═══════════════════════════════════════════════════════════
//  API ABSTRACTION LAYER
//  All data fetching/mocking centralised here
// ═══════════════════════════════════════════════════════════
function getWeather(zone) {
  const zd = zones[zone] || { avgRain: 5, avgTemp: 30 };
  const variance = 0.4;
  const rain = Math.max(0, Math.round(
    zd.avgRain * (1 + (Math.random() - 0.5) * variance * 2)
  ));
  const temp = Math.round(
    zd.avgTemp + (Math.random() - 0.4) * 8
  );
  // Occasional spike to trigger events (10% chance)
  const spike = Math.random() < 0.10;
  return {
    rain: spike ? rain + 15 : rain,
    temp: spike ? temp + 10 : temp
  };
}

function getTraffic(zone) {
  const zd = zones[zone] || { traffic: 'Low' };
  const levels = ['Low', 'Moderate', 'High'];
  const baseIdx = levels.indexOf(zd.traffic);
  const drift = Math.floor(Math.random() * 3) - 1;
  const idx = Math.max(0, Math.min(2, baseIdx + drift));
  return levels[idx];
}

function getServerStatus(platform) {
  // 5% chance of outage
  const down = Math.random() < 0.05;
  return { online: !down, platform: platform || 'platform' };
}

function isUserActive() {
  if (!state.registered) return false;
  if (!isPolicyValid()) return false;
  // Simulate: 85% of the time the user is actively riding
  return Math.random() < 0.85;
}

function isPolicyValid() {
  if (!state.policyStartTime) return false;
  const elapsed = Date.now() - state.policyStartTime;
  const weekMs  = 7 * 24 * 60 * 60 * 1000;
  return elapsed < weekMs;
}

// ═══════════════════════════════════════════════════════════
//  AI / ML RISK SCORE ENGINE
//  Risk score computed from real inputs → premium calculation
// ═══════════════════════════════════════════════════════════
function computeRiskScore(zone, platform) {
  const zd = zones[zone];
  if (!zd) return { score: 50, label: 'Medium' };

  const rainFactor    = Math.min(1, zd.avgRain / 25);
  const tempFactor    = Math.min(1, Math.max(0, (zd.avgTemp - 28) / 20));
  const trafficFactor = zd.traffic === 'High' ? 1 : zd.traffic === 'Moderate' ? 0.5 : 0.2;

  const platformRisk = { zomato: 0.05, swiggy: 0.03, zepto: 0.08, blinkit: 0.06 };
  const platformMod  = platformRisk[platform] || 0.05;

  const score = Math.round(
    rainFactor    * 35 +
    tempFactor    * 25 +
    trafficFactor * 30 +
    platformMod * 100 * 0.10
  );

  const clamped = Math.min(100, Math.max(0, score));
  const label   = clamped > 65 ? 'High' : clamped > 40 ? 'Medium' : 'Low';
  return { score: clamped, label };
}

function computePremium(riskScore, plan) {
  const base = BASE_PRICE[plan] || 49;
  let adj;
  if (riskScore > 65)      adj = base * 0.35;
  else if (riskScore > 40) adj = base * 0.18;
  else                     adj = 0;
  return Math.round(base + adj);
}

// ═══════════════════════════════════════════════════════════
//  CLAIMS PROCESSING PIPELINE
//  detect trigger → verify user → estimate loss → process payout
// ═══════════════════════════════════════════════════════════
async function processClaim(type, isAuto) {
  if (!state.registered) return;
  if ((type === 'outage' || type === 'curfew') && state.plan === 'basic') {
    showToast('Platform outage & curfew payouts require the Premium plan');
    return;
  }

  showPipeline();

  // Step 0 — Detect trigger
  await pipelineStep(0, 400);

  // Step 1 — Verify user active
  const active = isUserActive();
  await pipelineStep(1, 500);
  if (!active) {
    showToast('⚠️ You appear offline — payout skipped (not active)');
    hidePipeline();
    return;
  }

  // Step 2 — Estimate loss
  const ev     = eventMeta[type];
  const max    = planLimits[state.plan];
  const { score } = computeRiskScore(state.zone, state.platform);
  const riskMult  = 1 + (score / 100) * 0.4;
  const amount    = Math.floor(max * (0.35 + Math.random() * 0.45) * riskMult);
  await pipelineStep(2, 500);

  // Step 3 — Process payout
  state.totalEarned += amount;
  state.disruptions += 1;
  if (isAuto) state.autoTriggered += 1;
  await pipelineStep(3, 500);

  // Step 4 — Credited
  await pipelineStep(4, 400);

  updateCoverageFromPolicy();

  document.getElementById('dash-earned').textContent      = '₹' + state.totalEarned;
  document.getElementById('dash-disruptions').textContent = state.disruptions;

  recordPayout(type, amount, ev, isAuto);

  document.getElementById('admin-total-payouts').textContent = '₹' + state.totalEarned;
  document.getElementById('admin-auto-count').textContent     = state.autoTriggered;
  state.workers = state.workers.map(w =>
    w.name === state.name ? { ...w, payouts: w.payouts + 1, earned: w.earned + amount } : w
  );
  persistState();

  showToast('₹' + amount + ' credited — ' + ev.label.toLowerCase() + ' payout!' + (isAuto ? ' 🤖 (auto)' : ''), 4000);
  setTimeout(hidePipeline, 1200);
}

// ═══════════════════════════════════════════════════════════
//  DATA PERSISTENCE — localStorage
// ═══════════════════════════════════════════════════════════
const STORAGE_KEY = 'wtcm_state';

function persistState() {
  try {
    const toStore = { ...state, payouts: getPayoutsFromDOM() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch(e) { console.warn('Storage write failed', e); }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!saved.registered) return;

    state = { ...state, ...saved };
    delete state.payouts;

    const initials  = saved.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const zd        = zones[saved.zone] || {};
    const platLabel = saved.platform.charAt(0).toUpperCase() + saved.platform.slice(1);

    document.getElementById('dash-avatar').textContent  = initials;
    document.getElementById('dash-name').textContent    = saved.name;
    document.getElementById('dash-zone').textContent    = (zd.city || saved.zone) + ' · ' + platLabel;
    document.getElementById('dash-days').textContent    = getDaysLeft();
    document.getElementById('dash-plan-label').textContent = platLabel + ' · ' + saved.plan.charAt(0).toUpperCase() + saved.plan.slice(1) + ' plan';
    document.getElementById('dash-limit').textContent   = '₹' + planLimits[saved.plan];
    document.getElementById('dash-earned').textContent  = '₹' + saved.totalEarned;
    document.getElementById('dash-disruptions').textContent = saved.disruptions;

    updateCoverageFromPolicy();

    // Restore payout history
    const feed = document.getElementById('payout-feed');
    if (saved.payouts && saved.payouts.length) {
      feed.innerHTML = '';
      saved.payouts.reverse().forEach(p => {
        const item = document.createElement('div');
        item.className = 'payout-item';
        item.innerHTML = `
          <div class="payout-dot ${p.type}">${p.icon}</div>
          <div class="payout-info">
            <div class="payout-event">${p.label} detected in your zone</div>
            <div class="payout-time">${p.time} · AI verified · Auto-credited${p.auto ? ' 🤖' : ''}</div>
          </div>
          <div class="payout-amount">+₹${p.amount}</div>
        `;
        feed.appendChild(item);
      });
    }

    updateStatusPill();
    document.getElementById('policy-countdown-wrap').style.display = 'block';
    startPolicyCountdown();
    startConditionPolling();
    renderAdmin();

  } catch(e) { console.warn('State restore failed', e); }
}

function getPayoutsFromDOM() {
  const items = document.querySelectorAll('.payout-item');
  const arr = [];
  items.forEach(item => {
    const dot    = item.querySelector('.payout-dot');
    const event  = item.querySelector('.payout-event')?.textContent;
    const time   = item.querySelector('.payout-time')?.textContent;
    const amount = item.querySelector('.payout-amount')?.textContent?.replace('+₹','');
    const type   = dot?.className?.replace('payout-dot ','').trim();
    arr.push({ type, event, time, amount, label: event?.replace(' detected in your zone','') || '' });
  });
  return arr;
}

// ═══════════════════════════════════════════════════════════
//  AUTOMATED CONDITION POLLING — setInterval every 5s
// ═══════════════════════════════════════════════════════════
function startConditionPolling() {
  clearInterval(conditionInterval);
  conditionInterval = setInterval(async () => {
    if (!state.registered) return;

    const weather = getWeather(state.zone);
    const traffic = getTraffic(state.zone);
    const server  = getServerStatus(state.platform);
    const active  = isUserActive();

    // Update live condition display
    document.getElementById('cond-rain').textContent     = weather.rain + ' mm/hr';
    document.getElementById('cond-temp').textContent     = weather.temp + '°C';
    document.getElementById('cond-traffic').textContent  = traffic;
    document.getElementById('cond-platform').textContent = server.online ? 'Online' : 'Down';
    document.getElementById('cond-activity').textContent = active ? 'Active' : 'Idle';

    // Rain status
    document.getElementById('cond-rain-s').className   = 'cond-status ' + (weather.rain > 25 ? 'cond-alert' : weather.rain > 15 ? 'cond-warn' : 'cond-ok');
    document.getElementById('cond-rain-s').textContent = weather.rain > 25 ? 'Trigger!' : weather.rain > 15 ? 'Elevated' : 'Normal';

    // Temp status
    document.getElementById('cond-temp-s').className   = 'cond-status ' + (weather.temp > 42 ? 'cond-alert' : weather.temp > 36 ? 'cond-warn' : 'cond-ok');
    document.getElementById('cond-temp-s').textContent = weather.temp > 42 ? 'Trigger!' : weather.temp > 36 ? 'High' : 'Normal';

    // Traffic status
    document.getElementById('cond-traffic-s').className   = 'cond-status ' +
      (traffic === 'High' ? 'cond-alert' : traffic === 'Moderate' ? 'cond-warn' : 'cond-ok');
    document.getElementById('cond-traffic-s').textContent =
      traffic === 'High' ? 'Heavy' : traffic === 'Moderate' ? 'Elevated' : 'Clear';

    // Platform status
    document.getElementById('cond-platform-s').className   = 'cond-status ' + (server.online ? 'cond-ok' : 'cond-alert');
    document.getElementById('cond-platform-s').textContent = server.online ? 'OK' : 'Outage!';

    // Activity status
    document.getElementById('cond-activity-s').className   = 'cond-status ' + (active ? 'cond-ok' : 'cond-warn');
    document.getElementById('cond-activity-s').textContent = active ? 'Verified' : 'Offline';

    // ── AUTOMATED TRIGGER DETECTION ──
    if (!isPolicyValid()) return;
    if (!active) return;

    if (weather.rain > 25) {
      await processClaim('rain', true);
    } else if (weather.temp > 42) {
      await processClaim('heat', true);
    } else if (!server.online && state.plan === 'premium') {
      await processClaim('outage', true);
    }

  }, 5000);
}

// ═══════════════════════════════════════════════════════════
//  WEEKLY POLICY LOGIC — strict time-based enforcement
// ═══════════════════════════════════════════════════════════
function getDaysLeft() {
  if (!state.policyStartTime) return 0;
  const elapsed = Date.now() - state.policyStartTime;
  const weekMs  = 7 * 24 * 60 * 60 * 1000;
  const remaining = Math.max(0, weekMs - elapsed);
  return Math.ceil(remaining / (24 * 60 * 60 * 1000));
}

function updateStatusPill() {
  const pill = document.getElementById('dash-status');
  if (!state.registered) {
    pill.className = 'status-pill status-inactive';
    pill.textContent = 'Inactive';
    return;
  }
  if (!isPolicyValid()) {
    pill.className = 'status-pill status-expired';
    pill.textContent = 'Expired';
    return;
  }
  pill.className = 'status-pill status-active';
  pill.textContent = 'Active';
}

function startPolicyCountdown() {
  clearInterval(policyInterval);
  policyInterval = setInterval(() => {
    if (!state.policyStartTime) return;
    const weekMs    = 7 * 24 * 60 * 60 * 1000;
    const elapsed   = Date.now() - state.policyStartTime;
    const remaining = Math.max(0, weekMs - elapsed);

    const d = Math.floor(remaining / (24*60*60*1000));
    const h = Math.floor((remaining % (24*60*60*1000)) / (60*60*1000));
    const m = Math.floor((remaining % (60*60*1000)) / 60000);

    const el   = document.getElementById('policy-time');
    const wrap = document.getElementById('policy-countdown');
    if (el) {
      el.textContent = remaining === 0 ? 'Expired' : d + 'd ' + h + 'h ' + m + 'm';
      wrap.className = 'policy-countdown ' + (d < 2 ? 'expiring' : 'active');
    }

    document.getElementById('dash-days').textContent = getDaysLeft() || '—';
    updateCoverageFromPolicy();
    updateStatusPill();
  }, 30000);
}

function updateCoverageFromPolicy() {
  if (!state.policyStartTime) return;
  const weekMs  = 7 * 24 * 60 * 60 * 1000;
  const elapsed = Math.min(weekMs, Date.now() - state.policyStartTime);
  const pct     = Math.round((elapsed / weekMs) * 100);
  const dayNum  = Math.min(7, Math.ceil(elapsed / (24*60*60*1000)) + 1);
  document.getElementById('coverage-fill').style.width = pct + '%';
  document.getElementById('cov-day-label').textContent = 'Day ' + dayNum + ' of 7';
}

// ═══════════════════════════════════════════════════════════
//  PIPELINE VISUALIZATION
// ═══════════════════════════════════════════════════════════
function showPipeline() {
  document.getElementById('pipeline-viz').classList.add('visible');
  for (let i = 0; i < 5; i++) {
    const el = document.getElementById('pipe-' + i);
    if (el) el.className = 'pipe-dot';
  }
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById('arrow-' + i);
    if (el) el.className = 'pipe-arrow';
  }
}

function hidePipeline() {
  document.getElementById('pipeline-viz').classList.remove('visible');
}

function pipelineStep(step, delay) {
  return new Promise(resolve => {
    setTimeout(() => {
      const el = document.getElementById('pipe-' + step);
      if (el) el.className = 'pipe-dot active';
      if (step > 0) {
        const prev = document.getElementById('pipe-' + (step - 1));
        if (prev) prev.className = 'pipe-dot done';
        const arr = document.getElementById('arrow-' + (step - 1));
        if (arr) arr.className = 'pipe-arrow active-arrow';
      }
      resolve();
    }, delay);
  });
}

// ═══════════════════════════════════════════════════════════
//  PAYOUT RECORDING
// ═══════════════════════════════════════════════════════════
function recordPayout(type, amount, ev, isAuto) {
  const now     = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const feed    = document.getElementById('payout-feed');
  if (feed.querySelector('.empty-state')) feed.innerHTML = '';

  const item = document.createElement('div');
  item.className = 'payout-item';
  item.innerHTML = `
    <div class="payout-dot ${ev.type}">${ev.icon}</div>
    <div class="payout-info">
      <div class="payout-event">${ev.label} detected in your zone</div>
      <div class="payout-time">Today ${timeStr} · AI verified · Auto-credited${isAuto ? ' 🤖' : ''}</div>
    </div>
    <div class="payout-amount">+₹${amount}</div>
  `;
  feed.prepend(item);
  persistState();
}

// ═══════════════════════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════════════════════
function goto(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(page).classList.add('active');
  ['home', 'register', 'dashboard', 'admin'].forEach((id, i) => {
    document.querySelectorAll('.nav-tab')[i].classList.toggle('active', id === page);
  });
  if (page === 'admin') renderAdmin();
}

// ═══════════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════════
function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.display = 'none'; }, duration);
}

// ═══════════════════════════════════════════════════════════
//  REGISTRATION — risk score uses AI/ML engine
// ═══════════════════════════════════════════════════════════
function updateRisk() {
  const zone     = document.getElementById('reg-zone').value;
  const platform = document.getElementById('reg-platform').value;
  const display  = document.getElementById('risk-display');

  if (!zone) { display.style.display = 'none'; return; }

  const zd = zones[zone];
  const { score, label } = computeRiskScore(zone, platform || 'zomato');

  display.style.display = 'block';

  const fill = document.getElementById('risk-fill');
  fill.style.width = score + '%';
  fill.className   = 'risk-fill' + (score > 65 ? ' high' : score > 40 ? ' medium' : '');
  document.getElementById('risk-label').textContent = label + ' (' + score + ')';

  document.getElementById('ri-rain').textContent    = zd.avgRain + ' mm';
  document.getElementById('ri-temp').textContent    = zd.avgTemp + '°C';
  document.getElementById('ri-traffic').textContent = zd.traffic;

  const basicP   = computePremium(score, 'basic');
  const premiumP = computePremium(score, 'premium');
  document.getElementById('basic-price').innerHTML   = '₹' + basicP   + ' <span>/ week</span>';
  document.getElementById('premium-price').innerHTML = '₹' + premiumP + ' <span>/ week</span>';
}

function selectPlan(p) {
  state.plan = p;
  document.getElementById('plan-basic').classList.toggle('selected',   p === 'basic');
  document.getElementById('plan-premium').classList.toggle('selected', p === 'premium');
}

function activatePlan() {
  const name     = document.getElementById('reg-name').value.trim();
  const zone     = document.getElementById('reg-zone').value;
  const platform = document.getElementById('reg-platform').value;
  if (!name || !zone || !platform) { showToast('Fill all fields first, macha!'); return; }

  const { score, label } = computeRiskScore(zone, platform);
  const zoneLabel  = document.getElementById('reg-zone').options[document.getElementById('reg-zone').selectedIndex].text;
  const platLabel  = platform.charAt(0).toUpperCase() + platform.slice(1);

  state = {
    ...state,
    registered: true,
    name, zone, platform,
    riskScore: score,
    totalEarned: 0, disruptions: 0, autoTriggered: 0,
    policyStartTime: Date.now()
  };

  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  document.getElementById('dash-avatar').textContent  = initials;
  document.getElementById('dash-name').textContent    = name;
  document.getElementById('dash-zone').textContent    = zoneLabel.split(',')[0] + ' · ' + platLabel;
  document.getElementById('dash-earned').textContent  = '₹0';
  document.getElementById('dash-days').textContent    = '7';
  document.getElementById('dash-plan-label').textContent = platLabel + ' · ' + state.plan.charAt(0).toUpperCase() + state.plan.slice(1) + ' plan';
  document.getElementById('dash-limit').textContent   = '₹' + planLimits[state.plan];
  document.getElementById('dash-disruptions').textContent = '0';
  document.getElementById('coverage-fill').style.width   = '0%';
  document.getElementById('cov-day-label').textContent   = 'Day 1 of 7';
  document.getElementById('payout-feed').innerHTML =
    '<div class="empty-state"><div class="e-icon">💸</div><div>No payouts yet — conditions will auto-trigger soon!</div></div>';

  document.getElementById('policy-countdown-wrap').style.display = 'block';
  document.getElementById('policy-time').textContent = '7d 0h 0m';

  state.workers = state.workers.filter(w => w.name !== name);
  state.workers.push({ name, zone: zoneLabel.split(',')[0], plan: state.plan, riskScore: score, riskLabel: label, payouts: 0, earned: 0 });

  updateStatusPill();
  persistState();

  showToast('Coverage activated for ' + name + '! 🛡️');
  goto('dashboard');
  startConditionPolling();
  startPolicyCountdown();
}

// ═══════════════════════════════════════════════════════════
//  MANUAL TRIGGER (wraps the pipeline)
// ═══════════════════════════════════════════════════════════
function manualTrigger(type, btn) {
  if (!state.registered) { showToast('Register first, macha!'); goto('register'); return; }

  document.querySelectorAll('.sim-card').forEach(c => c.classList.remove('triggered'));
  btn.classList.add('triggered');

  processClaim(type, false).then(() => {
    setTimeout(() => btn.classList.remove('triggered'), 4000);
  });
}

// ═══════════════════════════════════════════════════════════
//  ADMIN PANEL
// ═══════════════════════════════════════════════════════════
function renderAdmin() {
  document.getElementById('admin-policies').textContent      = state.workers.length;
  document.getElementById('admin-pol-change').textContent    = state.workers.length ? '+' + state.workers.length + ' today' : '—';
  document.getElementById('admin-total-payouts').textContent = '₹' + state.totalEarned;
  document.getElementById('admin-auto-count').textContent    = state.autoTriggered;

  if (state.workers.length) {
    const avgRisk = Math.round(state.workers.reduce((s, w) => s + (w.riskScore || 50), 0) / state.workers.length);
    document.getElementById('admin-risk').textContent        = avgRisk;
    document.getElementById('admin-risk-change').textContent = avgRisk > 65 ? '⚠️ High avg risk' : 'Acceptable range';
  }

  const tbody = document.getElementById('admin-tbody');
  tbody.innerHTML = state.workers.length
    ? state.workers.map(w => `
        <tr>
          <td style="font-weight:700">${w.name}</td>
          <td>${w.zone}</td>
          <td><span class="badge badge-blue">${w.plan}</span></td>
          <td><span class="badge ${w.riskLabel === 'High' ? 'badge-red' : w.riskLabel === 'Medium' ? 'badge-amber' : 'badge-green'}">${w.riskLabel || '—'} (${w.riskScore || 50})</span></td>
          <td><span class="badge badge-green">Active</span></td>
          <td style="font-weight:800;color:var(--teal);font-family:var(--display)">₹${w.earned}</td>
        </tr>`).join('')
    : '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);padding:1.5rem">No registered workers yet</td></tr>';

  document.getElementById('zone-heatmap').innerHTML = Object.entries(zones).map(([k, v]) => `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:0.75rem;border-top:3px solid ${v.risk > 65 ? 'var(--brand)' : v.risk > 48 ? 'var(--amber)' : 'var(--teal)'}">
      <div style="font-size:12px;font-weight:800;font-family:var(--display)">${k.charAt(0).toUpperCase() + k.slice(1)}</div>
      <div style="font-size:11px;color:var(--text-secondary);margin-bottom:6px">${v.city}</div>
      <div style="font-size:13px;font-weight:800;color:${v.risk > 65 ? 'var(--brand)' : v.risk > 48 ? 'var(--amber)' : 'var(--teal)'}">${v.label} risk · ${v.risk}</div>
      <div style="height:4px;background:var(--surface2);border-radius:2px;margin-top:6px">
        <div style="height:4px;border-radius:2px;width:${v.risk}%;background:${v.risk > 65 ? 'var(--brand)' : v.risk > 48 ? 'var(--amber)' : 'var(--teal)'}"></div>
      </div>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════════
//  INIT — restore persisted state on load
// ═══════════════════════════════════════════════════════════
loadState();
renderAdmin();
