<template>
  <div class="auth-layout">
    <div class="circles">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
    </div>
    <div class="auth-card animate-fade-in">
      <div class="logo-section">
        <div class="logo-icon">LA</div>
        <h1>LinkedIn Automation</h1>
      </div>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow: hidden;
  position: relative;
  background-color: var(--bg-dark);
}

.auth-card {
  width: 100%;
  max-width: 450px;
  background: var(--bg-card);
  backdrop-filter: var(--blur-md);
  border: 1px solid var(--border-glass);
  border-radius: 1.5rem;
  padding: 3rem;
  z-index: 10;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.logo-section {
  text-align: center;
  margin-bottom: 2.5rem;
}

.logo-icon {
  width: 50px;
  height: 50px;
  background: var(--accent-gradient);
  color: white;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  margin: 0 auto 1rem;
  font-size: 1.25rem;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.logo-section h1 {
  font-size: 1.5rem;
  background: linear-gradient(to right, #fff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.circles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
}

.circle-1 {
  width: 300px;
  height: 300px;
  background: rgba(59, 130, 246, 0.15);
  top: -50px;
  left: -50px;
}

.circle-2 {
  width: 350px;
  height: 350px;
  background: rgba(139, 92, 246, 0.15);
  bottom: -50px;
  right: -50px;
}
</style>
