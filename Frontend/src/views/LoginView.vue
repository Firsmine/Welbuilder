<script setup>
import { useAuthStore } from '@/stores/auth'
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)

async function handleLogin() {
  errorMessage.value = ''
  loading.value = false
  try {
    await authStore.register(email.value, password.value)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Login failed.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- Form -->
  <div class="auth-panel">
    <div class="auth-card">
      <div class="auth-card__header">
        <h1 class="auth-card__title">Sign In</h1>
        <p class="auth-card__subtitle">Enter your credentials to continue</p>
      </div>

      <form class="auth-card__body" @submit.prevent="handleLogin">
        <div v-if="errorMessage" class="form-error">
          {{ errorMessage }}
        </div>
        <!-- Email field -->
        <div class="form-group">
          <label class="form-label" for="email">Email Address</label>
          <input
            v-model="email"
            class="form-input"
            type="email"
            id="email"
            name="email"
            placeholder="you@example.com"
            autocomplete="email"
            required
          />
        </div>

        <!-- Password field with error example -->
        <div class="form-group">
          <label class="form-label" for="password">Password</label>
          <input
            v-model="password"
            class="form-input form-input--error"
            type="password"
            id="password"
            name="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
          <span class="form-error" v-if="errorMessage">
            <svg
              width="13"
              height="13"
              viewBox="0 0 13 13"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="6.5" cy="6.5" r="5.5" stroke="#c0392b" stroke-width="1.5" />
              <path d="M6.5 4v3" stroke="#c0392b" stroke-width="1.5" stroke-linecap="square" />
              <circle cx="6.5" cy="9" r="0.7" fill="#c0392b" />
            </svg>
            The password you entered is incorrect.
          </span>
        </div>

        <button class="btn btn--primary btn--full" type="button">
          {{ loading ? 'Signing In...' : 'Sign In' }}
        </button>
      </form>

      <div class="auth-card__footer">
        <span>Don't have an account?</span>
        <router-link to="/register">Create one</router-link>
      </div>
    </div>
  </div>
</template>
