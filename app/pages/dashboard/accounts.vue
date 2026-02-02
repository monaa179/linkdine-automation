<template>
  <NuxtLayout name="dashboard">
    <div class="accounts-page">
      <div class="page-header">
        <div class="header-content">
          <h1 class="title">Comptes LinkedIn</h1>
          <p class="subtitle">Gérez vos comptes personnels et pages d'entreprise.</p>
        </div>
        <BaseButton @click="connectNewAccount" :loading="connecting">
          <Link2 :size="18" />
          Connecter un compte
        </BaseButton>
      </div>

      <div v-if="loading" class="loading-grid">
        <div v-for="i in 3" :key="i" class="skeleton-card glass"></div>
      </div>

      <div v-else-if="accounts.length === 0" class="empty-state glass animate-fade-in">
        <div class="empty-icon"><Link2 :size="60" /></div>
        <h2>Aucun compte connecté</h2>
        <p>Connectez votre premier compte LinkedIn pour commencer à automatiser vos posts.</p>
        <BaseButton variant="primary" size="lg" @click="connectNewAccount">
          Démarrer maintenant
        </BaseButton>
      </div>

      <div v-else class="accounts-grid">
        <BaseCard v-for="account in accounts" :key="account.id" class="account-card">
          <div class="account-header">
            <div class="account-avatar">{{ account.name[0] }}</div>
            <div class="account-meta">
              <h3>{{ account.name }}</h3>
              <span class="badge" :class="account.type.toLowerCase()">{{ account.type }}</span>
            </div>
            <div class="account-actions">
              <button class="icon-btn" title="Paramètres" @click="openSettings(account)">
                <Settings :size="18" />
              </button>
              <button class="icon-btn delete" title="Supprimer" @click="confirmDelete(account)">
                <Trash2 :size="18" />
              </button>
            </div>
          </div>

          <div class="account-stats">
            <div class="stat-item">
              <span class="stat-value">{{ account.postCount || 0 }}</span>
              <span class="stat-label">Posts</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value" :class="{ expired: account.isTokenExpired }">
                {{ account.isTokenExpired ? 'Expiré' : 'Actif' }}
              </span>
              <span class="stat-label">Statut Token</span>
            </div>
          </div>
          
          <template #footer>
            <div class="account-footer">
              <span class="last-sync">Dernière synchro: {{ formatDate(account.createdAt) }}</span>
            </div>
          </template>
        </BaseCard>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Link2, Trash2, Settings } from 'lucide-vue-next'

definePageMeta({
  layout: false,
  middleware: ['auth']
})

const loading = ref(true)
const connecting = ref(false)
const accounts = ref([])

const fetchAccounts = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/linkedin/accounts')
    accounts.value = data.accounts
  } catch (e) {
    console.error('Failed to fetch accounts', e)
  } finally {
    loading.value = false
  }
}

const connectNewAccount = () => {
  connecting.value = true
  // Redirect to the LinkedIn connect endpoint
  window.location.href = '/api/linkedin/connect'
}

const openSettings = (account: any) => {
  // Logic to open settings modal/page
  navigateTo(`/dashboard/settings/${account.id}`)
}

const confirmDelete = async (account: any) => {
  if (confirm(`Êtes-vous sûr de vouloir supprimer le compte "${account.name}" ?`)) {
    try {
      await $fetch(`/api/linkedin/accounts/${account.id}`, { method: 'DELETE' })
      await fetchAccounts()
    } catch (e) {
      alert('Erreur lors de la suppression')
    }
  }
}

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short'
  }).format(new Date(dateString))
}

onMounted(fetchAccounts)
</script>

<style scoped>
.accounts-page {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-secondary);
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.account-card {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.account-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.account-avatar {
  width: 48px;
  height: 48px;
  background: var(--accent-gradient);
  color: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
}

.account-meta {
  flex: 1;
}

.account-meta h3 {
  font-size: 1.125rem;
  margin-bottom: 0.25rem;
}

.badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.625rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.badge.personal { color: var(--accent-primary); background: rgba(59, 130, 246, 0.1); }
.badge.company { color: var(--accent-secondary); background: rgba(139, 92, 246, 0.1); }

.account-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  background: rgba(255, 255, 255, 0.03);
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.icon-btn.delete:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
}

.account-stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 1rem 0;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-weight: 700;
  font-size: 1.125rem;
}

.stat-value.expired {
  color: var(--error);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: var(--border-glass);
}

.account-footer {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.empty-state {
  padding: 5rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  border: 1px dashed var(--border-glass);
}

.empty-icon {
  margin-bottom: 1rem;
  opacity: 0.2;
}

.empty-state h2 {
  font-size: 1.75rem;
}

.empty-state p {
  color: var(--text-secondary);
  max-width: 400px;
  margin-bottom: 1rem;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.skeleton-card {
  height: 250px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}
</style>
