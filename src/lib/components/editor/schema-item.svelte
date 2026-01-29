<script lang="ts">
  import { ChevronDown, ChevronRight, Plus, Trash2, Copy, ArrowUp, ArrowDown } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Switch } from '$lib/components/ui/switch';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import * as Popover from '$lib/components/ui/popover';
  import Self from './schema-item.svelte';
  import {
    type SchemaItem,
    type SchemaType,
    type RootSchema,
    type EditorLabels,
    isContainerType,
    createDefaultItem,
    getRefTargets,
    cloneItem,
    defaultLabels,
  } from '$lib/types.js';

  interface Props {
    item: SchemaItem;
    root: RootSchema;
    labels?: EditorLabels;
    depth?: number;
    isFirst?: boolean;
    isLast?: boolean;
    onUpdate: (item: SchemaItem) => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
  }

  let { 
    item, 
    root, 
    labels = defaultLabels, 
    depth = 0, 
    isFirst = false,
    isLast = false,
    onUpdate, 
    onDelete, 
    onDuplicate,
    onMoveUp,
    onMoveDown,
  }: Props = $props();

  let expanded = $state(true);
  let addMenuOpen = $state(false);

  let typeOptions = $derived<{ value: SchemaType; label: string }[]>([
    { value: 'string', label: labels.string },
    { value: 'number', label: labels.number },
    { value: 'boolean', label: labels.boolean },
    { value: 'datetime', label: labels.datetime },
    { value: 'literal', label: labels.literal },
    { value: 'object', label: labels.object },
    { value: 'union', label: labels.union },
  ]);

  function handleTypeChange(newType: SchemaType) {
    const updated = { ...item, type: newType };
    
    delete updated.fields;
    delete updated.options;
    delete updated.literalValue;
    delete updated.lazy;
    
    if (newType === 'object') {
      updated.fields = [];
    } else if (newType === 'union') {
      updated.options = [];
    } else if (newType === 'literal') {
      updated.literalValue = '';
    }
    
    onUpdate(updated);
  }

  function handleNameChange(e: Event) {
    const target = e.target as HTMLInputElement;
    onUpdate({ ...item, name: target.value });
  }

  function handleDescriptionChange(e: Event) {
    const target = e.target as HTMLInputElement;
    onUpdate({ ...item, description: target.value });
  }

  function handleRequiredChange(checked: boolean) {
    onUpdate({ ...item, required: checked });
  }

  function handleArrayChange(checked: boolean) {
    onUpdate({ ...item, isArray: checked });
  }

  function handleLazyChange(checked: boolean) {
    if (checked) {
      const targets = getRefTargets(root);
      onUpdate({ ...item, lazy: { refId: targets[0]?.id || '' } });
    } else {
      const updated = { ...item };
      delete updated.lazy;
      onUpdate(updated);
    }
  }

  function handleLazyRefChange(refId: string) {
    onUpdate({ ...item, lazy: { refId } });
  }

  function handleLiteralValueChange(e: Event) {
    const target = e.target as HTMLInputElement;
    onUpdate({ ...item, literalValue: target.value });
  }

  function addChild(type: SchemaType) {
    const newItem = createDefaultItem(type, `field_${(item.fields?.length || item.options?.length || 0) + 1}`);
    
    if (item.type === 'object' && item.fields) {
      onUpdate({ ...item, fields: [...item.fields, newItem] });
    } else if (item.type === 'union' && item.options) {
      onUpdate({ ...item, options: [...item.options, newItem] });
    }
    
    addMenuOpen = false;
  }

  function updateChild(index: number, updated: SchemaItem) {
    if (item.type === 'object' && item.fields) {
      const newFields = [...item.fields];
      newFields[index] = updated;
      onUpdate({ ...item, fields: newFields });
    } else if (item.type === 'union' && item.options) {
      const newOptions = [...item.options];
      newOptions[index] = updated;
      onUpdate({ ...item, options: newOptions });
    }
  }

  function deleteChild(index: number) {
    if (item.type === 'object' && item.fields) {
      const newFields = item.fields.filter((_, i) => i !== index);
      onUpdate({ ...item, fields: newFields });
    } else if (item.type === 'union' && item.options) {
      const newOptions = item.options.filter((_, i) => i !== index);
      onUpdate({ ...item, options: newOptions });
    }
  }

  function duplicateChild(index: number) {
    if (item.type === 'object' && item.fields) {
      const cloned = cloneItem(item.fields[index]);
      cloned.name = `${cloned.name}_copy`;
      const newFields = [...item.fields];
      newFields.splice(index + 1, 0, cloned);
      onUpdate({ ...item, fields: newFields });
    } else if (item.type === 'union' && item.options) {
      const cloned = cloneItem(item.options[index]);
      const newOptions = [...item.options];
      newOptions.splice(index + 1, 0, cloned);
      onUpdate({ ...item, options: newOptions });
    }
  }

  function moveChildUp(index: number) {
    if (index <= 0) return;
    if (item.type === 'object' && item.fields) {
      const newFields = [...item.fields];
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
      onUpdate({ ...item, fields: newFields });
    } else if (item.type === 'union' && item.options) {
      const newOptions = [...item.options];
      [newOptions[index - 1], newOptions[index]] = [newOptions[index], newOptions[index - 1]];
      onUpdate({ ...item, options: newOptions });
    }
  }

  function moveChildDown(index: number) {
    const children = item.type === 'object' ? item.fields : item.options;
    if (!children || index >= children.length - 1) return;
    
    if (item.type === 'object' && item.fields) {
      const newFields = [...item.fields];
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
      onUpdate({ ...item, fields: newFields });
    } else if (item.type === 'union' && item.options) {
      const newOptions = [...item.options];
      [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
      onUpdate({ ...item, options: newOptions });
    }
  }

  let children = $derived(item.type === 'object' ? (item.fields || []) : item.type === 'union' ? (item.options || []) : []);
  let refTargets = $derived(getRefTargets(root));
  let typeLabel = $derived(typeOptions.find(t => t.value === item.type)?.label || item.type);
</script>

<div class="border rounded-lg bg-card">
  <div class="flex items-center gap-2 p-2 bg-muted/30">
    <!-- Move buttons -->
    <div class="flex flex-col gap-0.5">
      <Button 
        size="sm" 
        variant="ghost" 
        class="h-4 w-6 p-0" 
        onclick={onMoveUp}
        disabled={isFirst}
      >
        <ArrowUp class="size-3" />
      </Button>
      <Button 
        size="sm" 
        variant="ghost" 
        class="h-4 w-6 p-0" 
        onclick={onMoveDown}
        disabled={isLast}
      >
        <ArrowDown class="size-3" />
      </Button>
    </div>
    
    {#if isContainerType(item)}
      <button
        class="p-0.5 hover:bg-muted rounded"
        onclick={() => expanded = !expanded}
      >
        {#if expanded}
          <ChevronDown class="size-4" />
        {:else}
          <ChevronRight class="size-4" />
        {/if}
      </button>
    {:else}
      <div class="w-5"></div>
    {/if}

    <Input
      value={item.name}
      oninput={handleNameChange}
      placeholder={labels.fieldName}
      class="h-7 w-28 text-sm"
    />

    <Select.Root type="single" value={item.type} onValueChange={(v: string) => handleTypeChange(v as SchemaType)}>
      <Select.Trigger class="h-7 w-24 text-xs">
        {typeLabel}
      </Select.Trigger>
      <Select.Content>
        {#each typeOptions as opt}
          <Select.Item value={opt.value}>{opt.label}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>

    <div class="flex items-center gap-1">
      <Switch
        checked={item.required}
        onCheckedChange={handleRequiredChange}
        class="scale-75"
      />
      <span class="text-xs text-muted-foreground">{labels.required}</span>
    </div>

    <div class="flex items-center gap-1">
      <Switch
        checked={item.isArray}
        onCheckedChange={handleArrayChange}
        class="scale-75"
      />
      <span class="text-xs text-muted-foreground">{labels.array}</span>
    </div>

    {#if !isContainerType(item)}
      <div class="flex items-center gap-1">
        <Switch
          checked={!!item.lazy}
          onCheckedChange={handleLazyChange}
          class="scale-75"
        />
        <span class="text-xs text-muted-foreground">{labels.reference}</span>
      </div>
    {/if}

    <div class="flex-1"></div>

    {#if isContainerType(item)}
      <Popover.Root bind:open={addMenuOpen}>
        <Popover.Trigger>
          <Button size="sm" variant="ghost" class="h-7 w-7 p-0">
            <Plus class="size-4" />
          </Button>
        </Popover.Trigger>
        <Popover.Content class="w-40 p-1" align="end">
          {#each typeOptions as opt}
            <button
              class="w-full px-2 py-1 text-left text-sm hover:bg-muted rounded"
              onclick={() => addChild(opt.value)}
            >
              {opt.label}
            </button>
          {/each}
        </Popover.Content>
      </Popover.Root>
    {/if}

    <Button size="sm" variant="ghost" class="h-7 w-7 p-0" onclick={onDuplicate}>
      <Copy class="size-4" />
    </Button>

    <Button size="sm" variant="ghost" class="h-7 w-7 p-0 text-destructive" onclick={onDelete}>
      <Trash2 class="size-4" />
    </Button>
  </div>

  <!-- Description row -->
  <div class="px-2 py-1.5 border-t flex items-center gap-2">
    <Label class="text-xs text-muted-foreground shrink-0">{labels.description}:</Label>
    <Input
      value={item.description || ''}
      oninput={handleDescriptionChange}
      placeholder={labels.descriptionPlaceholder}
      class="h-6 text-xs flex-1"
    />
  </div>

  {#if item.type === 'literal'}
    <div class="p-2 border-t">
      <div class="flex items-center gap-2">
        <Label class="text-xs">{labels.literalValue}:</Label>
        <Input
          value={item.literalValue?.toString() || ''}
          oninput={handleLiteralValueChange}
          placeholder={labels.literalValuePlaceholder}
          class="h-7 flex-1 text-sm"
        />
      </div>
    </div>
  {/if}

  {#if item.lazy}
    <div class="p-2 border-t">
      <div class="flex items-center gap-2">
        <Label class="text-xs">{labels.reference}:</Label>
        <Select.Root type="single" value={item.lazy.refId} onValueChange={handleLazyRefChange}>
          <Select.Trigger class="h-7 flex-1 text-xs">
            {refTargets.find(t => t.id === item.lazy?.refId)?.name || labels.selectReference}
          </Select.Trigger>
          <Select.Content>
            {#each refTargets as target}
              <Select.Item value={target.id}>{target.name} ({typeOptions.find(t => t.value === target.type)?.label})</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
    </div>
  {/if}

  {#if isContainerType(item) && expanded}
    <div class="p-2 border-t space-y-2">
      {#if children.length > 0}
        {#each children as child, index (child.id)}
          <Self
            item={child}
            {root}
            {labels}
            depth={depth + 1}
            isFirst={index === 0}
            isLast={index === children.length - 1}
            onUpdate={(updated: SchemaItem) => updateChild(index, updated)}
            onDelete={() => deleteChild(index)}
            onDuplicate={() => duplicateChild(index)}
            onMoveUp={() => moveChildUp(index)}
            onMoveDown={() => moveChildDown(index)}
          />
        {/each}
      {:else}
        <div class="py-4 text-center text-sm text-muted-foreground border-2 border-dashed border-muted rounded-lg">
          {item.type === 'object' ? labels.objectEmptyHint : labels.unionEmptyHint}
        </div>
      {/if}
    </div>
  {/if}
</div>
