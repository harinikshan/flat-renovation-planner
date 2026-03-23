// Data model definitions and factory functions

export const SCHEMA_VERSION = 1;

export const DEFAULT_CATEGORIES = {
  readyMade: ['Living Room', 'Bedroom', 'Kitchen', 'Balcony', 'Bathroom', 'Other'],
  designer: ['Bathroom', 'Storage', 'Kitchen', 'Electrical', 'Painting', 'Other']
};

export function createDefaultData() {
  return {
    version: SCHEMA_VERSION,
    totalBudget: 0,
    readyMadeItems: [],
    designerWorkItems: [],
    categories: { ...DEFAULT_CATEGORIES },
    lastModified: new Date().toISOString()
  };
}

export function createReadyMadeItem({ name, category, estimatedCost, notes = '', link = '', priority = 'medium' }) {
  return {
    id: 'rm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    name,
    category,
    status: 'needed',
    estimatedCost: Number(estimatedCost) || 0,
    actualCost: null,
    notes,
    link,
    priority,
    dateAdded: new Date().toISOString().split('T')[0],
    dateFinalized: null,
    dateBought: null
  };
}

export function createDesignerWorkItem({ name, category, notes = '', priority = 'medium' }) {
  return {
    id: 'dw_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    name,
    category,
    status: 'quoting',
    quotations: [],
    acceptedQuotationId: null,
    paymentStatus: 'pending',
    amountPaid: 0,
    notes,
    priority,
    dateAdded: new Date().toISOString().split('T')[0],
    dateCompleted: null
  };
}

export function createQuotation({ vendorName, amount, notes = '' }) {
  return {
    id: 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    vendorName,
    amount: Number(amount) || 0,
    notes,
    dateReceived: new Date().toISOString().split('T')[0],
    isAccepted: false
  };
}
