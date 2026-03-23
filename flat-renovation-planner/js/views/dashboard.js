// Dashboard view — Budget overview, breakdowns, progress

import { load } from '../store.js';
import { formatINR } from './readymade.js';

const container = () => document.getElementById('view-dashboard');

function computeStats(data) {
  const rm = data.readyMadeItems;
  const dw = data.designerWorkItems;

  // Ready-made
  const rmBought = rm.filter(i => i.status === 'bought');
  const rmFinalized = rm.filter(i => i.status === 'finalized');
  const rmNeeded = rm.filter(i => i.status === 'needed');
  const rmSpent = rmBought.reduce((s, i) => s + (i.actualCost ?? i.estimatedCost ?? 0), 0);
  const rmCommitted = rmFinalized.reduce((s, i) => s + (i.estimatedCost ?? 0), 0);
  const rmPlanned = rmNeeded.reduce((s, i) => s + (i.estimatedCost ?? 0), 0);

  // Designer
  const dwSpent = dw.reduce((s, i) => s + (i.amountPaid || 0), 0);
  const dwCommitted = dw.reduce((s, i) => {
    const q = i.quotations.find(q => q.id === i.acceptedQuotationId);
    return s + (q ? q.amount - (i.amountPaid || 0) : 0);
  }, 0);

  const totalSpent = rmSpent + dwSpent;
  const totalCommitted = rmCommitted + dwCommitted;
  const totalBudget = data.totalBudget || 0;
  const remaining = totalBudget - totalSpent - totalCommitted;
  const spentPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const committedPct = totalBudget > 0 ? (totalCommitted / totalBudget) * 100 : 0;
  const usedPct = spentPct + committedPct;

  // Category breakdown
  const catMap = {};
  rm.forEach(i => {
    if (!catMap[i.category]) catMap[i.category] = { spent: 0, committed: 0, planned: 0 };
    if (i.status === 'bought') catMap[i.category].spent += (i.actualCost ?? i.estimatedCost ?? 0);
    else if (i.status === 'finalized') catMap[i.category].committed += (i.estimatedCost ?? 0);
    else catMap[i.category].planned += (i.estimatedCost ?? 0);
  });
  dw.forEach(i => {
    if (!catMap[i.category]) catMap[i.category] = { spent: 0, committed: 0, planned: 0 };
    catMap[i.category].spent += (i.amountPaid || 0);
    const q = i.quotations.find(q => q.id === i.acceptedQuotationId);
    if (q) catMap[i.category].committed += (q.amount - (i.amountPaid || 0));
  });

  return {
    totalBudget, totalSpent, totalCommitted, remaining,
    spentPct, committedPct, usedPct,
    rmSpent, rmCommitted, rmPlanned,
    rmTotal: rm.length, rmBoughtCount: rmBought.length,
    dwSpent, dwCommitted,
    dwTotal: dw.length, dwCompletedCount: dw.filter(i => i.status === 'completed').length,
    catMap
  };
}

function progressColor(pct) {
  if (pct > 90) return 'progress-red';
  if (pct > 70) return 'progress-amber';
  return 'progress-green';
}

export function renderDashboard() {
  const data = load();
  const s = computeStats(data);
  const el = container();

  const catEntries = Object.entries(s.catMap).sort((a, b) => (b[1].spent + b[1].committed) - (a[1].spent + a[1].committed));
  const maxCatAmount = catEntries.length > 0 ? Math.max(...catEntries.map(([, v]) => v.spent + v.committed)) : 1;

  el.innerHTML = `
    ${s.totalBudget === 0 ? `
      <div class="budget-card" style="text-align:center">
        <h2>Welcome!</h2>
        <p style="color:var(--text-secondary);margin-bottom:12px">Set your total renovation budget to get started.</p>
        <button class="btn btn-primary" onclick="window.location.hash='#/settings'">Set Budget</button>
      </div>
    ` : ''}

    <div class="budget-card">
      <h2>Budget Overview</h2>
      <div class="budget-amount">${formatINR(s.totalBudget)}</div>
      <div class="progress-bar">
        <div class="progress-fill ${progressColor(s.usedPct)}" style="width:${Math.min(100, s.usedPct)}%"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-secondary)">
        <span>${Math.round(s.spentPct)}% spent</span>
        <span>${Math.round(s.committedPct)}% committed</span>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-box">
        <div class="stat-label">Spent</div>
        <div class="stat-value" style="color:var(--danger)">${formatINR(s.totalSpent)}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Committed</div>
        <div class="stat-value" style="color:var(--warning)">${formatINR(s.totalCommitted)}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Remaining</div>
        <div class="stat-value" style="color:${s.remaining >= 0 ? 'var(--success)' : 'var(--danger)'}">${formatINR(s.remaining)}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Items</div>
        <div class="stat-value">${s.rmTotal + s.dwTotal}</div>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-box">
        <div class="stat-label">Ready-Made</div>
        <div style="font-size:0.85rem;margin-top:4px">
          <div>Spent: <strong>${formatINR(s.rmSpent)}</strong></div>
          <div>Committed: <strong>${formatINR(s.rmCommitted)}</strong></div>
          <div style="color:var(--text-secondary)">${s.rmBoughtCount}/${s.rmTotal} bought</div>
        </div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Interior Designer</div>
        <div style="font-size:0.85rem;margin-top:4px">
          <div>Paid: <strong>${formatINR(s.dwSpent)}</strong></div>
          <div>Committed: <strong>${formatINR(s.dwCommitted)}</strong></div>
          <div style="color:var(--text-secondary)">${s.dwCompletedCount}/${s.dwTotal} completed</div>
        </div>
      </div>
    </div>

    ${catEntries.length > 0 ? `
      <div class="budget-card">
        <h2>Category Breakdown</h2>
        ${catEntries.map(([cat, v]) => {
          const total = v.spent + v.committed;
          const pct = maxCatAmount > 0 ? (total / maxCatAmount) * 100 : 0;
          return `
            <div class="bar-chart-row">
              <div class="bar-chart-label">${cat}</div>
              <div class="bar-chart-bar">
                <div class="bar-chart-fill" style="width:${pct}%"></div>
              </div>
              <div class="bar-chart-amount">${formatINR(total)}</div>
            </div>
          `;
        }).join('')}
      </div>
    ` : ''}
  `;
}
