<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="base-button"
    :class="[variant, size, { loading, disabled }]"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="loader"></span>
    <slot v-else />
  </button>
</template>

<script setup lang="ts">
defineProps({
  type: {
    type: String as () => 'button' | 'submit' | 'reset',
    default: 'button'
  },
  variant: {
    type: String as () => 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger',
    default: 'primary'
  },
  size: {
    type: String as () => 'sm' | 'md' | 'lg',
    default: 'md'
  },
  loading: Boolean,
  disabled: Boolean
})

defineEmits(['click'])
</script>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  border-radius: 0.75rem;
  transition: all var(--transition-fast);
  gap: 0.5rem;
  white-space: nowrap;
}

/* Variants */
.primary {
  background: var(--accent-gradient);
  color: white;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.secondary {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  border: 1px solid var(--border-glass);
}

.secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.outline {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--accent-primary);
}

.outline:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.1);
}

.danger {
  background: var(--error);
  color: white;
}

.danger:hover:not(:disabled) {
  filter: brightness(1.1);
}

/* Sizes */
.sm { padding: 0.5rem 1rem; font-size: 0.875rem; }
.md { padding: 0.75rem 1.5rem; font-size: 1rem; }
.lg { padding: 1rem 2rem; font-size: 1.125rem; }

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(1);
}

.loader {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
