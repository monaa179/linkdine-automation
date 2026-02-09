<template>
  <header class="navbar">

    <div class="navbar-actions">

      <div class="divider"></div>

      <ClientOnly>
        <div class="date-display">
          <Calendar :size="18" />
          <span>{{ currentDate }}</span>
        </div>
      </ClientOnly>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Calendar } from 'lucide-vue-next'

const currentDate = computed(() => {
  return new Intl.DateTimeFormat('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }).format(new Date())
})
</script>

<style scoped>
.navbar {
  height: 80px;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-glass);
  position: sticky;
  top: 0;
  z-index: 40;
}


.navbar-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.icon-btn {
  color: var(--text-secondary);
  transition: color var(--transition-fast);
}

.icon-btn:hover {
  color: var(--text-primary);
}

.divider {
  width: 1px;
  height: 24px;
  background: var(--border-glass);
}

.date-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}
</style>
