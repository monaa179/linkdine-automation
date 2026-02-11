<template>
  <NuxtLayout name="dashboard">
    <div class="gallery-page">
      <div class="page-header">
        <NuxtLink to="/dashboard/accounts" class="back-link">
          <ChevronLeft :size="20" />
          Retour aux comptes
        </NuxtLink>
        <h1 class="title">Galerie : {{ account?.name }}</h1>
        <p class="subtitle">Uploadez vos photos ici. Cliquez sur "Rédiger les captions" pour générer les textes via l'IA.</p>
      </div>

      <!-- Upload Section -->
      <div class="upload-section">
        <BaseCard>
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
              <p>Cliquez ou glissez vos images pour les ajouter à la galerie</p>
              <span class="sub-hint">JPG, PNG, WebP (max 10MB par image)</span>
            </div>
          </div>

          <!-- Selected Files Preview & Upload Button -->
          <div v-if="selectedFiles.length > 0" class="upload-actions animate-fade-in">
            <div class="files-preview-grid">
              <div v-for="(file, index) in selectedFiles" :key="index" class="file-preview-item">
                <div class="preview-mini-container">
                  <img :src="file.preview" alt="Preview" class="mini-preview" />
                  <button type="button" class="remove-file-btn" @click.stop="removeFile(index)">
                    <X :size="14" />
                  </button>
                </div>
              </div>
            </div>
            
            <div class="actions-row">
              <BaseButton 
                @click="uploadImages" 
                :loading="uploading" 
                size="lg"
                class="upload-btn"
              >
                Uploader {{ selectedFiles.length }} images
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Gallery Grid -->
      <div class="gallery-section">
        <div class="section-header">
          <h2>Images en attente ({{ galleryPosts.length }})</h2>
          <BaseButton 
            v-if="galleryPosts.length > 0"
            variant="primary" 
            @click="triggerCaptionGeneration"
            :loading="generating"
          >
            <Sparkles :size="18" />
            Rédiger les captions
          </BaseButton>
        </div>

        <div v-if="loading" class="loading-grid">
          <div v-for="i in 4" :key="i" class="skeleton-card glass"></div>
        </div>

        <div v-else-if="galleryPosts.length === 0" class="empty-gallery glass">
          <Image :size="48" />
          <p>Votre galerie est vide. Uploadez des photos pour commencer.</p>
        </div>

        <div v-else class="gallery-grid">
          <div v-for="post in galleryPosts" :key="post.id" class="gallery-item glass">
            <img :src="post.imageUrl" alt="Gallery image" class="gallery-img" />
            <div class="item-overlay">
              <div class="overlay-top">
                <button 
                  class="context-btn" 
                  @click="openContextModal(post)"
                  :class="{ 'has-context': post.imageContext }"
                  title="Ajouter un contexte"
                >
                  <Edit3 :size="16" />
                </button>
                <button 
                  class="generate-btn" 
                  @click="generateSingleCaption(post.id)"
                  :disabled="post.generating"
                  title="Générer la caption"
                >
                  <Sparkles v-if="!post.generating" :size="18" />
                  <div v-else class="spinner-small"></div>
                </button>
                <button class="delete-btn" @click="deletePost(post.id)">
                  <Trash2 :size="18" />
                </button>
              </div>
              <div class="overlay-bottom">
                <button 
                  class="modules-trigger-btn" 
                  @click="openModulesModal(post)"
                  :class="{ 'has-modules': post.moduleIds?.length > 0 }"
                  title="Gérer les modules"
                >
                  <component :is="Package" :size="16" v-if="post.moduleIds?.length === 0" />
                  <span v-else class="count-badge">{{ post.moduleIds.length }}</span>
                  <span class="btn-text">Modules</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modules Selection Modal -->
      <BaseModal 
        v-if="modulesModal.show" 
        title="Modules associés" 
        @close="closeModulesModal"
      >
        <div class="modules-form">
          <p class="context-hint">Sélectionnez les modules à appliquer pour la génération de la caption de cette image.</p>
          
          <BaseCheckboxGroup
            v-model="modulesModal.selectedIds"
            :options="modules.map(m => ({ label: m.name, value: m.id.toString() }))"
            label="Modules disponibles"
          />

          <div class="context-actions">
            <BaseButton 
              variant="primary" 
              @click="saveModules"
              :loading="modulesModal.saving"
            >
              Enregistrer
            </BaseButton>
          </div>
        </div>
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

      <!-- Success Modal -->
      <BaseSuccessModal
        :show="successModal.show"
        :title="successModal.title"
        :message="successModal.message"
        :button-text="successModal.buttonText"
        @close="successModal.show = false"
      />

      <!-- Context Modal -->
      <BaseModal 
        v-if="contextModal.show" 
        title="Contexte de l'image" 
        @close="closeContextModal"
      >
        <div class="context-form">
          <p class="context-hint">Ajoutez des informations spécifiques sur cette image pour améliorer la génération de caption.</p>
          <textarea 
            v-model="contextModal.text"
            class="context-textarea" 
            rows="6"
            placeholder="Ex: Photo prise lors de notre événement de lancement, mettre en avant l'ambiance conviviale et professionnelle..."
          ></textarea>
          <div class="context-actions">
            <BaseButton 
              v-if="contextModal.text"
              variant="secondary" 
              @click="clearContext"
            >
              Effacer
            </BaseButton>
            <BaseButton 
              variant="primary" 
              @click="saveContext"
              :loading="contextModal.saving"
            >
              Enregistrer
            </BaseButton>
          </div>
        </div>
      </BaseModal>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { 
  ChevronLeft, 
  Upload, 
  X, 
  Sparkles, 
  Image, 
  Trash2,
  Edit3,
  Package 
} from 'lucide-vue-next'
import BaseCheckboxGroup from '~/components/BaseCheckboxGroup.vue'
import BaseConfirmModal from '~/components/BaseConfirmModal.vue'
import BaseSuccessModal from '~/components/BaseSuccessModal.vue'

definePageMeta({
  layout: false,
  middleware: ['auth']
})

const route = useRoute()
const accountId = parseInt(route.params.accountId as string)

const account = ref<any>(null)
const galleryPosts = ref<any[]>([])
const modules = ref<any[]>([])
const loading = ref(true)
const uploading = ref(false)
const generating = ref(false)
const dragover = ref(false)
const selectedFiles = ref<any[]>([])
const fileInput = ref<HTMLInputElement | null>(null)

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

// Success Modal State
const successModal = reactive({
  show: false,
  title: 'Succès !',
  message: '',
  buttonText: 'OK'
})

// Context Modal State
const contextModal = reactive({
  show: false,
  postId: null as number | null,
  text: '',
  saving: false
})

// Modules Modal State
const modulesModal = reactive({
  show: false,
  postId: null as number | null,
  selectedIds: [] as string[],
  saving: false
})

const fetchAccountData = async () => {
  loading.value = true
  try {
    account.value = await $fetch(`/api/accounts/${accountId}`)
    modules.value = await $fetch('/api/modules')
    const allPosts = await $fetch<any[]>(`/api/posts?accountId=${accountId}`)
    // Gallery = posts without AI caption
    galleryPosts.value = allPosts
      .filter(p => !p.aiCaption)
      .map(p => ({
        ...p,
        generating: false,
        moduleIds: (p.modules || []).map((m: any) => m.id)
      }))
  } catch (e) {
    console.error('Failed to fetch account data', e)
  } finally {
    loading.value = false
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

const uploadImages = async () => {
  if (selectedFiles.value.length === 0) return
  
  uploading.value = true
  const formData = new FormData()
  formData.append('accountId', String(accountId))
  selectedFiles.value.forEach(f => formData.append('images', f.file))

  try {
    await $fetch('/api/posts/bulk-upload', {
      method: 'POST',
      body: formData
    })
    selectedFiles.value = []
    await fetchAccountData()
  } catch (e) {
    alert('Erreur lors de l\'upload des images.')
  } finally {
    uploading.value = false
  }
}

const triggerCaptionGeneration = () => {
  confirmModal.title = 'Rédiger les captions'
  confirmModal.message = 'Voulez-vous lancer la rédaction des captions pour toutes les images de la galerie ? Cela utilisera l\'IA pour analyser chaque photo.'
  confirmModal.variant = 'primary'
  confirmModal.confirmText = 'Lancer la rédaction'
  confirmModal.onConfirm = async () => {
    confirmModal.loading = true
    generating.value = true
    try {
      await $fetch(`/api/accounts/${accountId}/generate-captions`, {
        method: 'POST'
      })
      confirmModal.show = false
      await fetchAccountData()
      
      // Show success modal
      successModal.title = 'Rédaction lancée avec succès !'
      successModal.message = 'Les images apparaîtront dans le Feed une fois terminées.'
      successModal.buttonText = 'OK'
      successModal.show = true
    } catch (e) {
      alert('Erreur lors du lancement de la génération.')
    } finally {
      generating.value = false
      confirmModal.loading = false
    }
  }
  confirmModal.show = true
}

const generateSingleCaption = (postId: number) => {
  confirmModal.title = 'Générer la caption'
  confirmModal.message = 'Vous vous apprêtez à générer une caption pour cette image via l\'IA. Êtes-vous sûr ?'
  confirmModal.variant = 'primary'
  confirmModal.confirmText = 'Générer'
  confirmModal.onConfirm = async () => {
    const post = galleryPosts.value.find(p => p.id === postId)
    if (!post) return
    
    confirmModal.loading = true
    post.generating = true
    
    try {
      await $fetch(`/api/posts/${postId}/generate-caption`, {
        method: 'POST'
      })
      
      confirmModal.show = false
      
      // Show success modal
      successModal.title = 'Caption en cours de génération !'
      successModal.message = 'L\'image apparaîtra dans le Feed une fois la caption générée.'
      successModal.buttonText = 'OK'
      successModal.show = true
      
      // Refresh data to remove the image from gallery
      await fetchAccountData()
    } catch (e: any) {
      alert(e.data?.statusMessage || 'Erreur lors de la génération de la caption.')
      post.generating = false
      confirmModal.show = false
    } finally {
      confirmModal.loading = false
    }
  }
  confirmModal.show = true
}

const deletePost = (id: number) => {
  confirmModal.title = 'Supprimer l\'image'
  confirmModal.message = 'Êtes-vous sûr de vouloir supprimer cette image de la galerie ?'
  confirmModal.variant = 'danger'
  confirmModal.confirmText = 'Supprimer'
  confirmModal.onConfirm = async () => {
    confirmModal.loading = true
    try {
      await $fetch(`/api/posts/${id}`, { method: 'DELETE' })
      await fetchAccountData()
      confirmModal.show = false
    } catch (e) {
      alert('Erreur lors de la suppression.')
    } finally {
      confirmModal.loading = false
    }
  }
  confirmModal.show = true
}

const openModulesModal = (post: any) => {
  modulesModal.postId = post.id
  modulesModal.selectedIds = (post.moduleIds || []).map((id: number) => id.toString())
  modulesModal.show = true
}

const closeModulesModal = () => {
  modulesModal.show = false
  modulesModal.postId = null
  modulesModal.selectedIds = []
}

const saveModules = async () => {
  if (modulesModal.postId === null) return
  
  modulesModal.saving = true
  try {
    const moduleIds = modulesModal.selectedIds.map(id => parseInt(id))
    await $fetch(`/api/posts/${modulesModal.postId}`, {
      method: 'PATCH',
      body: { moduleIds }
    })
    
    // Update local state
    const post = galleryPosts.value.find(p => p.id === modulesModal.postId)
    if (post) {
      post.moduleIds = moduleIds
    }
    
    closeModulesModal()
  } catch (e) {
    console.error('Failed to save modules', e)
    alert('Erreur lors de la sauvegarde des modules')
  } finally {
    modulesModal.saving = false
  }
}

const openContextModal = (post: any) => {
  contextModal.postId = post.id
  contextModal.text = post.imageContext || ''
  contextModal.show = true
}

const closeContextModal = () => {
  contextModal.show = false
  contextModal.postId = null
  contextModal.text = ''
}

const saveContext = async () => {
  if (contextModal.postId === null) return
  
  contextModal.saving = true
  try {
    await $fetch(`/api/posts/${contextModal.postId}`, {
      method: 'PATCH',
      body: { imageContext: contextModal.text || null }
    })
    
    // Update local state
    const post = galleryPosts.value.find(p => p.id === contextModal.postId)
    if (post) {
      post.imageContext = contextModal.text || null
    }
    
    closeContextModal()
  } catch (e) {
    console.error('Failed to save context', e)
    alert('Erreur lors de la sauvegarde du contexte')
  } finally {
    contextModal.saving = false
  }
}

const clearContext = async () => {
  if (contextModal.postId === null) return
  
  contextModal.saving = true
  try {
    await $fetch(`/api/posts/${contextModal.postId}`, {
      method: 'PATCH',
      body: { imageContext: null }
    })
    
    // Update local state
    const post = galleryPosts.value.find(p => p.id === contextModal.postId)
    if (post) {
      post.imageContext = null
    }
    
    closeContextModal()
  } catch (e) {
    console.error('Failed to clear context', e)
    alert('Erreur lors de la suppression du contexte')
  } finally {
    contextModal.saving = false
  }
}

onMounted(fetchAccountData)
</script>

<style scoped>
.gallery-page {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: var(--accent-primary);
}

.title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-secondary);
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

.upload-actions {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.files-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 1rem;
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
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.remove-file-btn:hover {
  background: #ef4444;
}

.actions-row {
  display: flex;
  justify-content: center;
}

.upload-btn {
  min-width: 250px;
}

.gallery-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.gallery-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 1rem;
  overflow: hidden;
  padding: 0 !important;
}

.gallery-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.75rem;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.gallery-item:hover .item-overlay {
  opacity: 1;
}

.overlay-top {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 0.5rem;
}

.overlay-bottom {
  display: flex;
  align-items: flex-end;
}

.generate-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.generate-btn:hover:not(:disabled) {
  transform: scale(1.1);
  background: rgba(59, 130, 246, 1);
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.8);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.delete-btn:hover {
  transform: scale(1.1);
}

.modules-trigger-btn {
  width: 100%;
  padding: 0.625rem;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  color: var(--text-primary);
  font-size: 0.8125rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  backdrop-filter: blur(10px);
}

.modules-trigger-btn:hover {
  border-color: var(--accent-primary);
  background: rgba(15, 23, 42, 1);
  transform: translateY(-2px);
}

.modules-trigger-btn.has-modules {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
}

.count-badge {
  background: var(--accent-primary);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modules-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.context-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.context-btn:hover {
  transform: scale(1.1);
  background: rgba(255, 255, 255, 0.2);
}

.context-btn.has-context {
  background: rgba(139, 92, 246, 0.8);
}

.context-btn.has-context:hover {
  background: rgba(139, 92, 246, 1);
}

.context-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.context-hint {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0;
}

.context-textarea {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  border-radius: 0.75rem;
  color: var(--text-primary);
  padding: 0.75rem;
  width: 100%;
  outline: none;
  font-size: 0.9375rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s ease;
}

.context-textarea:focus {
  border-color: var(--accent-primary);
}

.context-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.spinner-small {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-gallery {
  padding: 4rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: var(--text-secondary);
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.skeleton-card {
  height: 200px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

.hidden { display: none; }
</style>
