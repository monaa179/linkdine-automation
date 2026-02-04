<template>
  <label class="base-checkbox" :class="{ disabled, checked: modelValue }">
    <div class="checkbox-wrapper">
      <input
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        class="hidden-input"
        @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
      <div class="checkbox-box">
        <Check v-if="modelValue" :size="14" stroke-width="3" />
      </div>
    </div>
    <span v-if="label" class="label-text">{{ label }}</span>
  </label>
</template>

<script setup lang="ts">
import { Check } from 'lucide-vue-next'

defineProps({
  modelValue: Boolean,
  label: String,
  disabled: Boolean
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.base-checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
  transition: all var(--transition-fast);
}

.base-checkbox.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.hidden-input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkbox-box {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 2px solid var(--border-glass);
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  color: white;
}

.base-checkbox:hover .checkbox-box {
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
}

.base-checkbox.checked .checkbox-box {
  background: var(--accent-gradient);
  border-color: transparent;
}

.label-text {
  font-size: 0.875rem;
  color: var(--text-primary);
}
</style>
