// Components
export { ZodVisualEditor, SchemaItem as SchemaItemComponent } from './components/editor/index.js';

// Types
export type { SchemaItem, SchemaType, RootSchema, EditorLabels } from './types.js';
export {
  isObjectType,
  isUnionType,
  isContainerType,
  isLeafType,
  generateId,
  createDefaultItem,
  createRootSchema,
  findItemById,
  getRefTargets,
  cloneItem,
  defaultLabels,
} from './types.js';

// Generator
export { generateSchema, generateTypeScriptCode } from './generator.js';

// Parser
export { parseZodSchema, parseZodObjectToRoot } from './parser.js';
