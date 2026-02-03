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
              <span class="badge">{{ account.postingPeriod }}</span>
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
              <span class="stat-value">{{ account.postingFrequency }}x</span>
              <span class="stat-label">Fréquence</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">
                {{ account.postingHour }}
              </span>
              <span class="stat-label">Heure</span>
            </div>
          </div>
          
          <div class="account-nav">
            <NuxtLink :to="`/dashboard/accounts/${account.id}/gallery`" class="nav-btn gallery">
              <Image :size="18" />
              <span>Galerie</span>
            </NuxtLink>
            <NuxtLink :to="`/dashboard/accounts/${account.id}/feed`" class="nav-btn feed">
              <LayoutPanelLeft :size="18" />
              <span>Feed</span>
            </NuxtLink>
          </div>
          
          <template #footer>
            <div class="account-footer">
              <BaseButton 
                v-if="currentAccountId !== account.id"
                variant="outline" 
                size="sm" 
                @click="selectAccount(account)"
                block
              >
                Connecter ce compte
              </BaseButton>
              <div v-else class="selected-badge">
                <CheckCircle2 :size="16" />
                Connecté
              </div>
            </div>
          </template>
        </BaseCard>
      </div>

      <!-- Add Account Modal -->
      <BaseModal v-if="showAddModal" title="Connecter un compte" @close="showAddModal = false">
        <form @submit.prevent="handleAddAccount" class="account-form">
          <BaseInput v-model="newAccount.name" label="Nom du compte" placeholder="ex: Mon Profile Perso" required />
          <BaseInput v-model="newAccount.makeConnection" label="Make Connection ID" placeholder="ex: linkedin-connection-1" required />
          <BaseTextArea v-model="newAccount.contextPrompt" label="Context Prompt (AI)" placeholder="Décrivez le ton et le style pour ce compte..." required />
          
          <div class="form-row">
            <BaseSelect v-model="newAccount.postingPeriod" label="Période" :options="['day', 'week', 'month']" />
            <BaseInput v-model.number="newAccount.postingFrequency" type="number" label="Fréquence" />
          </div>

          <div class="form-row">
            <BaseInput v-model="newAccount.postingDay" label="Jour (ex: monday)" placeholder="monday" />
            <BaseInput v-model="newAccount.postingHour" type="time" label="Heure" />
          </div>

          <div class="form-actions">
            <BaseButton type="submit" variant="primary" block>Créer le compte</BaseButton>
          </div>
        </form>
      </BaseModal>

      <!-- Edit Account Modal -->
      <BaseModal v-if="showEditModal" title="Paramètres du compte" @close="showEditModal = false">
        <form v-if="editAccount" @submit.prevent="handleUpdateAccount" class="account-form">
          <BaseInput v-model="editAccount.name" label="Nom du compte" required />
          <BaseInput v-model="editAccount.makeConnection" label="Make Connection ID" required />
          
          <div class="base-textarea-container">
            <label class="label">Context Prompt (AI)</label>
            <div class="textarea-wrapper">
              <textarea v-model="editAccount.contextPrompt" class="textarea" rows="4"></textarea>
            </div>
          </div>
          
          <div class="form-row">
            <div class="base-select-container">
              <label class="label">Période</label>
              <select v-model="editAccount.postingPeriod" class="select">
                <option value="day">Jour</option>
                <option value="week">Semaine</option>
                <option value="month">Mois</option>
              </select>
            </div>
            <BaseInput v-model.number="editAccount.postingFrequency" type="number" label="Fréquence" />
          </div>

          <div class="form-row">
            <BaseInput v-model="editAccount.postingDay" label="Jour" />
            <BaseInput v-model="editAccount.postingHour" type="time" label="Heure" />
          </div>

          <div class="form-actions">
            <BaseButton type="submit" variant="primary" block>Enregistrer</BaseButton>
            <BaseButton 
              type="button" 
              variant="outline" 
              block 
              @click="generatePosts(editAccount)"
              :loading="generating"
            >
              <Sparkles :size="18" />
              Générer des publications
            </BaseButton>
          </div>
        </form>
      </BaseModal>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Link2, Trash2, Settings, CheckCircle2, Sparkles, Image, LayoutPanelLeft } from 'lucide-vue-next'

definePageMeta({
  layout: false,
  middleware: ['auth']
})

const { currentAccountId, setCurrentAccountId } = useCurrentAccount()
const router = useRouter()
const loading = ref(true)
const connecting = ref(false)
const generating = ref(false)
const accounts = ref<any[]>([])

const showAddModal = ref(false)
const showEditModal = ref(false)
const editAccount = ref<any>(null)

const newAccount = reactive({
  name: '',
  makeConnection: '',
  contextPrompt: '',
  postingFrequency: 1,
  postingPeriod: 'week',
  postingDay: 'monday',
  postingHour: '09:00'
})

const fetchAccounts = async () => {
  loading.value = true
  try {
    const data = await $fetch<any[]>('/api/accounts')
    accounts.value = data
  } catch (e) {
    console.error('Failed to fetch accounts', e)
  } finally {
    loading.value = false
  }
}

const handleAddAccount = async () => {
  try {
    await $fetch('/api/accounts', {
      method: 'POST',
      body: newAccount
    })
    showAddModal.value = false
    // Reset form
    Object.assign(newAccount, {
      name: '',
      makeConnection: '',
      contextPrompt: '',
      postingFrequency: 1,
      postingPeriod: 'week',
      postingDay: 'monday',
      postingHour: '09:00'
    })
    await fetchAccounts()
  } catch (e) {
    alert('Erreur lors de l\'ajout du compte')
  }
}

const handleUpdateAccount = async () => {
  if (!editAccount.value) return
  try {
    await $fetch(`/api/accounts/${editAccount.value.id}`, {
      method: 'PATCH',
      body: editAccount.value
    })
    showEditModal.value = false
    await fetchAccounts()
  } catch (e) {
    alert('Erreur lors de la mise à jour')
  }
}

const connectNewAccount = () => {
  showAddModal.value = true
}

const openSettings = (account: any) => {
  editAccount.value = { ...account }
  showEditModal.value = true
}

const confirmDelete = async (account: any) => {
  if (confirm(`Êtes-vous sûr de vouloir supprimer le compte "${account.name}" ?`)) {
    try {
      await $fetch(`/api/accounts/${account.id}`, { method: 'DELETE' })
      if (currentAccountId.value === account.id) {
        setCurrentAccountId(null)
      }
      await fetchAccounts()
    } catch (e) {
      alert('Erreur lors de la suppression')
    }
  }
}

const selectAccount = (account: any) => {
  setCurrentAccountId(account.id)
  router.push('/dashboard')
}

const generatePosts = async (account: any) => {
  if (!confirm(`Voulez-vous lancer la génération de publications pour "${account.name}" ?`)) return
  
  generating.value = true
  try {
    // 1. Enregistrer les modifications d'abord pour s'assurer que Make.com reçoit le dernier contextPrompt
    await $fetch(`/api/accounts/${account.id}`, {
      method: 'PATCH',
      body: account
    })

    // 2. Lancer la génération
    const response = await $fetch(`/api/accounts/${account.id}/generate`, {
      method: 'POST'
    })
    alert('Génération lancée avec succès ! Consultez la liste des posts dans quelques instants.')
    if (showEditModal.value) showEditModal.value = false
    await fetchAccounts() // Refresh to show any changes
  } catch (e: any) {
    console.error('Generation failed', e)
    alert(`Erreur lors de la génération: ${e.message || 'Erreur inconnue'}`)
  } finally {
    generating.value = false
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

.account-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all var(--transition-fast);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-glass);
  color: var(--text-primary);
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--accent-primary);
  transform: translateY(-2px);
}

.nav-btn.gallery { color: var(--accent-secondary); }
.nav-btn.feed { color: var(--accent-primary); }

.account-footer {
  width: 100%;
}

.selected-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--accent-primary);
  font-weight: 600;
  font-size: 0.875rem;
  padding: 0.5rem;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
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
