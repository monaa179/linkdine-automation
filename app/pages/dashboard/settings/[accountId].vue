<template>
  <NuxtLayout name="dashboard">
    <div class="settings-page">
      <div class="page-header">
        <NuxtLink to="/dashboard/accounts" class="back-link">
          <ChevronLeft :size="20" />
          Retour aux comptes
        </NuxtLink>
        <h1 class="title">Paramètres du compte</h1>
      </div>

      <div v-if="loading" class="loading-state glass">
        <div class="spinner"></div>
      </div>

      <div v-else-if="account" class="settings-grid animate-fade-in">
        <div class="main-settings">
          <BaseCard>
            <template #header>
              <h3>Configuration LinkedIn</h3>
            </template>

            <form @submit.prevent="handleSave" class="settings-form">
              <div class="form-row">
                <div class="form-group">
                  <label>Type de compte</label>
                  <select v-model="form.type" class="custom-select">
                    <option value="PERSONAL">Personnel</option>
                    <option value="COMPANY">Entreprise (Page)</option>
                  </select>
                </div>
                <div class="form-group" v-if="form.type === 'COMPANY'">
                  <BaseInput 
                    v-model="form.linkedinPageId" 
                    label="ID de la Page LinkedIn" 
                    placeholder="ex: urn:li:organization:12345"
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Prompt de contexte pour l'IA</label>
                <textarea 
                  v-model="form.contextPrompt" 
                  class="custom-textarea" 
                  rows="5"
                  placeholder="ex: Je suis un expert en marketing digital. Mon ton est professionnel mais accessible..."
                ></textarea>
                <p class="hint">Ce texte sera envoyé à l'IA pour chaque post afin de maintenir votre ton et votre expertise.</p>
              </div>

              <div class="section-divider"></div>

              <div class="form-group">
                <label>Fréquence de publication</label>
                <div class="frequency-options">
                  <button 
                    v-for="f in frequencies" 
                    :key="f.value"
                    type="button"
                    class="freq-btn"
                    :class="{ active: form.postingFrequency === f.value }"
                    @click="form.postingFrequency = f.value"
                  >
                    {{ f.label }}
                  </button>
                </div>
              </div>

              <div class="form-row" v-if="form.postingFrequency !== 'NONE'">
                <div class="form-group">
                  <label>Période</label>
                  <select v-model="form.postingPeriod" class="custom-select">
                    <option value="DAILY">Quotidien</option>
                    <option value="WEEKLY">Hebdomadaire</option>
                  </select>
                </div>
                <div class="form-group" v-if="form.postingPeriod === 'WEEKLY'">
                  <label>Jour</label>
                  <select v-model="form.postingDay" class="custom-select">
                    <option value="MONDAY">Lundi</option>
                    <option value="TUESDAY">Mardi</option>
                    <option value="WEDNESDAY">Mercredi</option>
                    <option value="THURSDAY">Jeudi</option>
                    <option value="FRIDAY">Vendredi</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Heure (0-23)</label>
                  <input type="number" v-model="form.postingHour" min="0" max="23" class="custom-select" />
                </div>
              </div>

              <div class="form-actions">
                <BaseButton type="submit" :loading="saving">Enregistrer les paramètres</BaseButton>
              </div>
            </form>
          </BaseCard>
        </div>

        <div class="info-sidebar">
          <BaseCard>
            <template #header>
              <h3>Statut du compte</h3>
            </template>
            <div class="status-info">
              <div class="info-line">
                <span>Connecté le :</span>
                <strong>{{ formatDate(account.createdAt) }}</strong>
              </div>
              <div class="info-line">
                <span>Token :</span>
                <span class="status-tag" :class="account.isTokenExpired ? 'error' : 'success'">
                  {{ account.isTokenExpired ? 'Expiré' : 'Valide' }}
                </span>
              </div>
              <div class="section-divider"></div>
              <p class="sidebar-hint">
                Si votre token expire, vous devrez reconnecter votre compte pour continuer l'automatisation.
              </p>
            </div>
          </BaseCard>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next'

definePageMeta({
  layout: false,
  middleware: ['auth']
})

const route = useRoute()
const loading = ref(true)
const saving = ref(false)
const account = ref<any>(null)

const form = reactive({
  type: 'PERSONAL',
  linkedinPageId: '',
  contextPrompt: '',
  postingFrequency: 'NONE',
  postingPeriod: 'DAILY',
  postingDay: 'MONDAY',
  postingHour: 9
})

const frequencies = [
  { label: 'Manuel', value: 'NONE' },
  { label: 'Auto (1/j)', value: 'DAILY' },
  { label: 'Auto (2/j)', value: 'TWICE_DAILY' },
]

const fetchAccount = async () => {
  try {
    const data = await $fetch(`/api/linkedin/accounts`)
    const found = data.accounts.find((a: any) => a.id === parseInt(route.params.accountId as string))
    if (!found) throw new Error('Account not found')
    
    account.value = found
    Object.assign(form, {
      type: found.type,
      linkedinPageId: found.linkedinPageId || '',
      contextPrompt: found.contextPrompt || '',
      postingFrequency: found.postingFrequency,
      postingPeriod: found.postingPeriod,
      postingDay: found.postingDay,
      postingHour: found.postingHour
    })
  } catch (e) {
    console.error(e)
    navigateTo('/dashboard/accounts')
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  saving.value = true
  try {
    await $fetch(`/api/linkedin/settings/${account.value.id}`, {
      method: 'PATCH',
      body: form
    })
    alert('Paramètres mis à jour !')
  } catch (e) {
    alert('Erreur lors de la sauvegarde.')
  } finally {
    saving.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(dateString))
}

onMounted(fetchAccount)
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.title {
  font-size: 2rem;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.custom-select, .custom-textarea {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  border-radius: 0.75rem;
  padding: 0.75rem;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.9375rem;
  outline: none;
}

.frequency-options {
  display: flex;
  gap: 0.75rem;
}

.freq-btn {
  flex: 1;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  color: var(--text-secondary);
  font-size: 0.875rem;
  transition: all var(--transition-fast);
}

.freq-btn.active {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

.section-divider {
  height: 1px;
  background: var(--border-glass);
  margin: 0.5rem 0;
}

.hint {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.form-actions {
  padding-top: 1rem;
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-line {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.status-tag {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

.status-tag.success { background: rgba(34, 197, 94, 0.1); color: var(--success); }
.status-tag.error { background: rgba(239, 68, 68, 0.1); color: var(--error); }

.sidebar-hint {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.loading-state {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s infinite linear;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 900px) {
  .settings-grid { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
}
</style>
