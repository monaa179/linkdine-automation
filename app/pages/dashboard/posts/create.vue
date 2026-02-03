<template>
  <NuxtLayout name="dashboard">
    <div class="create-post-page">
      <div class="page-header">
        <NuxtLink to="/dashboard/posts" class="back-link">
          <ChevronLeft :size="20" />
          Retour
        </NuxtLink>
        <h1 class="title">Nouveau Post</h1>
      </div>

      <div v-if="currentAccountId" class="upload-container">
        <BaseCard>
          <div class="upload-info">
            <h2>Télécharger des images</h2>
            <p>Téléchargez une ou plusieurs images pour le compte <strong>{{ currentAccount?.name }}</strong>. Un post sera créé pour chaque image.</p>
          </div>

          <form @submit.prevent="handleSubmit" class="post-form">
            <!-- Multi-Image Upload -->
            <div class="form-group">
              <label>Images des posts (Max 10)</label>
              <div 
                class="dropzone" 
                :class="{ dragover, hasImages: selectedFiles.length > 0 }"
                @dragover.prevent="dragover = true"
                @dragleave.prevent="dragover = false"
                @drop.prevent="handleDrop"
                @click="fileInput?.click()"
              >
                <input 
                  type="file" 
                  ref="fileInput" 
                  class="hidden" 
                  accept="image/*" 
                  multiple
                  @change="handleFileSelect" 
                />
                
                <div class="dropzone-content">
                  <Upload :size="32" />
                  <p>Cliquez ou glissez vos images ici</p>
                  <span class="sub-hint">JPG, PNG, WebP (max 10MB par image)</span>
                </div>
              </div>

              <!-- Selected Files Preview -->
              <div v-if="selectedFiles.length > 0" class="files-preview-grid">
                <div v-for="(file, index) in selectedFiles" :key="index" class="file-preview-item">
                  <div class="preview-mini-container">
                    <img :src="file.preview" alt="Preview" class="mini-preview" />
                    <button type="button" class="remove-file-btn" @click.stop="removeFile(index)">
                      <X :size="14" />
                    </button>
                  </div>
                  <span class="file-name">{{ file.name }}</span>
                </div>
              </div>

              <div v-if="uploading" class="upload-progress-container">
                <div class="progress-info">
                  <span>Téléchargement en cours...</span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar" :style="{ width: uploadProgress + '%' }"></div>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <BaseButton 
                type="submit" 
                :loading="submitting" 
                :disabled="!isFormValid"
                class="submit-btn"
              >
                Créer les {{ selectedFiles.length }} posts
              </BaseButton>
              <p class="disclaimer">
                Chaque image créera un post en mode brouillon pour <strong>{{ currentAccount?.name }}</strong>. L'IA générera ensuite les légendes.
              </p>
            </div>
          </form>
        </BaseCard>
      </div>

      <!-- No Account Selected Overlay -->
      <div v-else class="account-selector-overlay">
        <div class="overlay-content">
          <div class="icon-pulse">
            <Link2 :size="48" />
          </div>
          <h2>Aucun compte sélectionné</h2>
          <p>Vous devez sélectionner un compte LinkedIn avant de pouvoir créer des publications.</p>
          <NuxtLink to="/dashboard/accounts">
            <BaseButton variant="primary" size="lg">
              Sélectionner un compte
            </BaseButton>
          </NuxtLink>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { 
  ChevronLeft, 
  Upload, 
  X,
  RefreshCw, 
  Image, 
  ThumbsUp, 
  MessageSquare, 
  Share2,
  Link2
} from 'lucide-vue-next'

definePageMeta({
  layout: false,
  middleware: ['auth']
})

const { currentAccountId, currentAccount, fetchCurrentAccount } = useCurrentAccount()
const accounts = ref<any[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const dragover = ref(false)
const uploadProgress = ref(0)
const submitting = ref(false)
const selectedFiles = ref<any[]>([]) // { file: File, preview: string, name: string }

const form = reactive({
  accountId: ''
})

const isFormValid = computed(() => {
  return currentAccountId.value && selectedFiles.value.length > 0
})

const fetchAccounts = async () => {
  try {
    const data = await $fetch<any[]>('/api/accounts')
    accounts.value = data
  } catch (e) {
    console.error('Failed to fetch accounts', e)
  }
}

const handleFileSelect = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (files) addFiles(Array.from(files))
}

const handleDrop = (e: DragEvent) => {
  dragover.value = false
  const files = e.dataTransfer?.files
  if (files) addFiles(Array.from(files))
}

const addFiles = (files: File[]) => {
  const imageFiles = files.filter(f => f.type.startsWith('image/'))
  
  if (imageFiles.length + selectedFiles.value.length > 10) {
    alert('Maximum 10 images par envoi.')
    return
  }

  imageFiles.forEach(file => {
    selectedFiles.value.push({
      file,
      name: file.name,
      preview: URL.createObjectURL(file)
    })
  })
}

const removeFile = (index: number) => {
  const removed = selectedFiles.value.splice(index, 1)[0]
  if (removed.preview) URL.revokeObjectURL(removed.preview)
}

const handleSubmit = async () => {
  if (!isFormValid.value || selectedFiles.value.length === 0) return
  
  submitting.value = true
  uploading.value = true
  uploadProgress.value = 10

  const formData = new FormData()
  formData.append('accountId', String(currentAccountId.value))
  
  selectedFiles.value.forEach(f => {
    formData.append('images', f.file)
  })

  try {
    uploadProgress.value = 40
    await $fetch('/api/posts/bulk-upload', {
      method: 'POST',
      body: formData
    })
    uploadProgress.value = 100
    navigateTo('/dashboard/posts')
  } catch (e) {
    alert('Erreur lors de la création des posts.')
  } finally {
    submitting.value = false
    uploading.value = false
  }
}

onMounted(async () => {
  await fetchAccounts()
  if (currentAccountId.value && !currentAccount.value) {
    await fetchCurrentAccount()
  }
})
</script>

<style scoped>
.create-post-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.upload-container {
  max-width: 800px;
  margin: 0 auto;
}

.upload-info {
  margin-bottom: 2rem;
  text-align: center;
}

.upload-info h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.upload-info p {
  color: var(--text-secondary);
}

.post-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-group label {
  font-weight: 500;
  font-size: 0.9375rem;
}

.custom-select, .custom-textarea {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 1rem;
  outline: none;
  transition: all var(--transition-fast);
}

.custom-select:focus, .custom-textarea:focus {
  border-color: var(--accent-primary);
  background: rgba(255, 255, 255, 0.08);
}

.dropzone {
  border: 2px dashed var(--border-glass);
  border-radius: 1rem;
  padding: 4rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  overflow: hidden;
}

.dropzone:hover, .dropzone.dragover {
  border-color: var(--accent-primary);
  background: rgba(59, 130, 246, 0.03);
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-secondary);
}

.sub-hint {
  font-size: 0.75rem;
  opacity: 0.7;
}

.files-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.file-preview-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-mini-container {
  position: relative;
  aspect-ratio: 1;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid var(--border-glass);
}

.mini-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-file-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: all var(--transition-fast);
}

.remove-file-btn:hover {
  background: var(--accent-error, #ef4444);
  transform: scale(1.1);
}

.file-name {
  font-size: 0.75rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.upload-progress-container {
  margin-top: 1.5rem;
}

.progress-info {
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  color: var(--accent-primary);
}

.progress-bar-bg {
  height: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--accent-primary);
  transition: width 0.3s ease;
}

.hint {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.form-actions {
  padding-top: 1rem;
  border-top: 1px solid var(--border-glass);
  text-align: center;
}

.submit-btn {
  width: 100%;
  margin-bottom: 1rem;
}

.disclaimer {
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.hidden { display: none; }
</style>
