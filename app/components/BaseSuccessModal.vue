<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click="handleClose">
        <div class="modal-container" @click.stop>
          <div class="success-icon-wrapper">
            <div class="success-icon-bg">
              <CheckCircle2 :size="48" class="success-icon" />
            </div>
          </div>
          
          <h2 class="modal-title">{{ title }}</h2>
          <p class="modal-message">{{ message }}</p>
          
          <BaseButton 
            variant="primary" 
            size="lg" 
            block
            @click="handleClose"
          >
            {{ buttonText }}
          </BaseButton>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { CheckCircle2 } from 'lucide-vue-next'

interface Props {
  show: boolean
  title?: string
  message?: string
  buttonText?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Succès !',
  message: 'L\'opération a été effectuée avec succès.',
  buttonText: 'OK'
})

const emit = defineEmits<{
  close: []
}>()

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-container {
  background: linear-gradient(
    135deg,
    rgba(30, 41, 59, 0.95) 0%,
    rgba(15, 23, 42, 0.95) 100%
  );
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;
  padding: 2.5rem 2rem;
  max-width: 420px;
  width: 100%;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  text-align: center;
}

.success-icon-wrapper {
  margin-bottom: 0.5rem;
}

.success-icon-bg {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 0 0 8px rgba(16, 185, 129, 0.1),
    0 0 0 16px rgba(16, 185, 129, 0.05),
    0 8px 32px rgba(16, 185, 129, 0.3);
  animation: successPulse 2s ease-in-out infinite;
}

.success-icon {
  color: white;
  animation: successBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.modal-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.modal-message {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
  max-width: 340px;
}

/* Animations */
@keyframes successPulse {
  0%, 100% {
    box-shadow: 
      0 0 0 8px rgba(16, 185, 129, 0.1),
      0 0 0 16px rgba(16, 185, 129, 0.05),
      0 8px 32px rgba(16, 185, 129, 0.3);
  }
  50% {
    box-shadow: 
      0 0 0 12px rgba(16, 185, 129, 0.15),
      0 0 0 24px rgba(16, 185, 129, 0.08),
      0 12px 40px rgba(16, 185, 129, 0.4);
  }
}

@keyframes successBounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
}

@media (max-width: 640px) {
  .modal-container {
    padding: 2rem 1.5rem;
  }
  
  .success-icon-bg {
    width: 80px;
    height: 80px;
  }
  
  .success-icon {
    width: 40px;
    height: 40px;
  }
  
  .modal-title {
    font-size: 1.5rem;
  }
  
  .modal-message {
    font-size: 0.9375rem;
  }
}
</style>
