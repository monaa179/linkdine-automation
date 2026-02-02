<template>
  <div class="base-input-container">
    <label v-if="label" :for="id" class="label">{{ label }}</label>
    <div class="input-wrapper" :class="{ focused, error: !!error }">
      <component
        :is="icon"
        v-if="icon"
        class="icon"
        :size="18"
      />
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        class="input"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @focus="focused = true"
        @blur="focused = false"
      />
    </div>
    <span v-if="error" class="error-message">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps({
  modelValue: [String, Number],
  label: String,
  placeholder: String,
  type: {
    type: String,
    default: 'text'
  },
  id: String,
  error: String,
  icon: [Object, Function],
  required: Boolean,
  disabled: Boolean
})

defineEmits(['update:modelValue'])

const focused = ref(false)
</script>

<style scoped>
.base-input-container {
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

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  transition: all var(--transition-fast);
}

.input-wrapper.focused {
  border-color: var(--accent-primary);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.input-wrapper.error {
  border-color: var(--error);
}

.input {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 1rem;
  width: 100%;
  outline: none;
}

.input::placeholder {
  color: var(--text-secondary);
  opacity: 0.5;
}

.icon {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.error-message {
  font-size: 0.75rem;
  color: var(--error);
}
</style>
