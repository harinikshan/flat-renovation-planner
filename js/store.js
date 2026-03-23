// localStorage abstraction with export/import

import { createDefaultData, SCHEMA_VERSION } from './models.js';

const STORAGE_KEY = 'renovation_data';
const BACKUP_KEY = 'renovation_data_backup';

let _cache = null;

export function load() {
  if (_cache) return _cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      _cache = JSON.parse(raw);
      _cache = migrate(_cache);
      return _cache;
    }
  } catch (e) {
    console.error('Failed to load data:', e);
  }
  _cache = createDefaultData();
  return _cache;
}

export function save(data) {
  // backup previous state
  const prev = localStorage.getItem(STORAGE_KEY);
  if (prev) localStorage.setItem(BACKUP_KEY, prev);

  data.lastModified = new Date().toISOString();
  _cache = data;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function exportJSON() {
  const data = load();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `renovation_backup_${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (!data.version || !Array.isArray(data.readyMadeItems) || !Array.isArray(data.designerWorkItems)) {
      return { success: false, error: 'Invalid data format. Missing required fields.' };
    }
    save(migrate(data));
    return { success: true };
  } catch (e) {
    return { success: false, error: 'Invalid JSON: ' + e.message };
  }
}

export function clearAll() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(BACKUP_KEY);
  _cache = null;
}

function migrate(data) {
  // Future migrations go here
  if (!data.version) data.version = SCHEMA_VERSION;
  if (!data.categories) {
    data.categories = {
      readyMade: ['Living Room', 'Bedroom', 'Kitchen', 'Balcony', 'Bathroom', 'Other'],
      designer: ['Bathroom', 'Storage', 'Kitchen', 'Electrical', 'Painting', 'Other']
    };
  }
  return data;
}
