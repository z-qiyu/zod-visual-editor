<script lang="ts">
  import { ZodVisualEditor, type RootSchema, createRootSchema, generateTypeScriptCode } from '$lib/index.js';

  let schema = $state<RootSchema>(createRootSchema());

  function handleSchemaChange(newSchema: RootSchema) {
    schema = newSchema;
    console.log('Schema changed:', JSON.stringify(schema, null, 2));
  }

  // Example: Load a sample schema
  function loadSampleSchema() {
    schema = {
      type: 'object',
      id: 'root',
      fields: [
        {
          id: 'field_1',
          name: 'name',
          type: 'string',
          required: true,
          isArray: false,
        },
        {
          id: 'field_2',
          name: 'age',
          type: 'number',
          required: false,
          isArray: false,
        },
        {
          id: 'field_3',
          name: 'tags',
          type: 'string',
          required: false,
          isArray: true,
        },
        {
          id: 'field_4',
          name: 'address',
          type: 'object',
          required: false,
          isArray: false,
          fields: [
            {
              id: 'field_4_1',
              name: 'street',
              type: 'string',
              required: true,
              isArray: false,
            },
            {
              id: 'field_4_2',
              name: 'city',
              type: 'string',
              required: true,
              isArray: false,
            },
          ],
        },
        {
          id: 'field_5',
          name: 'status',
          type: 'union',
          required: true,
          isArray: false,
          options: [
            {
              id: 'field_5_1',
              name: 'active',
              type: 'literal',
              required: true,
              isArray: false,
              literalValue: 'active',
            },
            {
              id: 'field_5_2',
              name: 'inactive',
              type: 'literal',
              required: true,
              isArray: false,
              literalValue: 'inactive',
            },
          ],
        },
      ],
    };
  }
</script>

<div class="min-h-screen bg-background p-8">
  <div class="max-w-6xl mx-auto">
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-2">Zod Visual Editor</h1>
      <p class="text-muted-foreground mb-4">
        A visual editor for building Zod schemas with drag-and-drop support.
      </p>
      <button
        class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        onclick={loadSampleSchema}
      >
        Load Sample Schema
      </button>
    </div>

    <ZodVisualEditor
      bind:schema
      onSchemaChange={handleSchemaChange}
      height="500px"
    />

    <div class="mt-6">
      <h2 class="text-xl font-semibold mb-2">Schema JSON</h2>
      <pre class="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-64">{JSON.stringify(schema, null, 2)}</pre>
    </div>
  </div>
</div>
