// Main app - routing and initialization

import { load } from './store.js';
import { renderDashboard } from './views/dashboard.js';
import { renderReadyMade } from './views/readymade.js';
import { renderDesigner } from './views/designer.js';
import { renderSettings } from './views/settings.js';

const views = {
  dashboard: renderDashboard,
  readymade: renderReadyMade,
  designer: renderDesigner,
  settings: renderSettings
};

function getRoute() {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  return hash || 'dashboard';
}

function navigate() {
  const route = getRoute();
  // Update tab bar
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === route);
  });
  // Hide all views, show active
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const activeView = document.getElementById(`view-${route}`);
  if (activeView) activeView.classList.add('active');

  // Render the active view
  const renderFn = views[route];
  if (renderFn) renderFn();

  // Update FAB visibility
  const fab = document.getElementById('fab');
  if (fab) {
    fab.style.display = (route === 'readymade' || route === 'designer') ? 'flex' : 'none';
    fab.dataset.context = route;
  }
}

function init() {
  // Ensure data is loaded
  load();

  // Tab navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.hash = '#/' + btn.dataset.tab;
    });
  });

  // FAB click
  document.getElementById('fab').addEventListener('click', () => {
    const context = document.getElementById('fab').dataset.context;
    if (context === 'readymade') {
      import('./views/readymade.js').then(m => m.addNewItem());
    } else if (context === 'designer') {
      import('./views/designer.js').then(m => m.addNewItem());
    }
  });

  // Listen for route changes
  window.addEventListener('hashchange', navigate);

  // Initial render
  if (!window.location.hash) window.location.hash = '#/dashboard';
  else navigate();
}

document.addEventListener('DOMContentLoaded', init);
