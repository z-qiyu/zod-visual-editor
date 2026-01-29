import { z } from 'zod';
import type { SchemaItem, RootSchema } from './types.js';
import { generateId } from './types.js';

// Internal type for accessing Zod's internal structure
interface ZodInternalDef {
  typeName?: string;
  innerType?: z.ZodTypeAny;
  type?: z.ZodTypeAny;
  value?: string | number | boolean;
  shape?: Record<string, z.ZodTypeAny>;
  options?: z.ZodTypeAny[];
  defaultValue?: () => unknown;
}

interface ZodInternal {
  _zod?: {
    def?: ZodInternalDef;
  };
}

function getZodDef(schema: z.ZodTypeAny): ZodInternalDef | undefined {
  return (schema as unknown as ZodInternal)._zod?.def;
}

/**
 * Parse a Zod schema into the visual editor IR format.
 * Note: This is a best-effort parser and may not handle all Zod schema types.
 * Works with Zod v4.
 */
export function parseZodSchema(schema: z.ZodTypeAny, name: string = ''): SchemaItem | null {
  const item: SchemaItem = {
    id: generateId(),
    name,
    type: 'string',
    required: true,
    isArray: false,
  };

  const zodDef = getZodDef(schema);
  
  if (!zodDef) {
    // Try to infer type from schema behavior
    try {
      schema.parse('test');
      item.type = 'string';
    } catch {
      try {
        schema.parse(123);
        item.type = 'number';
      } catch {
        try {
          schema.parse(true);
          item.type = 'boolean';
        } catch {
          // Default to string
        }
      }
    }
    return item;
  }

  const typeName = zodDef.typeName;

  // Handle optional
  if (typeName === 'ZodOptional') {
    const innerType = zodDef.innerType;
    if (innerType) {
      const inner = parseZodSchema(innerType, name);
      if (inner) {
        return { ...inner, required: false };
      }
    }
    item.required = false;
    return item;
  }

  // Handle array
  if (typeName === 'ZodArray') {
    const elementType = zodDef.type;
    if (elementType) {
      const inner = parseZodSchema(elementType, name);
      if (inner) {
        return { ...inner, isArray: true };
      }
    }
    item.isArray = true;
    return item;
  }

  // Handle default
  if (typeName === 'ZodDefault') {
    const innerType = zodDef.innerType;
    const defaultValue = zodDef.defaultValue;
    if (innerType) {
      const inner = parseZodSchema(innerType, name);
      if (inner) {
        return { ...inner, default: defaultValue?.() };
      }
    }
    return item;
  }

  // Handle basic types
  switch (typeName) {
    case 'ZodString':
      item.type = 'string';
      break;
    case 'ZodNumber':
      item.type = 'number';
      break;
    case 'ZodBoolean':
      item.type = 'boolean';
      break;
    case 'ZodLiteral':
      item.type = 'literal';
      item.literalValue = zodDef.value;
      break;
    case 'ZodObject':
      item.type = 'object';
      item.fields = [];
      const shape = zodDef.shape;
      if (shape) {
        for (const [key, value] of Object.entries(shape)) {
          const field = parseZodSchema(value, key);
          if (field) {
            item.fields.push(field);
          }
        }
      }
      break;
    case 'ZodUnion':
      item.type = 'union';
      item.options = [];
      const options = zodDef.options;
      if (options) {
        for (let i = 0; i < options.length; i++) {
          const option = parseZodSchema(options[i], `option_${i + 1}`);
          if (option) {
            item.options.push(option);
          }
        }
      }
      break;
    default:
      // Unknown type, default to string
      item.type = 'string';
  }

  return item;
}

/**
 * Parse a Zod object schema into a RootSchema
 */
export function parseZodObjectToRoot(schema: z.ZodObject<z.ZodRawShape>): RootSchema {
  const root: RootSchema = {
    type: 'object',
    id: 'root',
    fields: [],
  };

  const zodDef = getZodDef(schema);
  
  if (zodDef) {
    const shape = zodDef.shape;
    if (shape) {
      for (const [key, value] of Object.entries(shape)) {
        const field = parseZodSchema(value, key);
        if (field) {
          root.fields.push(field);
        }
      }
    }
  }

  return root;
}
