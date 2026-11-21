import api from '@/services/api'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePageStore = defineStore('page', () => {
  const pages = ref([])
  const selectedPage = ref(null)
  const loading = ref(false)

  // read
  async function fetchPage() {
    loading.value = true
    try {
      const response = await api.get('/pages')
      const result = response.data.data.pages
      pages.value = Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : []
    } catch (error) {
      console.error('Failed to fetch pages', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  // detail
  async function detailPage(slug) {
    loading.value = true
    try {
      const response = await api.get(`/pages/${slug}`)
      pages.value = response.data.data
      return selectedPage.value
    } catch (error) {
      console.error('Detail page not found', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  // create
  async function createPage(formData) {
    try {
      const response = await api.post(`/pages`, formData)
      const newPage = response.data.data
      if (Array.isArray(pages.value)) {
        pages.value.unshift(newPage)
      } else {
        pages.value = [newPage]
      }
      return newPage
    } catch (error) {
      console.error('Failed to create a new page', error)
      throw error
    }
  }
  // create
  async function updatePage(formData, oldSlug) {
    try {
      const response = await api.post(`/pages/${oldSlug}`, formData)
      const updatedPage = response.data.data
      const index = pages.value.findIndex((item) => item.slug === oldSlug)
      if (index !== -1) {
        pages.value[index] = updatedPage
      }
      return updatedPage
    } catch (error) {
      console.error('Failed to create update page', error)
      throw error
    }
  }
  // delete
  async function deletePage(slug) {
    try {
      await api.post(`/pages/${slug}`)
      pages.value = pages.value.filter((item) => item.slug !== slug)
    } catch (error) {
      console.error('Failed to delete page', error)
      throw error
    }
  }

  return { pages, loading, fetchPage, detailPage, createPage, updatePage, deletePage }
})
