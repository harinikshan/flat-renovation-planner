// Ready-Made Items view — Needed → Finalized → Bought

import { load, save } from '../store.js';
import { createReadyMadeItem } from '../models.js';
import { openModal, confirmDialog } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { renderFilters, filterItems } from '../components/filters.js';

const container = () => document.getElementById('view-readymade');
let currentFilters = { search: '', category: '', status: '' };

export function formatINR(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function statusLabel(s) {
  return { needed: 'Needed', finalized: 'Finalized', bought: 'Bought' }[s] || s;
}

function priorityIcon(p) {
  const colors = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' };
  return `<span style="color:${colors[p] || colors.medium}">${p}</span>`;
}

function renderCard(item) {
  const est = formatINR(item.estimatedCost);
  const actual = item.actualCost != null ? formatINR(item.actualCost) : null;
  const savings = item.actualCost != null ? item.estimatedCost - item.actualCost : null;

  let actions = '';
  if (item.status === 'needed') {
    actions = `
      <button class="btn btn-warning btn-sm" data-action="finalize" data-id="${item.id}">Finalize</button>
      <button class="btn btn-sm" data-action="edit" data-id="${item.id}">Edit</button>
      <button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">Delete</button>
    `;
  } else if (item.status === 'finalized') {
    actions = `
      <button class="btn btn-success btn-sm" data-action="buy" data-id="${item.id}">Mark Bought</button>
      <button class="btn btn-sm" data-action="edit" data-id="${item.id}">Edit</button>
      <button class="btn btn-sm" data-action="unfinalize" data-id="${item.id}">Back to Needed</button>
      <button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">Delete</button>
    `;
  } else {
    actions = `
      <button class="btn btn-sm" data-action="edit" data-id="${item.id}">Edit</button>
      <button class="btn btn-sm" data-action="unbuy" data-id="${item.id}">Undo Purchase</button>
      <button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">Delete</button>
    `;
  }

  return `
    <div class="card">
      <div class="card-header">
        <div class="card-title">${item.name}</div>
        <span class="badge badge-${item.priority}">${item.priority}</span>
      </div>
      <div class="card-meta">
        <span>${item.category}</span>
        <span>Est: ${est}</span>
        ${actual ? `<span>Actual: ${actual}</span>` : ''}
        ${savings != null && savings !== 0 ? `<span style="color:${savings > 0 ? 'var(--success)' : 'var(--danger)'}">${savings > 0 ? 'Saved' : 'Over'}: ${formatINR(Math.abs(savings))}</span>` : ''}
      </div>
      ${item.notes ? `<div class="notes-text">${item.notes}</div>` : ''}
      ${item.link ? `<div style="margin-top:4px"><a href="${item.link}" target="_blank" rel="noopener" style="font-size:0.8rem;color:var(--accent)">View link</a></div>` : ''}
      ${item.dateBought ? `<div style="font-size:0.75rem;color:var(--text-secondary);margin-top:4px">Bought: ${item.dateBought}</div>` : ''}
      <div class="card-actions">${actions}</div>
    </div>
  `;
}

function renderSection(title, items, status) {
  if (items.length === 0) return '';
  const total = items.reduce((s, i) => s + (i.actualCost ?? i.estimatedCost ?? 0), 0);
  return `
    <div class="section-group">
      <div class="section-header" data-toggle="${status}">
        <span class="section-title">${title}</span>
        <div style="display:flex;gap:8px;align-items:center">
          <span style="font-size:0.8rem;font-weight:600;color:var(--text-secondary)">${formatINR(total)}</span>
          <span class="section-count">${items.length}</span>
        </div>
      </div>
      <div class="section-body" id="section-${status}">
        ${items.map(renderCard).join('')}
      </div>
    </div>
  `;
}

export function renderReadyMade() {
  const data = load();
  const el = container();
  const items = filterItems(data.readyMadeItems, currentFilters);

  const needed = items.filter(i => i.status === 'needed');
  const finalized = items.filter(i => i.status === 'finalized');
  const bought = items.filter(i => i.status === 'bought');

  el.innerHTML = `
    <div id="rm-filters"></div>
    ${items.length === 0 && data.readyMadeItems.length === 0 ? `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <p><strong>No items yet</strong></p>
        <p>Tap + to add your first ready-made item</p>
      </div>
    ` : `
      ${renderSection('Needed', needed, 'needed')}
      ${renderSection('Finalized', finalized, 'finalized')}
      ${renderSection('Bought', bought, 'bought')}
      ${items.length === 0 ? '<div class="empty-state"><p>No items match your filters</p></div>' : ''}
    `}
  `;

  renderFilters('rm-filters', {
    categories: data.categories.readyMade,
    statuses: [
      { value: 'needed', label: 'Needed' },
      { value: 'finalized', label: 'Finalized' },
      { value: 'bought', label: 'Bought' }
    ],
    onFilter: (f) => { currentFilters = f; renderReadyMade(); }
  });

  // Event delegation
  el.addEventListener('click', handleAction, { once: false });
}

// Remove old listeners on re-render
let _bound = false;
const _renderReadyMadeOrig = renderReadyMade;

export { };

function handleAction(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) {
    // Toggle section collapse
    const header = e.target.closest('.section-header');
    if (header) {
      const status = header.dataset.toggle;
      const body = document.getElementById('section-' + status);
      if (body) body.classList.toggle('collapsed');
    }
    return;
  }

  const action = btn.dataset.action;
  const id = btn.dataset.id;
  const data = load();
  const idx = data.readyMadeItems.findIndex(i => i.id === id);
  if (idx === -1) return;
  const item = data.readyMadeItems[idx];

  switch (action) {
    case 'finalize':
      item.status = 'finalized';
      item.dateFinalized = new Date().toISOString().split('T')[0];
      save(data);
      showToast(`${item.name} finalized`);
      renderReadyMade();
      break;

    case 'unfinalize':
      item.status = 'needed';
      item.dateFinalized = null;
      save(data);
      showToast(`${item.name} moved back to needed`);
      renderReadyMade();
      break;

    case 'buy':
      openModal({
        title: `Mark "${item.name}" as Bought`,
        fields: [
          { key: 'actualCost', label: 'Actual Cost (₹)', type: 'number', required: true, value: item.estimatedCost, placeholder: 'Amount paid' },
          { key: 'dateBought', label: 'Date Bought', type: 'date', value: new Date().toISOString().split('T')[0] }
        ],
        confirmText: 'Mark Bought',
        onConfirm: (vals) => {
          item.status = 'bought';
          item.actualCost = vals.actualCost;
          item.dateBought = vals.dateBought || new Date().toISOString().split('T')[0];
          save(data);
          showToast(`${item.name} marked as bought!`, 'success');
          renderReadyMade();
        }
      });
      break;

    case 'unbuy':
      item.status = 'finalized';
      item.actualCost = null;
      item.dateBought = null;
      save(data);
      showToast(`${item.name} purchase undone`);
      renderReadyMade();
      break;

    case 'edit':
      editItem(item);
      break;

    case 'delete':
      confirmDialog(`Delete "${item.name}"? This cannot be undone.`).then(ok => {
        if (!ok) return;
        const d = load();
        d.readyMadeItems = d.readyMadeItems.filter(i => i.id !== id);
        save(d);
        showToast(`${item.name} deleted`, 'error');
        renderReadyMade();
      });
      break;
  }
}

function editItem(item) {
  const data = load();
  openModal({
    title: `Edit "${item.name}"`,
    fields: [
      { key: 'name', label: 'Item Name', type: 'text', required: true, value: item.name },
      { key: 'category', label: 'Category', type: 'select', options: data.categories.readyMade, value: item.category },
      { key: 'estimatedCost', label: 'Estimated Cost (₹)', type: 'number', required: true, value: item.estimatedCost },
      { key: 'priority', label: 'Priority', type: 'select', options: ['high', 'medium', 'low'], value: item.priority },
      { key: 'notes', label: 'Notes', type: 'textarea', value: item.notes },
      { key: 'link', label: 'Product Link', type: 'text', value: item.link, placeholder: 'https://...' }
    ],
    onConfirm: (vals) => {
      const d = load();
      const it = d.readyMadeItems.find(i => i.id === item.id);
      if (!it) return;
      Object.assign(it, vals);
      it.estimatedCost = Number(vals.estimatedCost) || 0;
      save(d);
      showToast(`${vals.name} updated`);
      renderReadyMade();
    }
  });
}

export function addNewItem() {
  const data = load();
  openModal({
    title: 'Add Ready-Made Item',
    fields: [
      { key: 'name', label: 'Item Name', type: 'text', required: true, placeholder: 'e.g. Dining Table' },
      { key: 'category', label: 'Category', type: 'select', options: data.categories.readyMade },
      { key: 'estimatedCost', label: 'Estimated Cost (₹)', type: 'number', required: true, placeholder: '25000' },
      { key: 'priority', label: 'Priority', type: 'select', options: ['high', 'medium', 'low'], value: 'medium' },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any details...' },
      { key: 'link', label: 'Product Link', type: 'text', placeholder: 'https://...' }
    ],
    confirmText: 'Add Item',
    onConfirm: (vals) => {
      const d = load();
      d.readyMadeItems.push(createReadyMadeItem(vals));
      save(d);
      showToast(`${vals.name} added!`, 'success');
      renderReadyMade();
    }
  });
}
