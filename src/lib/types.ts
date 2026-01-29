// Schema Item Types
export type SchemaType = 'string' | 'number' | 'boolean' | 'datetime' | 'literal' | 'object' | 'union';

// i18n Labels interface for customization
export interface EditorLabels {
  // Type labels
  string: string;
  number: string;
  boolean: string;
  datetime: string;
  literal: string;
  object: string;
  union: string;
  // UI labels
  required: string;
  array: string;
  reference: string;
  description: string;
  descriptionPlaceholder: string;
  literalValue: string;
  literalValuePlaceholder: string;
  selectReference: string;
  fieldName: string;
  addField: string;
  showCode: string;
  hideCode: string;
  schemaEditor: string;
  noFieldsTitle: string;
  noFieldsDescription: string;
  objectEmptyHint: string;
  unionEmptyHint: string;
}

// Default English labels
export const defaultLabels: EditorLabels = {
  string: 'String',
  number: 'Number',
  boolean: 'Boolean',
  datetime: 'DateTime',
  literal: 'Literal',
  object: 'Object',
  union: 'Union',
  required: 'Required',
  array: 'Array',
  reference: 'Ref',
  description: 'Description',
  descriptionPlaceholder: 'Field description (for AI understanding)',
  literalValue: 'Literal Value',
  literalValuePlaceholder: 'Enter literal value',
  selectReference: 'Select reference',
  fieldName: 'Field name',
  addField: 'Add Field',
  showCode: 'Show Code',
  hideCode: 'Hide Code',
  schemaEditor: 'Schema Editor',
  noFieldsTitle: 'No fields defined yet.',
  noFieldsDescription: 'Click "Add Field" to start building your schema.',
  objectEmptyHint: 'No fields, click + to add',
  unionEmptyHint: 'No options, click + to add (min 2)',
};

export interface SchemaItem {
  id: string;
  name: string;
  type: SchemaType;
  required: boolean;
  isArray: boolean;
  description?: string;
  default?: unknown;
  // only when type === 'object'
  fields?: SchemaItem[];
  // only when type === 'union'
  options?: SchemaItem[];
  // optional lazy reference
  lazy?: {
    refId: string;
  };
  // for literal type
  literalValue?: string | number | boolean;
}

export interface RootSchema {
  type: 'object';
  id: 'root';
  fields: SchemaItem[];
}

// Type guards
export function isObjectType(item: SchemaItem): boolean {
  return item.type === 'object';
}

export function isUnionType(item: SchemaItem): boolean {
  return item.type === 'union';
}

export function isContainerType(item: SchemaItem): boolean {
  return item.type === 'object' || item.type === 'union';
}

export function isLeafType(item: SchemaItem): boolean {
  return !isContainerType(item);
}

// Counter for unique IDs - use crypto.randomUUID for truly unique IDs
export function generateId(): string {
  // Use crypto.randomUUID if available, otherwise fallback to timestamp + random
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `item_${crypto.randomUUID()}`;
  }
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return `item_${timestamp}_${random}`;
}

export function createDefaultItem(type: SchemaType, name: string = ''): SchemaItem {
  const base: SchemaItem = {
    id: generateId(),
    name,
    type,
    required: true,
    isArray: false,
    description: '',
  };

  if (type === 'object') {
    base.fields = [];
  } else if (type === 'union') {
    base.options = [];
  } else if (type === 'literal') {
    base.literalValue = '';
  }

  return base;
}

export function createRootSchema(): RootSchema {
  return {
    type: 'object',
    id: 'root',
    fields: [],
  };
}

// Find item by id in schema tree
export function findItemById(schema: RootSchema | SchemaItem, id: string): SchemaItem | null {
  if ('id' in schema && schema.id === id && schema.id !== 'root') {
    return schema as SchemaItem;
  }

  if ('fields' in schema && schema.fields) {
    for (const field of schema.fields) {
      const found = findItemById(field, id);
      if (found) return found;
    }
  }

  if ('options' in schema && schema.options) {
    for (const option of schema.options) {
      const found = findItemById(option, id);
      if (found) return found;
    }
  }

  return null;
}

// Get all object/union items for lazy reference selection
export function getRefTargets(schema: RootSchema): SchemaItem[] {
  const targets: SchemaItem[] = [];

  function traverse(item: SchemaItem) {
    if (item.type === 'object' || item.type === 'union') {
      targets.push(item);
    }
    if (item.fields) {
      item.fields.forEach(traverse);
    }
    if (item.options) {
      item.options.forEach(traverse);
    }
  }

  schema.fields.forEach(traverse);
  return targets;
}

// Clone item with new ids
export function cloneItem(item: SchemaItem): SchemaItem {
  const cloned: SchemaItem = {
    ...item,
    id: generateId(),
  };

  if (item.fields) {
    cloned.fields = item.fields.map(cloneItem);
  }
  if (item.options) {
    cloned.options = item.options.map(cloneItem);
  }

  return cloned;
}
