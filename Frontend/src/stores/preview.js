import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'

export const usePreviewStore = defineStore('preview', () => {
  const page = ref(null)
  const loading = ref(false)
  const error = ref('')
  // display sections according position
  const sections = computed(() => {
    return [...(page.value?.sections || [])].sort((a, b) => Number(a.position) - Number(b.position))
  })
  // get page detail
  async function fetchPreview(slug) {
    loading.value = true
    error.value = ''
    try {
      const response = await api.get(`/itineraries/${slug}`)
      page.value = response.data.data
      return page.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load preview'
      console.error('Failed to fetch preview:', err.response?.data || err)
      throw err
    } finally {
      loading.value = false
    }
  }
  // clear previous preview data
  function clearPreview() {
    page.value = null
    error.value = ''
  }
  return {
    page,
    sections,
    loading,
    error,
    fetchPreview,
    clearPreview,
  }
})
