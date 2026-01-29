<script lang="ts">
  import { Plus, Code, FileCode } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Popover from '$lib/components/ui/popover';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import SchemaItem from './schema-item.svelte';
  import {
    type SchemaItem as SchemaItemType,
    type SchemaType,
    type RootSchema,
    type EditorLabels,
    createDefaultItem,
    createRootSchema,
    cloneItem,
    defaultLabels,
  } from '$lib/types.js';
  import { generateTypeScriptCode } from '$lib/generator.js';

  interface Props {
    schema?: RootSchema;
    labels?: EditorLabels;
    onSchemaChange?: (schema: RootSchema) => void;
    height?: string;
  }

  let { schema = $bindable(createRootSchema()), labels = defaultLabels, onSchemaChange, height = '600px' }: Props = $props();

  let addMenuOpen = $state(false);
  let showCode = $state(false);

  let typeOptions = $derived<{ value: SchemaType; label: string }[]>([
    { value: 'string', label: labels.string },
    { value: 'number', label: labels.number },
    { value: 'boolean', label: labels.boolean },
    { value: 'datetime', label: labels.datetime },
    { value: 'literal', label: labels.literal },
    { value: 'object', label: labels.object },
    { value: 'union', label: labels.union },
  ]);

  function notifyChange() {
    onSchemaChange?.(schema);
  }

  function addField(type: SchemaType) {
    const newItem = createDefaultItem(type, `field_${schema.fields.length + 1}`);
    schema = { ...schema, fields: [...schema.fields, newItem] };
    addMenuOpen = false;
    notifyChange();
  }

  function updateField(index: number, updated: SchemaItemType) {
    const newFields = [...schema.fields];
    newFields[index] = updated;
    schema = { ...schema, fields: newFields };
    notifyChange();
  }

  function deleteField(index: number) {
    const newFields = schema.fields.filter((_, i) => i !== index);
    schema = { ...schema, fields: newFields };
    notifyChange();
  }

  function duplicateField(index: number) {
    const cloned = cloneItem(schema.fields[index]);
    cloned.name = `${cloned.name}_copy`;
    const newFields = [...schema.fields];
    newFields.splice(index + 1, 0, cloned);
    schema = { ...schema, fields: newFields };
    notifyChange();
  }

  function moveFieldUp(index: number) {
    if (index <= 0) return;
    const newFields = [...schema.fields];
    [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    schema = { ...schema, fields: newFields };
    notifyChange();
  }

  function moveFieldDown(index: number) {
    if (index >= schema.fields.length - 1) return;
    const newFields = [...schema.fields];
    [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    schema = { ...schema, fields: newFields };
    notifyChange();
  }

  let generatedCode = $derived(generateTypeScriptCode(schema));
</script>

<Card.Root class="w-full">
  <Card.Header class="pb-3">
    <div class="flex items-center justify-between">
      <Card.Title class="text-lg">{labels.schemaEditor}</Card.Title>
      <div class="flex items-center gap-2">
        <Button
          size="sm"
          variant={showCode ? 'default' : 'outline'}
          onclick={() => showCode = !showCode}
        >
          <Code class="size-4 mr-1" />
          {showCode ? labels.hideCode : labels.showCode}
        </Button>
        <Popover.Root bind:open={addMenuOpen}>
          <Popover.Trigger>
            <Button size="sm">
              <Plus class="size-4 mr-1" />
              {labels.addField}
            </Button>
          </Popover.Trigger>
          <Popover.Content class="w-40 p-1" align="end">
            {#each typeOptions as opt}
              <button
                class="w-full px-2 py-1.5 text-left text-sm hover:bg-muted rounded"
                onclick={() => addField(opt.value)}
              >
                {opt.label}
              </button>
            {/each}
          </Popover.Content>
        </Popover.Root>
      </div>
    </div>
  </Card.Header>
  
  <Card.Content>
    <div class="flex gap-4" style="height: {height}">
      <div class="flex-1 min-w-0">
        <ScrollArea class="h-full pr-4">
          {#if schema.fields.length > 0}
            <div class="space-y-2">
              {#each schema.fields as field, index (field.id)}
                <SchemaItem
                  item={field}
                  root={schema}
                  {labels}
                  isFirst={index === 0}
                  isLast={index === schema.fields.length - 1}
                  onUpdate={(updated: SchemaItemType) => updateField(index, updated)}
                  onDelete={() => deleteField(index)}
                  onDuplicate={() => duplicateField(index)}
                  onMoveUp={() => moveFieldUp(index)}
                  onMoveDown={() => moveFieldDown(index)}
                />
              {/each}
            </div>
          {:else}
            <div class="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <FileCode class="size-12 mb-4 opacity-50" />
              <p class="text-sm">{labels.noFieldsTitle}</p>
              <p class="text-xs mt-1">{labels.noFieldsDescription}</p>
            </div>
          {/if}
        </ScrollArea>
      </div>
      
      {#if showCode}
        <div class="w-[400px] border-l pl-4">
          <div class="text-sm font-medium mb-2">Generated Code</div>
          <ScrollArea class="h-full">
            <pre class="text-xs bg-muted p-3 rounded-lg overflow-x-auto"><code>{generatedCode}</code></pre>
          </ScrollArea>
        </div>
      {/if}
    </div>
  </Card.Content>
</Card.Root>
