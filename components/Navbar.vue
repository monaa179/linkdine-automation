<template>
  <header class="navbar">
    <div class="search-bar">
      <Search :size="18" class="search-icon" />
      <input type="text" placeholder="Rechercher un post..." />
    </div>

    <div class="navbar-actions">
      <NuxtLink to="/dashboard/posts/create">
        <BaseButton size="sm">
          <Plus :size="18" />
          Nouveau Post
        </BaseButton>
      </NuxtLink>
      
      <button class="icon-btn">
        <Bell :size="20" />
      </button>

      <div class="divider"></div>

      <div class="date-display">
        <Calendar :size="18" />
        <span>{{ currentDate }}</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Search, Plus, Bell, Calendar } from 'lucide-vue-next'

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

.search-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  padding: 0.625rem 1rem;
  border-radius: 0.75rem;
  width: 350px;
}

.search-icon {
  color: var(--text-secondary);
}

.search-bar input {
  background: transparent;
  border: none;
  color: var(--text-primary);
  outline: none;
  width: 100%;
  font-size: 0.875rem;
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
