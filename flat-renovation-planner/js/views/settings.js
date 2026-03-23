// Settings view — budget, theme, data management

import { load, save, exportJSON, importJSON, clearAll } from '../store.js';
import { showToast } from '../components/toast.js';
import { confirmDialog } from '../components/modal.js';

const container = () => document.getElementById('view-settings');

export function renderSettings() {
  const data = load();
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const lastMod = data.lastModified ? new Date(data.lastModified).toLocaleString('en-IN') : 'Never';

  const el = container();
  el.innerHTML = `
    <div class="settings-section">
      <h3>Budget</h3>
      <div class="settings-row">
        <label>Total Renovation Budget</label>
        <div style="display:flex;gap:8px;align-items:center">
          <span style="font-size:0.9rem;color:var(--text-secondary)">₹</span>
          <input type="number" class="settings-input" id="budget-input" value="${data.totalBudget || ''}" placeholder="e.g. 1500000" min="0">
          <button class="btn btn-primary btn-sm" id="save-budget">Save</button>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h3>Appearance</h3>
      <div class="settings-row">
        <label>Dark Mode</label>
        <label class="toggle">
          <input type="checkbox" id="theme-toggle" ${isDark ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>

    <div class="settings-section">
      <h3>Data Management</h3>
      <div class="settings-row" style="flex-direction:column;align-items:stretch;gap:12px">
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary" id="export-btn">Export JSON</button>
          <label class="btn" style="cursor:pointer">
            Import JSON
            <input type="file" accept=".json" id="import-input" style="display:none">
          </label>
          <button class="btn btn-danger" id="clear-btn">Clear All Data</button>
        </div>
        <div style="font-size:0.8rem;color:var(--text-secondary)">
          Last modified: ${lastMod}<br>
          Ready-made items: ${data.readyMadeItems.length} | Designer items: ${data.designerWorkItems.length}
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h3>Categories</h3>
      <div class="settings-row" style="flex-direction:column;align-items:stretch;gap:8px">
        <div>
          <label style="font-size:0.8rem;font-weight:500;color:var(--text-secondary)">Ready-Made Categories</label>
          <input type="text" class="settings-input" id="rm-categories" value="${data.categories.readyMade.join(', ')}" style="width:100%;text-align:left;margin-top:4px">
        </div>
        <div>
          <label style="font-size:0.8rem;font-weight:500;color:var(--text-secondary)">Designer Categories</label>
          <input type="text" class="settings-input" id="dw-categories" value="${data.categories.designer.join(', ')}" style="width:100%;text-align:left;margin-top:4px">
        </div>
        <button class="btn btn-sm btn-primary" id="save-categories">Save Categories</button>
      </div>
    </div>
  `;

  // Save budget
  el.querySelector('#save-budget').addEventListener('click', () => {
    const val = Number(el.querySelector('#budget-input').value) || 0;
    const d = load();
    d.totalBudget = val;
    save(d);
    showToast('Budget saved!', 'success');
  });

  // Theme toggle
  el.querySelector('#theme-toggle').addEventListener('change', (e) => {
    const theme = e.target.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('renovation_theme', theme);
  });

  // Export
  el.querySelector('#export-btn').addEventListener('click', () => {
    exportJSON();
    showToast('Data exported!', 'success');
  });

  // Import
  el.querySelector('#import-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = importJSON(ev.target.result);
      if (result.success) {
        showToast('Data imported successfully!', 'success');
        renderSettings();
      } else {
        showToast(result.error, 'error', 5000);
      }
    };
    reader.readAsText(file);
  });

  // Clear
  el.querySelector('#clear-btn').addEventListener('click', () => {
    confirmDialog('Delete ALL renovation data? This cannot be undone. Make sure you have an export backup!').then(ok => {
      if (!ok) return;
      clearAll();
      showToast('All data cleared', 'error');
      renderSettings();
    });
  });

  // Save categories
  el.querySelector('#save-categories').addEventListener('click', () => {
    const d = load();
    d.categories.readyMade = el.querySelector('#rm-categories').value.split(',').map(s => s.trim()).filter(Boolean);
    d.categories.designer = el.querySelector('#dw-categories').value.split(',').map(s => s.trim()).filter(Boolean);
    save(d);
    showToast('Categories saved!', 'success');
  });
}

// Apply saved theme on load
const savedTheme = localStorage.getItem('renovation_theme');
if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
