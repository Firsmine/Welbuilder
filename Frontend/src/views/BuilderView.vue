<script setup>
import NavBar from '@/components/NavBar.vue'
import { useBuilderStore } from '@/stores/builder'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'

const route = useRoute()
const router = useRouter()
const builderStore = useBuilderStore()
const slug = computed(() => route.params.slug)
const expandedSectionId = ref(null)
const showAddSectionPanel = ref(false)
const showDeleteModal = ref(false)
const deletingSection = ref(null)
const sectionForm = ref({})
const draggedSectionId = ref(null)

onMounted(async () => {
  window.addEventListener('keydown', handleKeyboard)
  if (!slug.value) {
    console.error('Missing page slug in route params:', route.params)
    return
  }
  try {
    await Promise.all([builderStore.fetchPage(slug.value), builderStore.fetchSections()])
    document.title = `WelBuilder | ${builderStore.page?.title || 'Builder'}`
  } catch (error) {
    console.error('Failed to initialize builder:', error)
  }
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyboard)
})
// shortcuts
function handleKeyboard(event) {
  if (event.altKey && event.key.toLowerCase() === 's') {
    event.preventDefault()
    openAddSectionPanel()
  }
  if (event.key === 'Escape') {
    if (showDeleteModal.value) {
      closeDeleteModal()
    } else {
      closeAddSectionPanel()
      expandedSectionId.value = null
    }
  }
}
// open close Section panel
function openAddSectionPanel() {
  showAddSectionPanel.value = true
}
function closeAddSectionPanel() {
  showAddSectionPanel.value = false
  builderStore.selectedSection = ''
}
async function handleAddSection() {
  if (!builderStore.selectedSection) return
  try {
    const nextPosition = (builderStore.page?.sections?.length || 0) + 1

    await builderStore.addSection(slug.value, {
      template_id: builderStore.selectedTemplate,
      position: nextPosition,
    })
    closeAddSectionPanel()
  } catch (error) {
    console.error('Failed to add section:', error.response?.data || error)
  }
}
function normalizeFields(fields) {
  if (fields && !Array.isArray(fields) && typeof fields === 'object') {
    return { ...fields }
  }
  if (Array.isArray(fields)) {
    return Object.fromEntries(fields.map((field) => [field.name, field.value ?? '']))
  }
  return {}
}

function getFieldDefinitions(section) {
  const fields = section.template?.fields
  if (Array.isArray(fields)) {
    return fields
  }
  if (fields && typeof fields === 'object') {
    return Object.entries(fields).map(([name, definition]) => ({
      name,
      ...(typeof definition === 'object' ? definition : {}),
    }))
  }
  return Object.keys(normalizeFields(section.fields)).map((name) => ({
    name,
    label: name.replaceAll('_', ' '),
    type: 'text',
  }))
}
function getFieldValue(fieldName) {
  return sectionForm.value[fieldName] ?? ''
}

// update
function toggleSection(section) {
  if (expandedSectionId.value === section.id) {
    expandedSectionId.value = null
    sectionForm.value = {}
    return
  }
  expandedSectionId.value = section.id
  sectionForm.value = normalizeFields(
    section.fields?.length ? section.fields : section.template.fields,
  )
}
async function saveSection(section) {
  try {
    const section = section.template?.fields
      ? section.template
      : builderStore.sections.find((t) => t.id === (section.template_id ?? section.template?.id))
    const sectionFields = section.fields || []
    const fields = sectionFields.map((field) => ({
      field_id: field.id ?? field.field_id,
      value: sectionForm.value[field.name] ?? '',
    }))
    await builderStore.updateSectionFields(slug.value, section.id, { fields })
    expandedSectionId.value = null
    sectionForm.value = {}
    await builderStore.fetchPage(slug.value)
  } catch (error) {
    console.error('Failed to save section:', error.response?.data || error)
  }
}

// delete
function openDeleteModal(section) {
  deletingSection.value = section
  showDeleteModal.value = true
}
function closeDeleteModal() {
  if (builderStore.saving) return
  showDeleteModal.value = false
  deletingSection.value = null
}
async function confirmDelete() {
  if (!deletingSection.value) return
  try {
    await builderStore.deleteSection(slug.value, deletingSection.value.id)
    if (expandedSectionId.value === deletingSection.value.id) {
      expandedSectionId.value = null
      sectionForm.value = {}
    }
    showDeleteModal.value = false
    deletingSection.value = null
  } catch (error) {
    console.error('Failed to delete section:', error)
  }
}

// drag n drop
function startDrag(section) {
  draggedSectionId.value = section.id
}
async function dropSection(targetSection) {
  if (!draggedSectionId.value) return
  const sections = builderStore.page?.sections || []
  const oldIndex = sections.findIndex((section) => section.id === draggedSectionId.value)
  const newIndex = sections.findIndex((section) => section.id === targetSection.id)
  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
    draggedSectionId.value = null
    return
  }
  // create ordered
  const reorderedSections = [...sections]
  const [movedSection] = reorderedSections.splice(oldIndex, 1)
  reorderedSections.splice(newIndex, 0, movedSection)
  try {
    await builderStore.reorderSections(slug.value, {
      sections: reorderedSections.map((section) => section.id),
    })
    builderStore.page.sections = reorderedSections.map((section, index) => ({
      ...section,
      position: index + 1,
    }))
  } catch (error) {
    console.error('Failed to reorder sections:', error.response?.data || error)
    await builderStore.fetchPage(slug.value)
  } finally {
    draggedSectionId.value = null
  }
}
function endDrag() {
  draggedSectionId.value = null
}
function goToPreview() {
  router.push(`/itineraries/${slug.value}/preview`)
}
</script>
<template>
  <div class="app-layout">
    <!-- Navbar -->
    <NavBar />
    <div class="app-main">
      <div class="builder-layout">
        <!-- ── MAIN CANVAS ── -->
        <div class="builder-main">
          <!-- Toolbar -->
          <div class="builder-toolbar">
            <div class="builder-toolbar__left">
              <div class="builder-breadcrumb">
                <RouterLink to="/pages">Pages</RouterLink>
                <span>→</span>
                <span>{{ builderStore.page?.title }}</span>
              </div>
              <div class="builder-toolbar__divider"></div>
              <span class="tag">{{ builderStore.page?.sections?.length || 0 }} sections</span>
            </div>
            <div class="navbar__actions">
              <button class="btn btn--primary btn--sm" type="button" @click="openAddSectionPanel">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 13 13"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.5 1v11M1 6.5h11"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="square"
                  />
                </svg>
                Add Section
              </button>
              <Button
                class="btn btn--ghost btn--sm"
                type="button"
                @click="goToPreview"
                :disabled="!builderStore.page"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 13 13"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 6.5C1 6.5 3 2 6.5 2S12 6.5 12 6.5 10 11 6.5 11 1 6.5 1 6.5z"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linejoin="round"
                  />
                  <circle cx="6.5" cy="6.5" r="1.75" stroke="currentColor" stroke-width="1.5" />
                </svg>
                Preview
              </Button>
            </div>
          </div>

          <!-- Canvas -->
          <div class="builder-canvas">
            <div v-if="builderStore.loading">Loading page...</div>
            <div v-else-if="!builderStore.page">
              {{ builderStore.error || 'Page not found.' }}
            </div>
            <!-- Field editor: Hero Section (open/active) -->
            <div class="field-editor field-editor--open">
              <div class="field-editor__header">
                <div>
                  <div class="field-editor__title">
                    <span class="tag">01</span>
                    &nbsp; Hero Section
                  </div>
                  <div class="field-editor__meta">template: hero-banner</div>
                </div>
                <div class="field-editor__toggle">
                  <span>Collapse</span>
                  <svg
                    class="field-editor__chevron"
                    width="12"
                    height="8"
                    viewBox="0 0 12 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 1l5 5 5-5"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="square"
                    />
                  </svg>
                </div>
              </div>

              <div class="field-editor__body">
                <div class="form-group">
                  <label class="form-label" for="f-hero-title">Heading</label>
                  <input
                    class="form-input"
                    type="text"
                    id="f-hero-title"
                    placeholder="Enter heading text…"
                    value="Build Beautiful Pages, Fast."
                  />
                </div>
                <div class="form-group">
                  <label class="form-label" for="f-hero-subtitle">Subtitle</label>
                  <input
                    class="form-input"
                    type="text"
                    id="f-hero-subtitle"
                    placeholder="Enter subtitle text…"
                    value="The visual page builder for modern teams."
                  />
                </div>
                <div class="form-group">
                  <label class="form-label" for="f-hero-cta">Button Label</label>
                  <input
                    class="form-input"
                    type="text"
                    id="f-hero-cta"
                    placeholder="e.g. Get Started"
                    value="Get Started"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label" for="f-hero-image">Background Image URL</label>
                  <input
                    class="form-input"
                    type="url"
                    id="f-hero-image"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
              <div class="field-editor__footer">
                <div class="shortcuts-hint"><span class="kbd">Esc</span> to close</div>
                <div class="field-editor__footer-actions">
                  <button class="btn btn--ghost btn--sm" type="button">Discard</button>
                  <button class="btn btn--primary btn--sm" type="button">Save</button>
                </div>
              </div>
            </div>

            <!-- Field editor: Features Grid (collapsed) -->
            <div class="field-editor">
              <div class="field-editor__header">
                <div>
                  <div class="field-editor__title">
                    <span class="tag">02</span>
                    &nbsp; Features Grid
                  </div>
                  <div class="field-editor__meta">template: feature-grid · 4 fields</div>
                </div>
                <div class="field-editor__toggle">
                  <span>Expand</span>
                  <svg
                    class="field-editor__chevron"
                    width="12"
                    height="8"
                    viewBox="0 0 12 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 7l5-5 5 5"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="square"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Field editor: CTA Strip (collapsed) -->
            <div class="field-editor">
              <div class="field-editor__header">
                <div>
                  <div class="field-editor__title">
                    <span class="tag">03</span>
                    &nbsp; Call to Action
                  </div>
                  <div class="field-editor__meta">template: cta-strip · 2 fields</div>
                </div>
                <div class="field-editor__toggle">
                  <span>Expand</span>
                  <svg
                    class="field-editor__chevron"
                    width="12"
                    height="8"
                    viewBox="0 0 12 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 7l5-5 5 5"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="square"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Add Section inline panel -->
            <div v-if="showAddSectionPanel" class="add-section-panel">
              <div class="add-section-panel__header">
                <span class="add-section-panel__title">Add Section</span>
                <button
                  class="btn btn--ghost btn--sm btn--icon"
                  type="button"
                  @click="closeAddSectionPanel"
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 11 11"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 1l9 9M10 1L1 10"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="square"
                    />
                  </svg>
                </button>
              </div>
              <div class="form-wrap">
                <div class="form-group" style="flex: 1">
                  <label class="form-label" for="section-name">Section Name</label>
                  <input
                    v-model="builderStore.name"
                    type="text"
                    class="form-input"
                    id="section-name"
                    placeholder="Hero 1"
                    name="name"
                  />
                </div>
                <div class="form-group" style="flex: 1">
                  <label class="form-label" for="section-template">Section Template</label>
                  <select
                    class="form-input"
                    id="section-template"
                    name="template_id"
                    v-model="builderStore.selectedTemplate"
                  >
                    <option value="" disabled>Choose a template...</option>
                    <option
                      v-for="template in builderStore.templates"
                      :key="template.id"
                      :value="template.id"
                    >
                      {{ template.slug }} —
                      {{ template.name }}
                    </option>
                  </select>
                </div>
                <button
                  class="btn btn--primary"
                  type="button"
                  style="align-self: flex-start"
                  :disabled="builderStore.saving || !builderStore.selectedTemplate"
                  @click="handleAddSection"
                >
                  {{ builderStore.saving ? 'Adding...' : 'Add' }}
                </button>
              </div>
            </div>
          </div>
          <!-- /canvas -->
        </div>
        <!-- /builder-main -->
      </div>
    </div>
  </div>

  <!-- ======================================================
      MODAL: Confirm Remove Section
      ====================================================== -->
  <div class="modal-backdrop" v-if="showDeleteModal" @click.self="closeDeleteModal">
    <div
      class="modal confirm-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-remove-title"
    >
      <div class="modal__header">
        <h2 class="modal__title" id="modal-remove-title">Remove Section</h2>
        <button
          class="modal__close"
          type="button"
          aria-label="Close"
          :disabled="builderStore.saving"
          @click="closeDeleteModal"
        >
          ✕
        </button>
      </div>
      <div class="modal__body">
        <div class="confirm-dialog__icon">
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M11 4v7" stroke="#c0392b" stroke-width="2" stroke-linecap="square" />
            <circle cx="11" cy="16" r="1" fill="#c0392b" />
            <path
              d="M3 19L11 3l8 16H3z"
              stroke="#c0392b"
              stroke-width="2"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <p class="confirm-dialog__text">
          Remove
          <strong>"{{ deletingSection?.title || deletingSection?.template?.name }}"</strong> from
          this page?<br />
          This action cannot be undone.
        </p>
      </div>
      <div class="modal__footer">
        <button
          class="btn btn--ghost"
          type="button"
          :disabled="builderStore.saving"
          @click="closeDeleteModal"
        >
          Cancel
        </button>
        <button
          class="btn btn--danger"
          type="button"
          :disabled="builderStore.saving"
          @click="confirmDelete"
        >
          {{ builderStore.saving ? 'Removing' : 'Ok, Remove' }}
        </button>
      </div>
    </div>
  </div>
</template>
