<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="modal-overlay" @click.self="cancel">
        <div class="confirm-container glass-premium animate-pop">
          <div class="status-icon" :class="variant">
            <template v-if="variant === 'danger'"><AlertTriangle :size="32" /></template>
            <template v-else-if="variant === 'warning'"><AlertCircle :size="32" /></template>
            <template v-else-if="variant === 'success'"><CheckCircle2 :size="32" /></template>
            <template v-else><HelpCircle :size="32" /></template>
          </div>

          <div class="content">
            <h3 class="title">{{ title }}</h3>
            <p class="message">{{ message }}</p>
          </div>

          <div class="actions">
            <button class="btn btn-secondary" @click="cancel">
              {{ cancelText }}
            </button>
            <button class="btn" :class="'btn-' + variant" @click="confirm" :disabled="loading">
              <span v-if="loading" class="spinner"></span>
              <span v-else>{{ confirmText }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { AlertTriangle, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-vue-next'

const props = defineProps({
  show: { type: Boolean, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  variant: { type: String, default: 'primary' }, // primary, danger, success, warning
  confirmText: { type: String, default: 'Confirmer' },
  cancelText: { type: String, default: 'Annuler' },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['confirm', 'cancel'])

const confirm = () => emit('confirm')
const cancel = () => emit('cancel')
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(8, 10, 15, 0.7);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.confirm-container {
  width: 100%;
  max-width: 420px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
  border-radius: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 
    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
    0 25px 50px -12px rgba(0, 0, 0, 0.8);
}

.status-icon {
  width: 72px;
  height: 72px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  position: relative;
}

.status-icon::after {
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: 28px;
  opacity: 0.15;
}

.status-icon.primary { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
.status-icon.primary::after { background: #3b82f6; }

.status-icon.danger { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
.status-icon.danger::after { background: #ef4444; }

.status-icon.warning { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
.status-icon.warning::after { background: #f59e0b; }

.status-icon.success { color: #10b981; background: rgba(16, 185, 129, 0.1); }
.status-icon.success::after { background: #10b981; }

.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  letter-spacing: -0.02em;
}

.message {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  width: 100%;
}

.btn {
  padding: 0.875rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9375rem;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.btn-primary { background: #3b82f6; color: white; }
.btn-primary:hover { background: #2563eb; transform: translateY(-2px); box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4); }

.btn-danger { background: #ef4444; color: white; }
.btn-danger:hover { background: #dc2626; transform: translateY(-2px); box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4); }

.btn-success { background: #10b981; color: white; }
.btn-success:hover { background: #059669; transform: translateY(-2px); box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); }

.btn-warning { background: #f59e0b; color: white; }
.btn-warning:hover { background: #d97706; transform: translateY(-2px); box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4); }

.btn:active { transform: translateY(0) scale(0.98); }

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s infinite linear;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.animate-pop {
  animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.9) translateY(20px); filter: blur(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
