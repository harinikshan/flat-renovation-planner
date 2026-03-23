// Search and filter bar component

export function renderFilters(containerId, { categories = [], statuses = [], onFilter }) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `
    <div class="filter-bar">
      <input type="text" class="filter-search" placeholder="Search items..." />
      <select class="filter-category">
        <option value="">All Categories</option>
        ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
      </select>
      <select class="filter-status">
        <option value="">All Status</option>
        ${statuses.map(s => `<option value="${s.value}">${s.label}</option>`).join('')}
      </select>
    </div>
  `;

  let debounceTimer;
  const emit = () => {
    const search = el.querySelector('.filter-search').value.trim().toLowerCase();
    const category = el.querySelector('.filter-category').value;
    const status = el.querySelector('.filter-status').value;
    onFilter({ search, category, status });
  };

  el.querySelector('.filter-search').addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(emit, 200);
  });
  el.querySelector('.filter-category').addEventListener('change', emit);
  el.querySelector('.filter-status').addEventListener('change', emit);
}

export function filterItems(items, { search = '', category = '', status = '' }) {
  return items.filter(item => {
    if (search && !item.name.toLowerCase().includes(search)) return false;
    if (category && item.category !== category) return false;
    if (status && item.status !== status) return false;
    return true;
  });
}
