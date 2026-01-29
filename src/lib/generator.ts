import { z } from 'zod';
import type { SchemaItem, RootSchema } from './types.js';

// Registry for lazy references
const registry = new Map<string, z.ZodTypeAny>();

function generateItemSchema(item: SchemaItem): z.ZodTypeAny {
  // Handle lazy reference
  if (item.lazy) {
    return z.lazy(() => registry.get(item.lazy!.refId) ?? z.unknown());
  }

  let schema: z.ZodTypeAny;

  switch (item.type) {
    case 'string':
      schema = item.description ? z.string().describe(item.description) : z.string();
      break;
    case 'number':
      schema = item.description ? z.number().describe(item.description) : z.number();
      break;
    case 'boolean':
      schema = item.description ? z.boolean().describe(item.description) : z.boolean();
      break;
    case 'datetime':
      schema = item.description ? z.iso.datetime().describe(item.description) : z.iso.datetime();
      break;
    case 'literal':
      if (typeof item.literalValue === 'string') {
        schema = z.literal(item.literalValue);
      } else if (typeof item.literalValue === 'number') {
        schema = z.literal(item.literalValue);
      } else if (typeof item.literalValue === 'boolean') {
        schema = z.literal(item.literalValue);
      } else {
        schema = z.literal('');
      }
      if (item.description) {
        schema = schema.describe(item.description);
      }
      break;
    case 'object':
      const shape: Record<string, z.ZodTypeAny> = {};
      if (item.fields) {
        for (const field of item.fields) {
          let fieldSchema = generateItemSchema(field);
          
          // Handle array
          if (field.isArray) {
            fieldSchema = z.array(fieldSchema);
          }
          
          // Handle optional
          if (!field.required) {
            fieldSchema = fieldSchema.optional();
          }
          
          // Handle default
          if (field.default !== undefined) {
            fieldSchema = fieldSchema.default(field.default);
          }
          
          shape[field.name] = fieldSchema;
        }
      }
      schema = z.object(shape);
      if (item.description) {
        schema = schema.describe(item.description);
      }
      break;
    case 'union':
      if (item.options && item.options.length >= 2) {
        const unionSchemas = item.options.map(opt => {
          let optSchema = generateItemSchema(opt);
          if (opt.isArray) {
            optSchema = z.array(optSchema);
          }
          return optSchema;
        });
        schema = z.union(unionSchemas as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]);
      } else {
        schema = z.unknown();
      }
      if (item.description) {
        schema = schema.describe(item.description);
      }
      break;
    default:
      schema = z.unknown();
  }

  // Register for lazy references
  registry.set(item.id, schema);

  return schema;
}

export function generateSchema(root: RootSchema): z.ZodObject<Record<string, z.ZodTypeAny>> {
  registry.clear();
  
  const shape: Record<string, z.ZodTypeAny> = {};
  
  for (const field of root.fields) {
    let fieldSchema = generateItemSchema(field);
    
    // Handle array
    if (field.isArray) {
      fieldSchema = z.array(fieldSchema);
    }
    
    // Handle optional
    if (!field.required) {
      fieldSchema = fieldSchema.optional();
    }
    
    // Handle default
    if (field.default !== undefined) {
      fieldSchema = fieldSchema.default(field.default);
    }
    
    shape[field.name] = fieldSchema;
  }
  
  return z.object(shape);
}

// Generate TypeScript code representation
export function generateTypeScriptCode(root: RootSchema): string {
  const lines: string[] = ['import { z } from "zod";', '', 'export const schema = z.object({'];
  
  function generateFieldCode(item: SchemaItem, indent: number): string {
    const pad = '  '.repeat(indent);
    let code = '';
    
    if (item.lazy) {
      code = `z.lazy(() => ${item.lazy.refId})`;
    } else {
      switch (item.type) {
        case 'string':
          code = 'z.string()';
          break;
        case 'number':
          code = 'z.number()';
          break;
        case 'boolean':
          code = 'z.boolean()';
          break;
        case 'datetime':
          code = 'z.iso.datetime()';
          break;
        case 'literal':
          if (typeof item.literalValue === 'string') {
            code = `z.literal("${item.literalValue}")`;
          } else {
            code = `z.literal(${item.literalValue})`;
          }
          break;
        case 'object':
          if (item.fields && item.fields.length > 0) {
            const fieldCodes = item.fields.map(f => {
              const fieldCode = generateFieldCode(f, indent + 1);
              let result = fieldCode;
              if (f.description) result = `${result}.describe("${f.description}")`;
              if (f.isArray) result = `z.array(${result})`;
              if (!f.required) result = `${result}.optional()`;
              if (f.default !== undefined) result = `${result}.default(${JSON.stringify(f.default)})`;
              return `${pad}  ${f.name}: ${result}`;
            });
            code = `z.object({\n${fieldCodes.join(',\n')}\n${pad}})`;
          } else {
            code = 'z.object({})';
          }
          break;
        case 'union':
          if (item.options && item.options.length >= 2) {
            const optionCodes = item.options.map(o => {
              let optCode = generateFieldCode(o, indent);
              if (o.isArray) optCode = `z.array(${optCode})`;
              return optCode;
            });
            code = `z.union([${optionCodes.join(', ')}])`;
          } else {
            code = 'z.unknown()';
          }
          break;
        default:
          code = 'z.unknown()';
      }
    }
    
    // Add description
    if (item.description && item.type !== 'object') {
      code = `${code}.describe("${item.description}")`;
    }
    
    return code;
  }
  
  for (const field of root.fields) {
    let fieldCode = generateFieldCode(field, 1);
    if (field.description) fieldCode = `${fieldCode}.describe("${field.description}")`;
    if (field.isArray) fieldCode = `z.array(${fieldCode})`;
    if (!field.required) fieldCode = `${fieldCode}.optional()`;
    if (field.default !== undefined) fieldCode = `${fieldCode}.default(${JSON.stringify(field.default)})`;
    lines.push(`  ${field.name}: ${fieldCode},`);
  }
  
  lines.push('});', '', 'export type Schema = z.infer<typeof schema>;');
  
  return lines.join('\n');
}
