<template>
  <div class="base-select-container">
    <label v-if="label" class="label">{{ label }}</label>
    <div class="select-wrapper" :class="{ focused, error: !!error }">
      <select
        :value="modelValue"
        :required="required"
        :disabled="disabled"
        class="select"
        @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
        @focus="focused = true"
        @blur="focused = false"
      >
        <option v-for="option in options" :key="typeof option === 'string' ? option : option.value" :value="typeof option === 'string' ? option : option.value">
          {{ typeof option === 'string' ? option : option.label }}
        </option>
      </select>
      <ChevronDown class="chevron" :size="18" />
    </div>
    <span v-if="error" class="error-message">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

defineProps({
  modelValue: [String, Number],
  label: String,
  options: {
    type: Array as () => (string | { label: string; value: any })[],
    required: true
  },
  error: String,
  required: Boolean,
  disabled: Boolean
})

defineEmits(['update:modelValue'])

const focused = ref(false)
</script>

<style scoped>
.base-select-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.select-wrapper {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  border-radius: 0.75rem;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
}

.select-wrapper.focused {
  border-color: var(--accent-primary);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.select-wrapper.error {
  border-color: var(--error);
}

.select {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 1rem;
  width: 100%;
  outline: none;
  padding: 0.75rem 1rem;
  cursor: pointer;
  appearance: none;
}

.select option {
  background: #1e293b;
  color: white;
}

.chevron {
  position: absolute;
  right: 1rem;
  pointer-events: none;
  color: var(--text-secondary);
}

.error-message {
  font-size: 0.75rem;
  color: var(--error);
}
</style>
