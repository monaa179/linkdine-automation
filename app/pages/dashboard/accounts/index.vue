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
          Ajouter un compte LinkdIn
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
        <BaseCard 
          v-for="account in accounts" 
          :key="account.id" 
          class="account-card clickable"
          @click="goToAccountSpace(account.id)"
        >
          <div class="account-header">
            <div class="account-avatar">{{ account.name[0] }}</div>
            <div class="account-meta">
              <h3>{{ account.name }}</h3>
              <div class="account-badges">
                <span class="badge">{{ account.postingPeriod }}</span>
                <span class="badge gallery" v-if="account.stats?.galleryCount > 0">
                  <Image :size="12" /> {{ account.stats.galleryCount }} photos
                </span>
              </div>
            </div>
            <div class="account-actions" @click.stop>
              <button class="icon-btn" title="Paramètres" @click="openSettings(account)">
                <Settings :size="18" />
              </button>
              <button class="icon-btn delete" title="Supprimer" @click="confirmDelete(account)">
                <Trash2 :size="18" />
              </button>
            </div>
          </div>

          <div class="account-stats-grid">
            <div class="stat-box">
              <span class="stat-label">Dernier publié</span>
              <span class="stat-value" v-if="account.stats?.lastPublished">
                {{ formatDate(account.stats.lastPublished.publishedAt) }}
              </span>
              <span class="stat-value empty" v-else>Aucun</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Programmé</span>
              <span class="stat-value" v-if="account.stats?.lastScheduled">
                {{ formatDate(account.stats.lastScheduled.scheduledAt) }}
              </span>
              <span class="stat-value empty" v-else>Aucun</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Total publiés</span>
              <span class="stat-value">{{ account.stats?.publishedCount || 0 }}</span>
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
        </BaseCard>
      </div>

      <!-- Add Account Modal -->
      <BaseModal v-if="showAddModal" title="Créer un nouveau compte" @close="showAddModal = false">
        <form @submit.prevent="handleAddAccount" class="account-form">
          <BaseInput v-model="newAccount.name" label="Nom du compte" placeholder="ex: Mon Profile Perso" required />
          <BaseInput v-model="newAccount.makeConnection" label="Make Connection ID" placeholder="ex: linkedin-connection-1" required />
          <BaseTextArea v-model="newAccount.contextPrompt" label="Context Prompt (AI)" placeholder="Décrivez le ton et le style pour ce compte..." required />
          
          <div class="form-row">
            <BaseSelect v-model="newAccount.postingPeriod" label="Période" :options="['day', 'week', 'month']" />
            <BaseInput v-model.number="newAccount.postingFrequency" type="number" label="Fréquence" />
          </div>

          <div class="form-section">
            <BaseCheckboxGroup
              v-if="newAccount.postingPeriod === 'week'"
              v-model="selectedDaysNew"
              label="Jours de publication"
              :options="dayOptions"
            />
            <BaseInput v-else-if="newAccount.postingPeriod === 'month'" v-model="newAccount.postingDay" label="Jour du mois (ex: 15)" placeholder="15" />
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
            <div class="label-header">
              <label class="label">Context Prompt (AI)</label>
              <span class="char-count" :class="{ warning: editAccount.contextPrompt.length > 800 }">
                {{ editAccount.contextPrompt.length }}/1000
              </span>
            </div>
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

          <div class="form-section">
            <BaseCheckboxGroup
              v-if="editAccount.postingPeriod === 'week'"
              v-model="selectedDaysEdit"
              label="Jours de publication"
              :options="dayOptions"
            />
            <BaseInput v-else-if="editAccount.postingPeriod === 'month'" v-model="editAccount.postingDay" label="Jour du mois (ex: 15)" />
            <BaseInput v-model="editAccount.postingHour" type="time" label="Heure" />
          </div>

          <div v-if="previewSlots.length > 0" class="preview-section">
            <label class="label">Prochaines publications prévues :</label>
            <div class="slots-list">
              <div v-for="(slot, i) in previewSlots" :key="i" class="slot-item">
                <Calendar :size="14" />
                <span>{{ slot.formatted }}</span>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <BaseButton 
              type="submit" 
              variant="primary" 
              block
              :loading="saving"
            >
              <Save :size="18" />
              Sauvegarder
            </BaseButton>
          </div>
        </form>
      </BaseModal>

      <!-- Confirmation Modals -->
      <BaseConfirmModal
        :show="confirmModal.show"
        :title="confirmModal.title"
        :message="confirmModal.message"
        :variant="confirmModal.variant"
        :confirm-text="confirmModal.confirmText"
        :loading="confirmModal.loading"
        @confirm="confirmModal.onConfirm"
        @cancel="confirmModal.show = false"
      />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Link2, Trash2, Settings, CheckCircle2, Save, Calendar, Image } from 'lucide-vue-next'
import BaseCheckboxGroup from '~/components/BaseCheckboxGroup.vue'
import BaseConfirmModal from '~/components/BaseConfirmModal.vue'

definePageMeta({
  layout: false,
  middleware: ['auth']
})

const dayOptions = [
  { label: 'Lun', value: 'monday' },
  { label: 'Mar', value: 'tuesday' },
  { label: 'Mer', value: 'wednesday' },
  { label: 'Jeu', value: 'thursday' },
  { label: 'Ven', value: 'friday' },
  { label: 'Sam', value: 'saturday' },
  { label: 'Dim', value: 'sunday' }
]

const selectedDaysNew = ref<string[]>(['monday'])
const selectedDaysEdit = ref<string[]>(['monday'])
const previewSlots = ref<any[]>([])

const { currentAccountId, setCurrentAccountId } = useCurrentAccount()
const router = useRouter()
const loading = ref(true)
const connecting = ref(false)
const saving = ref(false)
const accounts = ref<any[]>([])

const showAddModal = ref(false)
const showEditModal = ref(false)
const editAccount = ref<any>(null)

// Confirmation Modal State
const confirmModal = reactive({
  show: false,
  title: '',
  message: '',
  variant: 'primary',
  confirmText: 'Confirmer',
  loading: false,
  onConfirm: () => {}
})

// Preview logic
const updatePreview = async () => {
  if (!editAccount.value) return
  try {
    const data = await $fetch<any>('/api/accounts/preview-slots', {
      method: 'POST',
      body: {
        postingPeriod: editAccount.value.postingPeriod,
        postingFrequency: editAccount.value.postingFrequency,
        postingDay: editAccount.value.postingPeriod === 'week' ? selectedDaysEdit.value.join(',') : editAccount.value.postingDay,
        postingHour: editAccount.value.postingHour
      }
    })
    previewSlots.value = data.slots
  } catch (e) {
    console.error('Failed to fetch preview', e)
  }
}



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
    // Join selected days for backend
    if (newAccount.postingPeriod === 'week') {
      newAccount.postingDay = selectedDaysNew.value.join(',')
    }

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
    selectedDaysNew.value = ['monday']
    await fetchAccounts()
  } catch (e) {
    alert('Erreur lors de l\'ajout du compte')
  }
}

const handleUpdateAccount = async () => {
  if (!editAccount.value) return
  saving.value = true
  try {
    // Join selected days for backend
    if (editAccount.value.postingPeriod === 'week') {
      editAccount.value.postingDay = selectedDaysEdit.value.join(',')
    }

    await $fetch(`/api/accounts/${editAccount.value.id}`, {
      method: 'PATCH',
      body: editAccount.value
    })
    await fetchAccounts()
    showEditModal.value = false
  } catch (e) {
    console.error('Failed to update account', e)
    alert('Erreur lors de la sauvegarde des modifications')
  } finally {
    saving.value = false
  }
}

watch([() => editAccount.value?.postingPeriod, () => editAccount.value?.postingFrequency, () => editAccount.value?.postingHour, selectedDaysEdit, () => editAccount.value?.postingDay], () => {
  updatePreview()
}, { deep: true })

const connectNewAccount = () => {
  showAddModal.value = true
}

const openSettings = (account: any) => {
  editAccount.value = { ...account }
  // Parse days for frontend
  if (editAccount.value.postingPeriod === 'week' && editAccount.value.postingDay) {
    selectedDaysEdit.value = editAccount.value.postingDay.split(',')
  } else {
    selectedDaysEdit.value = []
  }
  showEditModal.value = true
  // Trigger preview
  nextTick(() => {
    updatePreview()
  })
}

const confirmDelete = (account: any) => {
  confirmModal.title = 'Supprimer le compte'
  confirmModal.message = `Êtes-vous sûr de vouloir supprimer le compte "${account.name}" ? Cette action est irréversible.`
  confirmModal.variant = 'danger'
  confirmModal.confirmText = 'Supprimer'
  confirmModal.onConfirm = async () => {
    confirmModal.loading = true
    try {
      await $fetch(`/api/accounts/${account.id}`, { method: 'DELETE' })
      if (currentAccountId.value === account.id) {
        setCurrentAccountId(null)
      }
      await fetchAccounts()
      confirmModal.show = false
    } catch (e) {
      alert('Erreur lors de la suppression')
    } finally {
      confirmModal.loading = false
    }
  }
  confirmModal.show = true
}

const selectAccount = (account: any) => {
  setCurrentAccountId(account.id)
}

const goToAccountSpace = (accountId: number) => {
  setCurrentAccountId(accountId)
  router.push(`/dashboard/accounts/${accountId}/feed`)
}

const generatePosts = (account: any) => {
  confirmModal.title = 'Générer des publications'
  confirmModal.message = `Voulez-vous lancer la génération de publications pour "${account.name}" ? Cela utilisera l'IA pour créer de nouveaux contenus.`
  confirmModal.variant = 'primary'
  confirmModal.confirmText = 'Lancer la génération'
  confirmModal.onConfirm = async () => {
    confirmModal.loading = true
    try {
      // 1. Enregistrer les modifications d'abord for Make.com
      await $fetch(`/api/accounts/${account.id}`, {
        method: 'PATCH',
        body: account
      })

      // 2. Lancer la génération
      await $fetch(`/api/accounts/${account.id}/generate`, {
        method: 'POST'
      })
      alert('Génération lancée avec succès ! Consultez la liste des posts dans quelques instants.')
      if (showEditModal.value) showEditModal.value = false
      await fetchAccounts()
      confirmModal.show = false
    } catch (e: any) {
      console.error('Generation failed', e)
      alert(`Erreur lors de la génération: ${e.message || 'Erreur inconnue'}`)
    } finally {
      confirmModal.loading = false
    }
  }
  confirmModal.show = true
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

.account-card.clickable {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.account-card.clickable:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  border-color: var(--accent-primary);
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
.badge.gallery { 
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--warning); 
  background: rgba(245, 158, 11, 0.1); 
}

.account-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

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

.account-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin: 0.5rem 0;
}

.stat-box {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0.5rem;
  border: 1px solid var(--border-glass);
}

.stat-box .stat-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
}

.stat-box .stat-value {
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-box .stat-value.empty {
  color: var(--text-secondary);
  opacity: 0.5;
  font-weight: 400;
}


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

/* Modal Form Specifics */
.label-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.char-count {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.char-count.warning {
  color: var(--warning);
}

.prompt-help {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: rgba(59, 130, 246, 0.05);
  border-left: 3px solid var(--accent-primary);
  border-radius: 4px;
}

.prompt-help p {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* Preview Section */
.preview-section {
  margin: 1.5rem 0;
  padding: 1rem;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 0.75rem;
  border: 1px solid rgba(59, 130, 246, 0.1);
}

.preview-section .label {
  display: block;
  margin-bottom: 0.75rem;
  color: var(--accent-primary);
  font-weight: 600;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.slots-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.slot-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.5rem;
}

.slot-item span {
  text-transform: capitalize;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin: 1rem 0;
}

.select {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  border-radius: 0.5rem;
  color: var(--text-primary);
  padding: 0.5rem;
  width: 100%;
  outline: none;
}

.select:focus {
  border-color: var(--accent-primary);
}

.textarea-wrapper {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-glass);
  border-radius: 0.75rem;
  transition: all var(--transition-normal);
  width: 100%;
  position: relative;
  overflow: hidden;
}

.textarea-wrapper:focus-within {
  border-color: var(--accent-primary);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.15);
}

.textarea {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 0.9375rem;
  width: 100%;
  outline: none;
  padding: 1rem;
  min-height: 120px;
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
}

.textarea::placeholder {
  color: var(--text-secondary);
  opacity: 0.4;
}
</style>
