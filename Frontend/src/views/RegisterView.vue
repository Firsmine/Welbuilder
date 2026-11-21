<script setup>
import { useAuthStore } from '@/stores/auth'
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const authStore = useAuthStore()
const name = ref('')
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)

async function handleRegister() {
  errorMessage.value = ''
  loading.value = false
  try {
    await authStore.register(name.value, email.value, password.value)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Registration failed.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- Form -->
  <div class="auth-panel auth-panel--right">
    <div class="auth-card">
      <div class="auth-card__header">
        <h1 class="auth-card__title">Create Account</h1>
        <p class="auth-card__subtitle">Start building your pages today</p>
      </div>

      <form class="auth-card__body" @submit.prevent="handleRegister">
        <div v-if="errorMessage" class="form-error">
          {{ errorMessage }}
        </div>
        <!-- Name field -->
        <div class="form-group">
          <label class="form-label" for="name">Full Name</label>
          <input
            v-model="name"
            class="form-input"
            type="text"
            id="name"
            name="name"
            placeholder="John Doe"
            autocomplete="name"
            required
          />
        </div>

        <!-- Email field with error example -->
        <div class="form-group">
          <label class="form-label" for="email">Email Address</label>
          <input
            v-model="email"
            class="form-input form-input--error"
            type="email"
            id="email"
            name="email"
            placeholder="you@example.com"
            autocomplete="email"
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
            This email address is already registered.
          </span>
        </div>

        <!-- Password field -->
        <div class="form-group">
          <label class="form-label" for="password">Password</label>
          <input
            v-model="password"
            class="form-input"
            type="password"
            id="password"
            name="password"
            placeholder="••••••••"
            autocomplete="new-password"
            required
          />
          <span class="form-hint">Minimum 8 characters</span>
        </div>

        <button class="btn btn--primary btn--full" type="submit" :disabled="loading">
          {{ loading ? 'Creating Account...' : 'Create Account' }}
        </button>
      </form>

      <div class="auth-card__footer">
        <span>Already have an account?</span>
        <router-link to="/login">Sign in</router-link>
      </div>
    </div>
  </div>
</template>
