<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="logo">
        <span class="logo-icon">LA</span>
        <span class="logo-text">Automation</span>
      </div>
    </div>

    <nav class="nav-links">
      <NuxtLink v-for="item in menuItems" :key="item.path" :to="item.path" class="nav-item">
        <component :is="item.icon" :size="20" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <div class="sidebar-footer">
      <div class="user-info" v-if="user">
        <div class="avatar">{{ user.email[0].toUpperCase() }}</div>
        <div class="details">
          <span class="email">{{ user.email }}</span>
          <span class="plan">Plan Free</span>
        </div>
      </div>
      <button class="logout-btn" @click="handleLogout">
        <LogOut :size="18" />
        <span>Déconnexion</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { 
  Link2, 
  Users,
  LogOut,
  FileText
} from 'lucide-vue-next'

const { user, logout } = useAuth()

const menuItems = computed(() => {
  const items = [
    { label: 'Comptes LinkedIn', path: '/dashboard/accounts', icon: Link2 },
    { label: 'Modules', path: '/dashboard/modules', icon: FileText },
  ]

  if (user.value?.role === 'admin') {
    items.push({ label: 'Utilisateurs', path: '/dashboard/users', icon: Users })
  }

  return items
})

const handleLogout = () => {
  logout()
}
</script>

<style scoped>
.sidebar {
  width: 280px;
  height: 100vh;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(20px);
  border-right: 1px solid var(--border-glass);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 50;
}

.sidebar-header {
  padding: 2rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: var(--accent-gradient);
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.875rem;
}

.logo-text {
  font-weight: 700;
  font-size: 1.125rem;
  letter-spacing: -0.01em;
}

.nav-links {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.nav-item:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.nav-item.router-link-active {
  color: white;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.sidebar-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-glass);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  width: 40px;
  height: 40px;
  background: #334155;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--text-primary);
}

.details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.email {
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plan {
  font-size: 0.75rem;
  color: var(--accent-primary);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  width: 100%;
  color: var(--text-secondary);
  border-radius: 0.75rem;
  transition: all var(--transition-fast);
}

.logout-btn:hover {
  color: var(--error);
  background: rgba(239, 68, 68, 0.05);
}
</style>
