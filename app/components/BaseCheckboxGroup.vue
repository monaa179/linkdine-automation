<template>
  <div class="checkbox-group">
    <label v-if="label" class="group-label">{{ label }}</label>
    <div class="options-grid">
      <BaseCheckbox
        v-for="option in options"
        :key="option.value"
        :label="option.label"
        :model-value="modelValue.includes(option.value)"
        @update:model-value="toggleOption(option.value)"
        class="option-item"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseCheckbox from './BaseCheckbox.vue'

const props = defineProps({
  modelValue: {
    type: Array as () => string[],
    default: () => []
  },
  options: {
    type: Array as () => { label: string; value: string }[],
    required: true
  },
  label: String
})

const emit = defineEmits(['update:modelValue'])

const toggleOption = (value: string) => {
  const newValue = [...props.modelValue]
  const index = newValue.indexOf(value)
  if (index === -1) {
    newValue.push(value)
  } else {
    newValue.splice(index, 1)
  }
  emit('update:modelValue', newValue)
}
</script>

<style scoped>
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.group-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-glass);
  border-radius: 0.75rem;
}

.option-item {
  padding: 0.25rem 0;
}
</style>
