# zod-visual-editor

A visual editor for building [Zod](https://zod.dev) schemas in Svelte 5. Build complex validation schemas with an intuitive UI, then export to Zod code or JSON Schema.

[![npm version](https://img.shields.io/npm/v/zod-visual-editor.svg)](https://www.npmjs.com/package/zod-visual-editor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎨 **Visual Schema Builder** - Intuitive interface for building Zod schemas
- 🔄 **Real-time Code Generation** - See generated Zod/TypeScript code as you build
- 🌐 **i18n Support** - Fully customizable labels for internationalization
- 📦 **Zod v4 Compatible** - Works with the latest Zod version
- 🎯 **Type Safe** - Full TypeScript support with exported types
- ↕️ **Reorder Fields** - Move fields up/down with arrow buttons
- 🎨 **Tailwind CSS** - Styled with Tailwind CSS and shadcn-svelte components

## Installation

```bash
npm install zod-visual-editor zod
# or
pnpm add zod-visual-editor zod
# or
bun add zod-visual-editor zod
```

## Requirements

- Svelte 5
- Zod 4.x
- Tailwind CSS 4.x (for styling)

## Quick Start

```svelte
<script lang="ts">
  import { z } from 'zod';
  import { ZodVisualEditor, generateSchema, createRootSchema, type RootSchema } from 'zod-visual-editor';

  let schema = $state<RootSchema>(createRootSchema());

  function handleExport() {
    const zodSchema = generateSchema(schema);
    const jsonSchema = z.toJSONSchema(zodSchema);
    console.log(JSON.stringify(jsonSchema, null, 2));
  }
</script>

<ZodVisualEditor bind:schema height="500px" />
<button onclick={handleExport}>Export JSON Schema</button>
```

## Internationalization (i18n)

Customize all UI labels by passing a `labels` prop:

```svelte
<script lang="ts">
  import { ZodVisualEditor, type EditorLabels } from 'zod-visual-editor';

  const zhLabels: EditorLabels = {
    // Type labels
    string: '字符串',
    number: '数字',
    boolean: '布尔',
    datetime: '日期时间',
    literal: '字面量',
    object: '对象',
    union: '联合类型',
    // UI labels
    required: '必填',
    array: '数组',
    reference: '引用',
    description: '描述',
    descriptionPlaceholder: '字段描述 (用于 AI 理解)',
    literalValue: '字面量值',
    literalValuePlaceholder: '输入字面量值',
    selectReference: '选择引用',
    fieldName: '字段名',
    addField: '添加字段',
    showCode: '显示代码',
    hideCode: '隐藏代码',
    schemaEditor: 'Schema 编辑器',
    noFieldsTitle: '暂无字段',
    noFieldsDescription: '点击"添加字段"开始构建 Schema',
    objectEmptyHint: '暂无字段，点击 + 添加',
    unionEmptyHint: '暂无选项，点击 + 添加 (至少2个)',
  };
</script>

<ZodVisualEditor bind:schema labels={zhLabels} />
```

## Supported Types

| Type | Description |
|------|-------------|
| `string` | String values |
| `number` | Numeric values |
| `boolean` | True/false values |
| `datetime` | ISO datetime strings |
| `literal` | Literal/constant values |
| `object` | Nested object with fields |
| `union` | Union of multiple types |

### Type Modifiers

- **Required/Optional** - Toggle whether a field is required
- **Array** - Wrap any type in an array
- **Reference (Lazy)** - Create recursive schema references
- **Description** - Add descriptions for documentation/AI

## API Reference

### Components

#### `ZodVisualEditor`

Main editor component.

```typescript
interface Props {
  schema?: RootSchema;           // The schema to edit (bindable)
  labels?: EditorLabels;         // Custom labels for i18n
  onSchemaChange?: (schema: RootSchema) => void;  // Change callback
  height?: string;               // Editor height (default: '600px')
}
```

### Functions

#### `generateSchema(root: RootSchema): z.ZodObject`

Convert the visual schema to a Zod schema object.

```typescript
import { generateSchema } from 'zod-visual-editor';
import { z } from 'zod';

const zodSchema = generateSchema(schema);
const jsonSchema = z.toJSONSchema(zodSchema);
```

#### `generateTypeScriptCode(root: RootSchema): string`

Generate TypeScript code representation of the schema.

```typescript
import { generateTypeScriptCode } from 'zod-visual-editor';

const code = generateTypeScriptCode(schema);
// Returns: import { z } from "zod"; export const schema = z.object({...});
```

#### `createRootSchema(): RootSchema`

Create an empty root schema.

#### `createDefaultItem(type: SchemaType, name?: string): SchemaItem`

Create a new schema item with default values.

### Types

```typescript
import type { 
  SchemaItem,      // Individual field definition
  SchemaType,      // 'string' | 'number' | 'boolean' | 'datetime' | 'literal' | 'object' | 'union'
  RootSchema,      // Root schema container
  EditorLabels     // i18n labels interface
} from '@qiyu-allinai/zod-visual-editor';
```

## Schema Structure

The editor uses an intermediate representation (IR) that maps to Zod schemas:

```typescript
interface SchemaItem {
  id: string;
  name: string;
  type: SchemaType;
  required: boolean;
  isArray: boolean;
  description?: string;
  default?: unknown;
  fields?: SchemaItem[];      // For object type
  options?: SchemaItem[];     // For union type
  lazy?: { refId: string };   // For recursive references
  literalValue?: string | number | boolean;  // For literal type
}

interface RootSchema {
  type: 'object';
  id: 'root';
  fields: SchemaItem[];
}
```

## Styling

The editor uses Tailwind CSS with CSS variables for theming. Make sure your project has Tailwind CSS configured with the following CSS variables:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --destructive: 0 84.2% 60.2%;
  --border: 0 0% 89.8%;
  --ring: 0 0% 3.9%;
}
```

## License

MIT © [Zod Visual Editor Contributors](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
