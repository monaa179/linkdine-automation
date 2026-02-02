<template>
  <div class="base-card glass" :class="{ interactive }">
    <div v-if="$slots.header" class="card-header">
      <slot name="header" />
    </div>
    <div class="card-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  interactive: Boolean
})
</script>

<style scoped>
.base-card {
  overflow: hidden;
  transition: all var(--transition-normal);
}

.interactive:hover {
  transform: translateY(-4px);
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: var(--shadow-lg);
  cursor: pointer;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-glass);
}

.card-body {
  padding: 1.5rem;
}

.card-footer {
  padding: 1.25rem 1.5rem;
  background: rgba(0, 0, 0, 0.1);
  border-top: 1px solid var(--border-glass);
}
</style>
