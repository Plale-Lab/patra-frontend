<template>
  <div class="login-page">
    <div class="login-card">
      <!-- Brand -->
      <div class="login-brand">
        <div class="brand-icon">
          <IconDatabase :size="28" stroke-width="2" />
        </div>
        <h1>Patra Knowledge Base</h1>
        <p>AI/ML Model Accountability Platform</p>
      </div>

      <!-- Tabs -->
      <div class="login-tabs">
        <button class="login-tab" :class="{ active: mode === 'login' }" @click="switchMode('login')">Sign In</button>
        <button class="login-tab" :class="{ active: mode === 'signup' }" @click="switchMode('signup')">Create Account</button>
      </div>

      <!-- Error -->
      <div class="login-error" v-if="auth.error">
        <IconAlertTriangle :size="16" stroke-width="1.8" />
        {{ auth.error }}
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group" v-if="mode === 'signup'">
          <label class="form-label">Full Name</label>
          <div class="input-wrapper">
            <IconUser :size="18" stroke-width="1.8" />
            <input class="login-input" v-model="form.name" placeholder="Your full name" autocomplete="name" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <div class="input-wrapper">
            <IconMail :size="18" stroke-width="1.8" />
            <input class="login-input" type="email" v-model="form.email" placeholder="name@example.com" autocomplete="email" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <div class="input-wrapper">
            <IconLock :size="18" stroke-width="1.8" />
            <input class="login-input" :type="showPw ? 'text' : 'password'" v-model="form.password" placeholder="••••••••" autocomplete="current-password" />
            <button type="button" class="pw-toggle" @click="showPw = !showPw">
              <component :is="showPw ? IconEyeOff : IconEye" :size="16" stroke-width="1.8" />
            </button>
          </div>
        </div>

        <button class="btn-login" type="submit" :disabled="!canSubmit || auth.loading">
          {{ auth.loading ? 'Please wait…' : (mode === 'login' ? 'Sign In' : 'Create Account') }}
        </button>
      </form>

      <!-- Demo Credentials -->
      <div class="demo-section">
        <div class="demo-label">Demo Accounts</div>
        <div class="demo-creds">
          <button class="demo-btn" @click="fillDemo('admin@patra.io', 'admin123')">
            <span class="demo-role admin">Admin</span>
            <span>admin@patra.io</span>
          </button>
          <button class="demo-btn" @click="fillDemo('alice@lab.edu', 'alice123')">
            <span class="demo-role user">User</span>
            <span>alice@lab.edu</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import {
  IconDatabase, IconUser, IconMail, IconLock,
  IconEye, IconEyeOff, IconAlertTriangle,
} from '@tabler/icons-vue'

const router = useRouter()
const auth = useAuthStore()
const mode = ref('login')
const showPw = ref(false)
const form = reactive({ name: '', email: '', password: '' })

const canSubmit = computed(() => {
  if (!form.email || !form.password) return false
  if (mode.value === 'signup' && !form.name) return false
  return true
})

function switchMode(m) {
  mode.value = m
  auth.error = null
}

function fillDemo(email, password) {
  form.email = email
  form.password = password
  mode.value = 'login'
  auth.error = null
}

async function handleSubmit() {
  let ok = false
  if (mode.value === 'login') {
    ok = await auth.login(form.email, form.password)
  } else {
    ok = await auth.signup(form.name, form.email, form.password)
  }
  if (ok) router.push('/')
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #f0eff6 0%, #e8e6f0 50%, #f5f3f9 100%);
  padding: 20px;
}

.login-card {
  width: 100%; max-width: 420px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 40px rgba(90, 80, 130, .1), 0 1px 3px rgba(0,0,0,.04);
  padding: 40px 36px 32px;
}

.login-brand {
  text-align: center; margin-bottom: 28px;
}
.brand-icon {
  width: 56px; height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #6a5acd, #7c6ee0);
  color: #fff;
  display: inline-flex; align-items: center; justify-content: center;
  margin-bottom: 14px;
}
.login-brand h1 {
  font-size: 1.35rem; font-weight: 800; color: #1a1630;
  margin: 0 0 4px;
}
.login-brand p {
  font-size: .82rem; color: #8e8a9e; margin: 0;
}

.login-tabs {
  display: flex; gap: 0; margin-bottom: 24px;
  border: 1px solid #e8e6f0; border-radius: 10px;
  overflow: hidden;
}
.login-tab {
  flex: 1; padding: 10px; border: none; background: transparent;
  font-size: .88rem; font-weight: 600; color: #8e8a9e;
  cursor: pointer; transition: all .15s;
}
.login-tab.active {
  background: #6a5acd; color: #fff;
}

.login-error {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; border-radius: 8px;
  background: #fef2f2; color: #dc2626;
  font-size: .82rem; font-weight: 500;
  margin-bottom: 16px;
}

.login-form { display: flex; flex-direction: column; gap: 16px; }

.input-wrapper {
  display: flex; align-items: center; gap: 10px;
  padding: 0 14px; border: 1.5px solid #e8e6f0;
  border-radius: 10px; transition: border-color .15s;
  color: #8e8a9e;
}
.input-wrapper:focus-within { border-color: #6a5acd; color: #6a5acd; }

.login-input {
  flex: 1; border: none; outline: none;
  padding: 12px 0; font-size: .92rem;
  background: transparent; color: #1a1630;
}
.login-input::placeholder { color: #c0bcd0; }

.pw-toggle {
  border: none; background: none; color: inherit; cursor: pointer;
  padding: 4px; display: flex;
}

.btn-login {
  width: 100%; padding: 13px;
  background: linear-gradient(135deg, #6a5acd, #7c6ee0);
  color: #fff; border: none; border-radius: 10px;
  font-size: .95rem; font-weight: 700;
  cursor: pointer; transition: all .15s;
  margin-top: 4px;
}
.btn-login:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(106, 90, 205, .35);
}
.btn-login:disabled { opacity: .55; cursor: not-allowed; }

.demo-section {
  margin-top: 24px; padding-top: 20px;
  border-top: 1px solid #e8e6f0;
}
.demo-label {
  font-size: .72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .6px; color: #8e8a9e; margin-bottom: 10px; text-align: center;
}
.demo-creds { display: flex; flex-direction: column; gap: 6px; }
.demo-btn {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 14px; border: 1px solid #e8e6f0; border-radius: 8px;
  background: #fafafe; cursor: pointer; font-size: .82rem; color: #4a4660;
  transition: all .15s;
}
.demo-btn:hover { border-color: #6a5acd; background: #f5f3fa; }
.demo-role {
  padding: 2px 8px; border-radius: 6px;
  font-size: .72rem; font-weight: 700;
}
.demo-role.admin { background: #6a5acd22; color: #6a5acd; }
.demo-role.user { background: #d4edda; color: #28a745; }
</style>
