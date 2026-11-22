import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'

export const useBuilderStore = defineStore('builder', () => {
  const page = ref(null)
  const templates = ref([])
  const selectedTemplate = ref('')
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')

  async function fetchPage(slug) {
    loading.value = true
    error.value = ''
    try {
      const response = await api.get(`/pages/${slug}`)
      page.value = response.data.data
      return page.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load page'
      throw err
    } finally {
      loading.value = false
    }
  }

  // read template
  async function fetchTemplates() {
    try {
      const response = await api.get('/templates')
      templates.value = response.data.data.templates
      return templates.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load templates'
      throw err
    }
  }

  // detail template
  async function fetchTemplate(slug) {
    try {
      const response = await api.get(`/templates/${slug}`)
      return response.data.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load template'
      throw err
    }
  }

  // create section
  async function addSection(slug, payload) {
    saving.value = true
    error.value = ''
    try {
      const response = await api.post(`/pages/${slug}/sections`, payload)
      const newSection = response.data.data
      page.value.sections.push(newSection)
      return newSection
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to add section'
      throw err
    } finally {
      saving.value = false
    }
  }

  // update section
  async function updateSectionFields(slug, sectionId, payload) {
    saving.value = true
    error.value = ''
    try {
      const response = await api.put(`/pages/${slug}/sections/${sectionId}/fields`, payload)
      const updatedSection = response.data.data
      const index = page.value.sections.findIndex((section) => section.id === sectionId)
      if (index !== -1) {
        page.value.sections[index] = updatedSection
      }
      return updatedSection
    } catch (err) {
      console.error('Update section error: ', err.response?.data)
      error.value = err.response?.data?.message || 'Failed to update section'
      throw err
    } finally {
      saving.value = false
    }
  }

  // reorder section
  async function reorderSections(slug, payload) {
    saving.value = true
    error.value = ''
    try {
      const response = await api.put(`/pages/${slug}/sections/reorder`, payload)
      page.value = response.data.data
      return page.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to reorder sections'
      throw err
    } finally {
      saving.value = false
    }
  }

  // delete section
  async function deleteSection(slug, sectionId) {
    saving.value = true
    error.value = ''
    try {
      await api.delete(`/pages/${slug}/sections/${sectionId}`)
      page.value.sections = page.value.sections.filter((section) => section.id !== sectionId)
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete section'
      throw err
    } finally {
      saving.value = false
    }
  }

  return {
    page,
    templates,
    selectedTemplate,
    loading,
    saving,
    error,
    fetchPage,
    fetchTemplates,
    fetchTemplate,
    addSection,
    updateSectionFields,
    reorderSections,
    deleteSection,
  }
})
