// Reusable modal component

let overlay = null;

function ensureOverlay() {
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.innerHTML = '<div class="modal-box"><div class="modal-header"><h3 class="modal-title"></h3><button class="modal-close" aria-label="Close">&times;</button></div><div class="modal-body"></div><div class="modal-footer"><button class="btn btn-secondary modal-cancel">Cancel</button><button class="btn btn-primary modal-confirm">Save</button></div></div>';
    document.body.appendChild(overlay);

    overlay.querySelector('.modal-close').addEventListener('click', closeModal);
    overlay.querySelector('.modal-cancel').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
  }
  return overlay;
}

let currentCallback = null;

// fields: [{ key, label, type: 'text'|'number'|'select'|'textarea', options?, required?, value?, placeholder? }]
export function openModal({ title, fields, confirmText = 'Save', onConfirm }) {
  const ov = ensureOverlay();
  ov.querySelector('.modal-title').textContent = title;
  ov.querySelector('.modal-confirm').textContent = confirmText;

  const body = ov.querySelector('.modal-body');
  body.innerHTML = fields.map(f => {
    const req = f.required ? 'required' : '';
    const val = f.value ?? '';
    if (f.type === 'select') {
      const opts = (f.options || []).map(o =>
        `<option value="${o}" ${o === val ? 'selected' : ''}>${o}</option>`
      ).join('');
      return `<div class="form-group"><label>${f.label}</label><select data-key="${f.key}" ${req}>${opts}</select></div>`;
    }
    if (f.type === 'textarea') {
      return `<div class="form-group"><label>${f.label}</label><textarea data-key="${f.key}" ${req} placeholder="${f.placeholder || ''}">${val}</textarea></div>`;
    }
    return `<div class="form-group"><label>${f.label}</label><input type="${f.type || 'text'}" data-key="${f.key}" value="${val}" ${req} placeholder="${f.placeholder || ''}" ${f.type === 'number' ? 'min="0"' : ''}></div>`;
  }).join('');

  currentCallback = onConfirm;
  ov.querySelector('.modal-confirm').onclick = handleConfirm;
  ov.classList.add('active');
  const firstInput = body.querySelector('input, select, textarea');
  if (firstInput) setTimeout(() => firstInput.focus(), 100);
}

function handleConfirm() {
  const body = overlay.querySelector('.modal-body');
  const inputs = body.querySelectorAll('[data-key]');
  const values = {};
  let valid = true;

  inputs.forEach(el => {
    const key = el.dataset.key;
    values[key] = el.type === 'number' ? (el.value === '' ? null : Number(el.value)) : el.value;
    if (el.required && !el.value.trim()) {
      el.classList.add('error');
      valid = false;
    } else {
      el.classList.remove('error');
    }
  });

  if (!valid) return;
  if (currentCallback) currentCallback(values);
  closeModal();
}

export function closeModal() {
  if (overlay) overlay.classList.remove('active');
  currentCallback = null;
}

// Simple confirm dialog
export function confirmDialog(message) {
  return new Promise(resolve => {
    openModal({
      title: 'Confirm',
      fields: [{ key: '_msg', label: message, type: 'hidden' }],
      confirmText: 'Yes, proceed',
      onConfirm: () => resolve(true)
    });
    // Override body with just the message
    const body = overlay.querySelector('.modal-body');
    body.innerHTML = `<p style="margin:0;font-size:1rem;line-height:1.5">${message}</p>`;
    // Handle cancel = resolve false
    const cancel = overlay.querySelector('.modal-cancel');
    const origClick = cancel.onclick;
    cancel.onclick = () => { resolve(false); closeModal(); };
    overlay.querySelector('.modal-close').onclick = () => { resolve(false); closeModal(); };
    overlay.onclick = (e) => { if (e.target === overlay) { resolve(false); closeModal(); } };
  });
}
