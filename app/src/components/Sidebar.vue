<template>
  <aside class="sidebar">
    <div class="sidebar-brand">
      <div class="sidebar-brand-mark">ICICLE</div>
      <div class="sidebar-brand-copy">AI Resource Catalog</div>
    </div>

    <nav class="sidebar-nav">
      <div class="sidebar-section-label">Public catalog</div>
      <RouterLink to="/" class="sidebar-link" :class="{ active: $route.path === '/' }">
        <IconHomeSearch :size="20" stroke-width="1.8" />
        <span>Home</span>
      </RouterLink>

      <RouterLink to="/search" class="sidebar-link" :class="{ active: $route.path === '/search' }">
        <IconSearch :size="20" stroke-width="1.8" />
        <span>Search</span>
      </RouterLink>

      <RouterLink to="/#browse-catalog" class="sidebar-link">
        <IconCategory :size="20" stroke-width="1.8" />
        <span>Browse</span>
      </RouterLink>

      <RouterLink to="/#resource-stories" class="sidebar-link">
        <IconRoute :size="20" stroke-width="1.8" />
        <span>Resource Stories</span>
      </RouterLink>

      <RouterLink to="/#catalog-about" class="sidebar-link">
        <IconHelpCircle :size="20" stroke-width="1.8" />
        <span>About &amp; Help</span>
      </RouterLink>
    </nav>

  </aside>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import {
  IconCategory,
  IconHelpCircle,
  IconHomeSearch,
  IconRoute,
  IconSearch,
} from '@tabler/icons-vue'
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: rgba(255, 253, 249, 0.94);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  z-index: 100;
  backdrop-filter: blur(12px);
}

.sidebar-brand {
  display: block;
  padding: 22px 24px 20px;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-brand-mark { color: var(--color-primary); font-size: 1.25rem; font-weight: 800; letter-spacing: .04em; }
.sidebar-brand-copy { margin-top: 2px; color: var(--color-text-muted); font-size: .72rem; letter-spacing: .04em; }

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
}

.sidebar-section-label {
  font-size: 0.67rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding: 18px 12px 8px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 12px;
  color: var(--color-text-secondary);
  font-weight: 500;
  font-size: 0.92rem;
  transition: all var(--transition);
  text-decoration: none;
  border: 1px solid transparent;
}

.sidebar-link:hover {
  background: rgba(255, 255, 255, 0.72);
  color: var(--color-text);
  border-color: var(--color-border);
}

.sidebar-link.active {
  background: linear-gradient(180deg, #f4f7ff 0%, var(--color-primary-bg) 100%);
  color: var(--color-primary);
  font-weight: 600;
  border-color: rgba(var(--color-primary-rgb), 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.sidebar-footer {
  padding: 18px;
  border-top: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.4);
}

.sidebar-portal-error {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 11px;
  border: 1px solid rgba(180, 83, 9, 0.22);
  border-radius: 10px;
  color: #92400e;
  background: #fff7ed;
  font-size: 0.78rem;
  line-height: 1.35;
}

.sidebar-portal-error strong,
.sidebar-portal-error span {
  display: block;
}

.sidebar-portal-error span {
  margin-top: 2px;
  color: #9a5b22;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sidebar-user-info {
  flex: 1;
  min-width: 0;
}

.sidebar-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(180deg, #f4f7ff 0%, var(--color-primary-bg) 100%);
  color: var(--color-primary);
  font-weight: 700;
  font-size: 0.82rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid rgba(47, 78, 162, 0.12);
}

.sidebar-user-name {
  font-weight: 600;
  font-size: 0.88rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-user-role {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.sidebar-logout {
  border: none;
  background: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
  flex-shrink: 0;
}

.sidebar-portal-managed {
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  flex-shrink: 0;
}

.sidebar-logout:hover {
  color: var(--color-danger);
  background: var(--color-danger-bg);
}

.sidebar-login-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  border: 1px dashed var(--color-border-strong);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
  color: var(--color-text-secondary);
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
}

.sidebar-login-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.login-modal {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 50px rgba(90, 80, 130, 0.18);
  overflow: hidden;
}

.login-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid var(--color-border);
}

.login-modal-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--color-primary);
}

.login-modal-body {
  padding: 22px;
}

.login-desc {
  font-size: 0.82rem;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin-bottom: 16px;
}

.login-desc a {
  color: var(--color-primary);
  text-decoration: underline;
}

.remember-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 12px 0 4px;
  font-size: 0.84rem;
  color: var(--color-text-secondary);
}

.remember-row input {
  width: 16px;
  height: 16px;
}

.login-error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--color-danger-bg);
  color: var(--color-danger);
  font-size: 0.8rem;
  margin-bottom: 14px;
}

.login-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1.5px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-muted);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.login-input-wrap:focus-within {
  border-color: var(--color-primary);
  color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(47, 78, 162, 0.08);
}

.login-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 10px 0;
  font-size: 0.88rem;
  background: transparent;
  color: var(--color-text);
}

.login-input::placeholder {
  color: #aeb5c2;
}

.btn-login {
  width: 100%;
  padding: 11px;
  margin-top: 16px;
  background: linear-gradient(180deg, var(--color-primary-light) 0%, var(--color-primary) 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-login:hover:not(:disabled) {
  opacity: 0.94;
  transform: translateY(-1px);
}

.btn-login:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
