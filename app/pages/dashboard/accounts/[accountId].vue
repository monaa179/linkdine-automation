<template>
  <NuxtLayout name="dashboard">
    <div class="account-workspace">
      <!-- Workspace Header -->
      <div class="workspace-header">
        <div class="header-left">
          <NuxtLink to="/dashboard/accounts" class="back-link">
            <ChevronLeft :size="20" />
            <span>Comptes</span>
          </NuxtLink>
          <div class="account-info" v-if="account">
            <div class="account-avatar-sm">{{ account.name[0] }}</div>
            <h1 class="account-name">{{ account.name }}</h1>
          </div>
          <div v-else class="skeleton-title"></div>
        </div>

        <div class="workspace-nav">
          <NuxtLink 
            :to="`/dashboard/accounts/${accountId}/feed`" 
            class="nav-tab"
            :class="{ active: currentTab === 'feed' }"
          >
            <LayoutPanelLeft :size="18" />
            <span>Feed</span>
          </NuxtLink>
          <NuxtLink 
            :to="`/dashboard/accounts/${accountId}/gallery`" 
            class="nav-tab"
            :class="{ active: currentTab === 'gallery' }"
          >
            <Image :size="18" />
            <span>Galerie</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="workspace-content">
        <NuxtPage />
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ChevronLeft, LayoutPanelLeft, Image } from 'lucide-vue-next'

definePageMeta({
  layout: false,
  middleware: ['auth']
})

const route = useRoute()
const accountId = route.params.accountId
const account = ref<any>(null)

const currentTab = computed(() => {
  if (route.path.includes('/gallery')) return 'gallery'
  return 'feed'
})

const fetchAccount = async () => {
  try {
    const data = await $fetch<any>(`/api/accounts/${accountId}`)
    account.value = data
  } catch (e) {
    console.error('Failed to fetch account', e)
  }
}

onMounted(fetchAccount)
</script>

<style scoped>
.account-workspace {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-height: 100%;
}

.workspace-header {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: var(--text-primary);
}

.account-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.account-avatar-sm {
  width: 32px;
  height: 32px;
  background: var(--accent-gradient);
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
}

.account-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.skeleton-title {
  width: 200px;
  height: 32px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  animation: pulse 1.5s infinite;
}

.workspace-nav {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  width: fit-content;
  border: 1px solid var(--border-glass);
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 9px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.nav-tab:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.03);
}

.nav-tab.active {
  color: white;
  background: var(--accent-gradient);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.workspace-content {
  flex: 1;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

@media (max-width: 640px) {
  .workspace-header {
    align-items: flex-start;
  }
}
</style>
