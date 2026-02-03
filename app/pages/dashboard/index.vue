<template>
  <NuxtLayout name="dashboard">
    <div class="dashboard-page">
      <ClientOnly>
        <div class="welcome-section">
          <h1 class="title">Tableau de bord</h1>
          <p v-if="currentAccount" class="subtitle">Bienvenue sur le compte <strong>{{ currentAccount.name }}</strong>.</p>
          <p v-else class="subtitle">Bienvenue, {{ user?.email.split('@')[0] }}. Veuillez sélectionner un compte pour commencer.</p>
        </div>
      </ClientOnly>

      <!-- No Account Selected Overlay -->
      <div v-if="!currentAccountId && !loading" class="account-selector-overlay glass-heavy animate-fade-in">
        <div class="overlay-content">
          <div class="overlay-icon"><Link2 :size="48" /></div>
          <h2>Aucun compte sélectionné</h2>
          <p>Vous devez sélectionner un compte LinkedIn pour voir les statistiques et gérer les publications.</p>
          <NuxtLink to="/dashboard/accounts">
            <BaseButton variant="primary" size="lg">Sélectionner un compte</BaseButton>
          </NuxtLink>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <BaseCard v-for="stat in stats" :key="stat.label">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: stat.color + '15', color: stat.color }">
              <component :is="stat.icon" :size="24" />
            </div>
            <div class="stat-info">
              <span class="stat-label">{{ stat.label }}</span>
              <span class="stat-value">{{ stat.value }}</span>
            </div>
          </div>
        </BaseCard>
      </div>

      <div class="content-grid">
        <!-- Recent Activity -->
        <BaseCard class="span-2">
          <template #header>
            <div class="card-header-flex">
              <h3>Derniers Posts</h3>
              <NuxtLink to="/dashboard/posts" class="view-all">Voir tout</NuxtLink>
            </div>
          </template>
          
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
          </div>
          <div v-else-if="posts.length === 0" class="empty-state">
            <div class="empty-icon"><FileText :size="40" /></div>
            <p>Aucun post récent</p>
            <NuxtLink to="/dashboard/posts/create">
              <BaseButton size="sm" variant="outline">Créer votre premier post</BaseButton>
            </NuxtLink>
          </div>
          <div v-else class="posts-list">
            <!-- List items here -->
          </div>
        </BaseCard>

        <!-- Quick Actions / Linked Accounts -->
        <BaseCard>
          <template #header>
            <h3>Comptes Connectés</h3>
          </template>
          
          <div v-if="accounts.length === 0" class="empty-state sm">
            <p>Aucun compte LinkedIn connecté</p>
            <NuxtLink to="/dashboard/accounts">
              <BaseButton size="sm" variant="primary">Connecter</BaseButton>
            </NuxtLink>
          </div>
          <div v-else class="accounts-mini-list">
            <div v-for="account in accounts" :key="account.id" class="account-item">
              <div class="account-avatar">{{ account.name[0] }}</div>
              <div class="account-info">
                <span class="account-name">{{ account.name }}</span>
                <span class="account-type">{{ account.postingPeriod }}</span>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { 
  Send, 
  CheckCircle2, 
  FileEdit, 
  Clock, 
  FileText,
  Link2,
  AlertCircle
} from 'lucide-vue-next'

definePageMeta({
  layout: false,
  middleware: ['auth']
})

const { user } = useAuth()
const { currentAccountId, currentAccount, fetchCurrentAccount } = useCurrentAccount()
const loading = ref(true)
const posts = ref<any[]>([])
const accounts = ref<any[]>([])

const stats = computed(() => [
  { label: 'Programmés', value: 0, icon: Clock, color: '#3b82f6' },
  { label: 'Publiés', value: 0, icon: CheckCircle2, color: '#22c55e' },
  { label: 'Brouillons', value: 0, icon: FileEdit, color: '#f59e0b' },
  { label: 'Comptes', value: accounts.value.length, icon: Link2, color: '#8b5cf6' },
])

onMounted(async () => {
  try {
    if (currentAccountId.value) {
      const [postsData, accountsData, _] = await Promise.all([
        $fetch<any[]>(`/api/posts?accountId=${currentAccountId.value}&limit=5`),
        $fetch<any[]>('/api/accounts'), // Fetch all accounts to show in mini-list
        fetchCurrentAccount()
      ])
      posts.value = postsData
      accounts.value = accountsData
    } else {
      loading.value = false
    }
  } catch (e) {
    console.error('Failed to fetch dashboard data', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.welcome-section .title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.welcome-section .subtitle {
  color: var(--text-secondary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.span-2 {
  grid-column: span 2;
}

.card-header-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.view-all {
  font-size: 0.875rem;
  color: var(--accent-primary);
  font-weight: 500;
}

.loading-state, .empty-state {
  padding: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 1rem;
  color: var(--text-secondary);
}

.empty-state.sm {
  padding: 1.5rem;
}

.empty-icon {
  color: rgba(255, 255, 255, 0.05);
}

.accounts-mini-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.account-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
}

.account-avatar {
  width: 32px;
  height: 32px;
  background: var(--accent-secondary);
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  font-weight: 600;
}

.account-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.account-name {
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.account-type {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.spinner {
  width: 30px;
  height: 30px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s infinite linear;
}

.account-selector-overlay {
  position: fixed;
  top: 100px;
  left: 310px; /* Sidebar width + some padding */
  right: 30px;
  bottom: 30px;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2rem;
  backdrop-filter: blur(8px);
  background: rgba(0, 0, 0, 0.4);
}

.overlay-content {
  text-align: center;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-glass);
  border-radius: 2rem;
}

.overlay-icon {
  width: 80px;
  height: 80px;
  background: var(--accent-gradient);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 0.5rem;
}

@media (max-width: 1024px) {
  .account-selector-overlay {
    left: 30px;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1100px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  .span-2 {
    grid-column: span 1;
  }
}
</style>
