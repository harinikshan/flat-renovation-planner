// Interior Designer view — quotations, payments, work tracking

import { load, save } from '../store.js';
import { createDesignerWorkItem, createQuotation } from '../models.js';
import { openModal, confirmDialog } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { renderFilters, filterItems } from '../components/filters.js';
import { formatINR } from './readymade.js';

const container = () => document.getElementById('view-designer');
let currentFilters = { search: '', category: '', status: '' };
let expandedItems = new Set();

function statusLabel(s) {
  return { quoting: 'Collecting Quotes', accepted: 'Accepted', in_progress: 'In Progress', completed: 'Completed' }[s] || s;
}

function paymentLabel(s) {
  return { pending: 'Pending', partial: 'Partial', paid: 'Paid' }[s] || s;
}

function renderQuotation(q, workItem) {
  const isAccepted = q.id === workItem.acceptedQuotationId;
  return `
    <div class="quotation-item ${isAccepted ? 'accepted' : ''}">
      <div>
        <span class="quotation-vendor">${q.vendorName}</span>
        ${q.notes ? `<span style="font-size:0.75rem;color:var(--text-secondary);margin-left:8px">${q.notes}</span>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="quotation-amount">${formatINR(q.amount)}</span>
        ${isAccepted ? '<span class="badge badge-bought">Accepted</span>' :
          workItem.acceptedQuotationId ? '' :
          `<button class="btn btn-sm btn-success" data-action="accept-quote" data-id="${workItem.id}" data-qid="${q.id}">Accept</button>`
        }
        ${!isAccepted ? `<button class="btn btn-sm btn-danger" data-action="delete-quote" data-id="${workItem.id}" data-qid="${q.id}" style="padding:4px 6px">&times;</button>` : ''}
      </div>
    </div>
  `;
}

function renderCard(item) {
  const acceptedQ = item.quotations.find(q => q.id === item.acceptedQuotationId);
  const acceptedAmount = acceptedQ ? acceptedQ.amount : 0;
  const paymentPct = acceptedAmount > 0 ? Math.min(100, (item.amountPaid / acceptedAmount) * 100) : 0;
  const isExpanded = expandedItems.has(item.id);

  let actions = '';
  if (item.status === 'quoting' || item.status === 'accepted') {
    actions += `<button class="btn btn-sm" data-action="edit-work" data-id="${item.id}">Edit</button>`;
  }
  if (item.status === 'accepted') {
    actions += `<button class="btn btn-primary btn-sm" data-action="start-work" data-id="${item.id}">Start Work</button>`;
    actions += `<button class="btn btn-warning btn-sm" data-action="record-payment" data-id="${item.id}">Record Payment</button>`;
  }
  if (item.status === 'in_progress') {
    actions += `<button class="btn btn-warning btn-sm" data-action="record-payment" data-id="${item.id}">Record Payment</button>`;
    actions += `<button class="btn btn-success btn-sm" data-action="complete-work" data-id="${item.id}">Mark Complete</button>`;
    actions += `<button class="btn btn-sm" data-action="edit-work" data-id="${item.id}">Edit</button>`;
  }
  if (item.status === 'completed') {
    actions += `<button class="btn btn-warning btn-sm" data-action="record-payment" data-id="${item.id}">Record Payment</button>`;
  }
  actions += `<button class="btn btn-danger btn-sm" data-action="delete-work" data-id="${item.id}">Delete</button>`;

  return `
    <div class="card">
      <div class="card-header">
        <div class="card-title">${item.name}</div>
        <div style="display:flex;gap:6px;align-items:center">
          <span class="badge badge-${item.status}">${statusLabel(item.status)}</span>
          <span class="badge badge-${item.priority}">${item.priority}</span>
        </div>
      </div>
      <div class="card-meta">
        <span>${item.category}</span>
        ${acceptedQ ? `<span>Accepted: ${acceptedQ.vendorName} — ${formatINR(acceptedQ.amount)}</span>` : `<span>${item.quotations.length} quotation${item.quotations.length !== 1 ? 's' : ''}</span>`}
      </div>
      ${item.notes ? `<div class="notes-text">${item.notes}</div>` : ''}

      ${acceptedAmount > 0 ? `
        <div class="payment-bar">
          <span>${paymentLabel(item.paymentStatus)}</span>
          <div class="payment-track">
            <div class="payment-fill" style="width:${paymentPct}%"></div>
          </div>
          <span>${formatINR(item.amountPaid)} / ${formatINR(acceptedAmount)}</span>
        </div>
      ` : ''}

      <div style="margin-top:10px">
        <button class="btn btn-sm" data-action="toggle-quotes" data-id="${item.id}" style="width:100%;justify-content:center">
          ${isExpanded ? 'Hide' : 'Show'} Quotations (${item.quotations.length})
        </button>
      </div>

      ${isExpanded ? `
        <div class="quotation-list">
          ${item.quotations.length > 0 ? item.quotations.map(q => renderQuotation(q, item)).join('') : '<div style="font-size:0.85rem;color:var(--text-secondary);padding:8px 0">No quotations yet</div>'}
          <button class="btn btn-primary btn-sm" data-action="add-quote" data-id="${item.id}" style="margin-top:8px;width:100%;justify-content:center">+ Add Quotation</button>
        </div>
      ` : ''}

      ${item.dateCompleted ? `<div style="font-size:0.75rem;color:var(--text-secondary);margin-top:8px">Completed: ${item.dateCompleted}</div>` : ''}
      <div class="card-actions">${actions}</div>
    </div>
  `;
}

export function renderDesigner() {
  const data = load();
  const el = container();
  const items = filterItems(data.designerWorkItems, currentFilters);

  el.innerHTML = `
    <div id="dw-filters"></div>
    ${items.length === 0 && data.designerWorkItems.length === 0 ? `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
        <p><strong>No designer work items yet</strong></p>
        <p>Tap + to add work like bathroom makeover, cupboards, etc.</p>
      </div>
    ` : `
      ${items.map(renderCard).join('')}
      ${items.length === 0 ? '<div class="empty-state"><p>No items match your filters</p></div>' : ''}
    `}
  `;

  renderFilters('dw-filters', {
    categories: data.categories.designer,
    statuses: [
      { value: 'quoting', label: 'Collecting Quotes' },
      { value: 'accepted', label: 'Accepted' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' }
    ],
    onFilter: (f) => { currentFilters = f; renderDesigner(); }
  });

  el.removeEventListener('click', handleAction);
  el.addEventListener('click', handleAction);
}

function handleAction(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;
  const qid = btn.dataset.qid;
  const data = load();
  const item = data.designerWorkItems.find(i => i.id === id);
  if (!item) return;

  switch (action) {
    case 'toggle-quotes':
      if (expandedItems.has(id)) expandedItems.delete(id);
      else expandedItems.add(id);
      renderDesigner();
      break;

    case 'add-quote':
      openModal({
        title: `Add Quotation for "${item.name}"`,
        fields: [
          { key: 'vendorName', label: 'Vendor / Designer Name', type: 'text', required: true, placeholder: 'e.g. XYZ Interiors' },
          { key: 'amount', label: 'Quotation Amount (₹)', type: 'number', required: true, placeholder: '85000' },
          { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'What\'s included...' }
        ],
        confirmText: 'Add Quotation',
        onConfirm: (vals) => {
          const d = load();
          const it = d.designerWorkItems.find(i => i.id === id);
          if (!it) return;
          it.quotations.push(createQuotation(vals));
          save(d);
          showToast('Quotation added', 'success');
          expandedItems.add(id);
          renderDesigner();
        }
      });
      break;

    case 'accept-quote': {
      const q = item.quotations.find(qq => qq.id === qid);
      if (!q) return;
      confirmDialog(`Accept quotation from "${q.vendorName}" for ${formatINR(q.amount)}?`).then(ok => {
        if (!ok) return;
        const d = load();
        const it = d.designerWorkItems.find(i => i.id === id);
        if (!it) return;
        it.quotations.forEach(qq => qq.isAccepted = (qq.id === qid));
        it.acceptedQuotationId = qid;
        it.status = 'accepted';
        save(d);
        showToast(`Accepted ${q.vendorName}`, 'success');
        renderDesigner();
      });
      break;
    }

    case 'delete-quote': {
      const q = item.quotations.find(qq => qq.id === qid);
      if (!q) return;
      confirmDialog(`Delete quotation from "${q.vendorName}"?`).then(ok => {
        if (!ok) return;
        const d = load();
        const it = d.designerWorkItems.find(i => i.id === id);
        if (!it) return;
        it.quotations = it.quotations.filter(qq => qq.id !== qid);
        if (it.acceptedQuotationId === qid) {
          it.acceptedQuotationId = null;
          it.status = 'quoting';
        }
        save(d);
        showToast('Quotation removed', 'error');
        renderDesigner();
      });
      break;
    }

    case 'start-work':
      item.status = 'in_progress';
      save(data);
      showToast(`${item.name} — work started`);
      renderDesigner();
      break;

    case 'complete-work':
      item.status = 'completed';
      item.dateCompleted = new Date().toISOString().split('T')[0];
      save(data);
      showToast(`${item.name} completed!`, 'success');
      renderDesigner();
      break;

    case 'record-payment':
      openModal({
        title: `Record Payment — ${item.name}`,
        fields: [
          { key: 'amount', label: 'Payment Amount (₹)', type: 'number', required: true, placeholder: 'Amount paid' },
          { key: 'notes', label: 'Payment Notes', type: 'textarea', placeholder: 'e.g. Advance, 2nd installment...' }
        ],
        confirmText: 'Record Payment',
        onConfirm: (vals) => {
          const d = load();
          const it = d.designerWorkItems.find(i => i.id === id);
          if (!it) return;
          it.amountPaid = (it.amountPaid || 0) + (Number(vals.amount) || 0);
          const acceptedQ = it.quotations.find(q => q.id === it.acceptedQuotationId);
          const total = acceptedQ ? acceptedQ.amount : 0;
          it.paymentStatus = it.amountPaid >= total && total > 0 ? 'paid' : it.amountPaid > 0 ? 'partial' : 'pending';
          save(d);
          showToast(`Payment of ${formatINR(vals.amount)} recorded`, 'success');
          renderDesigner();
        }
      });
      break;

    case 'edit-work':
      editWorkItem(item);
      break;

    case 'delete-work':
      confirmDialog(`Delete "${item.name}"? This cannot be undone.`).then(ok => {
        if (!ok) return;
        const d = load();
        d.designerWorkItems = d.designerWorkItems.filter(i => i.id !== id);
        save(d);
        showToast(`${item.name} deleted`, 'error');
        renderDesigner();
      });
      break;
  }
}

function editWorkItem(item) {
  const data = load();
  openModal({
    title: `Edit "${item.name}"`,
    fields: [
      { key: 'name', label: 'Work Item Name', type: 'text', required: true, value: item.name },
      { key: 'category', label: 'Category', type: 'select', options: data.categories.designer, value: item.category },
      { key: 'priority', label: 'Priority', type: 'select', options: ['high', 'medium', 'low'], value: item.priority },
      { key: 'notes', label: 'Notes', type: 'textarea', value: item.notes }
    ],
    onConfirm: (vals) => {
      const d = load();
      const it = d.designerWorkItems.find(i => i.id === item.id);
      if (!it) return;
      Object.assign(it, vals);
      save(d);
      showToast(`${vals.name} updated`);
      renderDesigner();
    }
  });
}

export function addNewItem() {
  const data = load();
  openModal({
    title: 'Add Designer Work Item',
    fields: [
      { key: 'name', label: 'Work Item Name', type: 'text', required: true, placeholder: 'e.g. Master Bathroom Makeover' },
      { key: 'category', label: 'Category', type: 'select', options: data.categories.designer },
      { key: 'priority', label: 'Priority', type: 'select', options: ['high', 'medium', 'low'], value: 'medium' },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Describe the work...' }
    ],
    confirmText: 'Add Work Item',
    onConfirm: (vals) => {
      const d = load();
      d.designerWorkItems.push(createDesignerWorkItem(vals));
      save(d);
      showToast(`${vals.name} added!`, 'success');
      renderDesigner();
    }
  });
}
