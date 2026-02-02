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

      <div class="creation-grid">
        <!-- Editor Section -->
        <div class="editor-section">
          <BaseCard>
            <form @submit.prevent="handleSubmit" class="post-form">
              <!-- Account Selection -->
              <div class="form-group">
                <label>Compte LinkedIn</label>
                <select v-model="form.linkedinAccountId" class="custom-select" required>
                  <option value="" disabled>Sélectionner un compte</option>
                  <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
                    {{ acc.name }} ({{ acc.type }})
                  </option>
                </select>
                <p v-if="accounts.length === 0" class="hint">
                  Aucun compte connecté. <NuxtLink to="/dashboard/accounts">Connecter un compte</NuxtLink>
                </p>
              </div>

              <!-- Image Upload -->
              <div class="form-group">
                <label>Image du post</label>
                <div 
                  class="dropzone" 
                  :class="{ dragover, hasImage: !!previewUrl }"
                  @dragover.prevent="dragover = true"
                  @dragleave.prevent="dragover = false"
                  @drop.prevent="handleDrop"
                  @click="$refs.fileInput.click()"
                >
                  <input 
                    type="file" 
                    ref="fileInput" 
                    class="hidden" 
                    accept="image/*" 
                    @change="handleFileSelect" 
                  />
                  
                  <div v-if="!previewUrl" class="dropzone-content">
                    <Upload :size="32" />
                    <p>Cliquez ou glissez une image ici</p>
                    <span class="sub-hint">JPG, PNG, WebP (max 10MB)</span>
                  </div>
                  <div v-else class="preview-container">
                    <img :src="previewUrl" alt="Preview" class="image-preview" />
                    <div class="preview-overlay">
                      <RefreshCw :size="24" />
                      <span>Changer l'image</span>
                    </div>
                  </div>
                </div>
                <div v-if="uploading" class="upload-progress">
                  <div class="progress-bar" :style="{ width: uploadProgress + '%' }"></div>
                </div>
              </div>

              <!-- AI Context -->
              <div class="form-group">
                <label>Description pour l'IA (optionnel)</label>
                <textarea 
                  v-model="form.imageDescription" 
                  placeholder="Décrivez ce que vous voulez que l'IA mette en avant dans ce post..."
                  rows="4"
                  class="custom-textarea"
                ></textarea>
                <p class="hint">Utilisé par l'IA pour générer une légende pertinente.</p>
              </div>

              <div class="form-actions">
                <BaseButton 
                  type="submit" 
                  :loading="submitting" 
                  :disabled="!isFormValid"
                  class="submit-btn"
                >
                  Générer et Programmer
                </BaseButton>
                <p class="disclaimer">
                  En cliquant, l'IA générera une légende basée sur votre image et vos paramètres.
                </p>
              </div>
            </form>
          </BaseCard>
        </div>

        <!-- Preview Section -->
        <div class="preview-section">
          <div class="sticky-preview">
            <h3 class="preview-title">Aperçu LinkedIn</h3>
            <div class="linkedin-preview glass">
              <div class="preview-header">
                <div class="preview-avatar"></div>
                <div class="preview-user-meta">
                  <div class="skeleton-line name"></div>
                  <div class="skeleton-line sub"></div>
                </div>
              </div>
              <div class="preview-body">
                <div class="preview-text">
                  <template v-if="form.imageDescription">
                    <span class="context-tag">[Contexte IA]</span> {{ form.imageDescription }}
                  </template>
                  <template v-else>
                    <div class="skeleton-line text"></div>
                    <div class="skeleton-line text short"></div>
                  </template>
                </div>
                <div v-if="previewUrl" class="preview-image">
                  <img :src="previewUrl" alt="Post content" />
                </div>
                <div v-else class="preview-image-placeholder">
                  <Image :size="48" />
                </div>
              </div>
              <div class="preview-footer">
                <div class="footer-action"><ThumbsUp :size="16" /> J'aime</div>
                <div class="footer-action"><MessageSquare :size="16" /> Commenter</div>
                <div class="footer-action"><Share2 :size="16" /> Partager</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { 
  ChevronLeft, 
  Upload, 
  RefreshCw, 
  Image, 
  ThumbsUp, 
  MessageSquare, 
  Share2 
} from 'lucide-vue-next'

definePageMeta({
  layout: false,
  middleware: ['auth']
})

const accounts = ref([])
const uploading = ref(false)
const dragover = ref(false)
const uploadProgress = ref(0)
const previewUrl = ref('')
const submitting = ref(false)

const form = reactive({
  linkedinAccountId: '',
  imageUrl: '',
  imageDescription: ''
})

const isFormValid = computed(() => {
  return form.linkedinAccountId && form.imageUrl
})

const fetchAccounts = async () => {
  try {
    const data = await $fetch('/api/linkedin/accounts')
    accounts.value = data.accounts
  } catch (e) {
    console.error('Failed to fetch accounts', e)
  }
}

const handleFileSelect = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (files?.length) uploadFile(files[0])
}

const handleDrop = (e: DragEvent) => {
  dragover.value = false
  const files = e.dataTransfer?.files
  if (files?.length) uploadFile(files[0])
}

const uploadFile = async (file: File) => {
  if (!file.type.startsWith('image/')) {
    alert('Veuillez sélectionner une image.')
    return
  }

  uploading.value = true
  uploadProgress.value = 0
  
  // Create preview instantly
  previewUrl.value = URL.createObjectURL(file)

  const formData = new FormData()
  formData.append('image', file)

  try {
    const response = await $fetch('/api/uploads/image', {
      method: 'POST',
      body: formData
    })
    form.imageUrl = response.url
  } catch (e) {
    alert("L'upload a échoué.")
  } finally {
    uploading.value = false
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) return
  
  submitting.value = true
  try {
    await $fetch('/api/posts', {
      method: 'POST',
      body: {
        ...form,
        linkedinAccountId: parseInt(form.linkedinAccountId)
      }
    })
    navigateTo('/dashboard/posts')
  } catch (e) {
    alert('Erreur lors de la création du post.')
  } finally {
    submitting.value = false
  }
}

onMounted(fetchAccounts)
</script>

<style scoped>
.create-post-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.back-link:hover {
  color: var(--text-primary);
}

.title {
  font-size: 2rem;
}

.creation-grid {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2.5rem;
  align-items: start;
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
  padding: 3rem 2rem;
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

.preview-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 0.5rem;
  overflow: hidden;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.preview-container:hover .preview-overlay {
  opacity: 1;
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

/* LinkedIn Preview Styling */
.sticky-preview {
  position: sticky;
  top: 100px;
}

.preview-title {
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}

.linkedin-preview {
  border-radius: 0.75rem;
  overflow: hidden;
  background: #ffffff02;
}

.preview-header {
  padding: 1rem;
  display: flex;
  gap: 0.75rem;
}

.preview-avatar {
  width: 40px;
  height: 40px;
  background: #334155;
  border-radius: 50%;
}

.preview-user-meta {
  flex: 1;
}

.skeleton-line {
  height: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.skeleton-line.name { width: 120px; margin-bottom: 6px; }
.skeleton-line.sub { width: 80px; }
.skeleton-line.text { width: 100%; margin-bottom: 8px; }
.skeleton-line.text.short { width: 60%; }

.preview-body {
  padding: 0 1rem 1rem;
}

.preview-text {
  font-size: 0.875rem;
  margin-bottom: 1rem;
  color: #e2e8f0;
}

.context-tag {
  color: var(--accent-primary);
  font-weight: 600;
}

.preview-image {
  margin: 0 -1rem;
  max-height: 300px;
  overflow: hidden;
}

.preview-image img {
  width: 100%;
  display: block;
}

.preview-image-placeholder {
  height: 200px;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.05);
}

.preview-footer {
  display: flex;
  padding: 0.5rem 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.footer-action {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  padding: 0.5rem;
}

.hidden { display: none; }

@media (max-width: 900px) {
  .creation-grid {
    grid-template-columns: 1fr;
  }
}
</style>
