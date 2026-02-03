<template>
  <div class="base-textarea-container">
    <label v-if="label" class="label">{{ label }}</label>
    <div class="textarea-wrapper" :class="{ focused, error: !!error }">
      <textarea
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :rows="rows"
        class="textarea"
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        @focus="focused = true"
        @blur="focused = false"
      ></textarea>
    </div>
    <span v-if="error" class="error-message">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps({
  modelValue: String,
  label: String,
  placeholder: String,
  error: String,
  required: Boolean,
  disabled: Boolean,
  rows: {
    type: Number,
    default: 4
  }
})

defineEmits(['update:modelValue'])

const focused = ref(false)
</script>

<style scoped>
.base-textarea-container {
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

.textarea-wrapper {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  border-radius: 0.75rem;
  transition: all var(--transition-fast);
  width: 100%;
}

.textarea-wrapper.focused {
  border-color: var(--accent-primary);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.textarea-wrapper.error {
  border-color: var(--error);
}

.textarea {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 1rem;
  width: 100%;
  outline: none;
  padding: 0.75rem 1rem;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
}

.textarea::placeholder {
  color: var(--text-secondary);
  opacity: 0.5;
}

.error-message {
  font-size: 0.75rem;
  color: var(--error);
}
</style>
