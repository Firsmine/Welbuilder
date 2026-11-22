<script setup>
import NavBar from '@/components/NavBar.vue'
import { usePageStore } from '@/stores/page'
import { ref, onMounted, watch, onUnmounted } from 'vue'

const pageStore = usePageStore()
const showModal = ref(false)
const isEditing = ref(false)
const editingSlug = ref(null)
const form = ref({ title: '', slug: '', summary: '' })
const saving = ref(false)
const pageError = ref('')
const showDeleteModal = ref(false)
const deletingPage = ref(null)
const deleting = ref(false)

onMounted(async () => {
  try {
    await pageStore.fetchPage()
  } catch (error) {
    pageError.value = error.response?.data?.message || 'Failed to load pages'
  }
})
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
watch(
  () => form.value.title,
  (newTitle) => {
    if (!isEditing.value) {
      form.value.slug = generateSlug(newTitle)
    }
  },
)
function openCreateModal() {
  isEditing.value = false
  editingSlug.value = null
  form.value = { title: '', slug: '', summary: '' }
  pageError.value = ''
  showModal.value = true
}
function openEditModal(page) {
  isEditing.value = true
  editingSlug.value = page.slug
  form.value = {
    title: page.title,
    slug: page.slug,
    summary: page.summary || '',
  }
  pageError.value = ''
  showModal.value = true
}
function closeModal() {
  showModal.value = false
  pageError.value = ''
}
async function savePage() {
  saving.value = true
  pageError.value = ''
  try {
    const formData = {
      title: form.value.title,
      slug: form.value.slug,
      summary: form.value.summary || null,
    }
    if (isEditing.value) {
      await pageStore.updatePage(editingSlug.value, formData)
    } else {
      await pageStore.createPage(formData)
    }
    closeModal()
  } catch (error) {
    pageError.value = error.response?.data?.message || 'Failed to save page'
    console.error(error)
  } finally {
    saving.value = false
  }
}
async function deletePage(page) {
  deletingPage.value = page
  showDeleteModal.value = true
}
async function confirmDelete() {
  if (!deletingPage.value) return
  deleting.value = true
  pageError.value = ''
  try {
    await pageStore.deletePage(deletingPage.value.slug)
    showDeleteModal.value = false
    deletingPage.value = null
  } catch (error) {
    pageError.value = error.response?.data?.message || 'Failed to delete page'
    console.error(error)
  } finally {
    deleting.value = false
  }
}
function handleKey(event) {
  if (event.altKey && event.key.toLowerCase() === 'n') {
    event.preventDefault()
    if (!showModal.value) {
      openCreateModal()
    }
  }
  if (event.key === 'Escape') {
    if (showModal.value) {
      closeModal()
    }
  }
}
onMounted(async () => {
  document.title = 'Welbuilder | My Pages'
  window.addEventListener('keydown', handleKey)
  try {
    await pageStore.fetchPage()
  } catch (error) {
    pageError.value = error.response?.data?.message || 'Failed to load pages'
    console.error(error)
  }
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleKey)
})
</script>

<template>
  <div class="app-layout">
    <!-- Navbar -->
    <NavBar />

    <main class="app-main">
      <div class="page-container">
        <!-- Page Header -->
        <div class="page-header">
          <div class="page-header__left">
            <h1 class="page-title">My Pages</h1>
            <p class="page-subtitle">
              {{ pageStore.pages.length }} pages · manage your web content
            </p>
          </div>
          <div>
            <button class="btn btn--primary" type="button" @click="openCreateModal">
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
              New Page
              <span class="kbd">Alt+N</span>
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="pageStore.loading">Loading pages...</div>
        <!-- Error message -->
        <div v-else-if="pageError" class="form-error">
          {{ pageError }}
        </div>
        <!-- <div v-if="pageError && !showModal" class="form-error">
          {{ pageError }}
        </div> -->

        <!-- Pages List -->
        <div class="pages-grid" v-else-if="pageStore.pages.length > 0">
          <!-- Page Item 1 -->
          <div class="page-item" v-for="page in pageStore.pages" :key="page.slug">
            <div class="page-item__info">
              <span class="page-item__title">
                <RouterLink to="`/pages/${page.slug}/builder">{{ page.title }}</RouterLink>
                <span class="page-item__title-arrow">→</span>
              </span>
              <div class="page-item__meta">
                <span class="page-item__slug">/{{ page.slug }}</span>
                <span class="page-item__summary">{{ page.summary }}</span>
              </div>
            </div>
            <div class="page-item__actions">
              <RouterLink to="`/pages/${page.slug}/builder`" class="btn btn--ghost btn--sm">
                Build
              </RouterLink>
              <button class="btn btn--ghost btn--sm" type="button" @click="openEditModal(page)">
                Edit
              </button>
              <button class="btn btn--danger btn--sm" type="button" @click="deletePage(page)">
                Delete
              </button>
            </div>
          </div>
        </div>
        <!-- Empty State -->
        <p v-else>You don't have any pages yet. Create your first page!</p>
      </div>
    </main>
  </div>

  <!-- ======================================================
      MODAL: Create / Edit Page
      ====================================================== -->
  <div class="modal-backdrop hidden" v-if="showModal" @click.self="closeModal">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-create-title">
      <div class="modal__header">
        <h2 class="modal__title" id="modal-create-title">
          {{ isEditing ? 'Edit page' : 'New Page' }}
        </h2>
        <button class="modal__close" type="button" aria-label="Close" @click="closeModal">✕</button>
      </div>

      <form @submit.prevent="savePage">
        <div class="modal__body">
          <div class="form-group">
            <label class="form-label" for="new-title">Title</label>
            <input
              v-model="form.title"
              required
              class="form-input"
              type="text"
              id="new-title"
              name="title"
              placeholder="e.g. Homepage"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="new-slug">Slug</label>
            <input
              v-model="form.slug"
              required
              class="form-input"
              type="text"
              id="new-slug"
              name="slug"
              placeholder="e.g. homepage"
            />
            <span class="form-hint">Auto-generated from title. Lowercase, no spaces.</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="new-summary"
              >Summary <span class="form-hint">(optional)</span></label
            >
            <textarea
              v-model="form.summary"
              required
              class="form-input"
              id="new-summary"
              name="summary"
              placeholder="Brief description of this page…"
            ></textarea>
          </div>
          <div v-if="pageError" class="form-error">
            {{ pageError }}
          </div>
        </div>

        <div class="modal__footer">
          <button class="btn btn--ghost" type="button" @click="closeModal">Cancel</button>
          <button class="btn btn--primary" type="submit" :disabled="saving">
            {{ saving ? 'Saving...' : isEditing ? 'Update Page' : 'Save Page' }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- ======================================================
      MODAL: Confirm Delete
      ====================================================== -->

  <div class="modal-backdrop" v-if="showDeleteModal" @click.self="showDeleteModal = false">
    <div
      class="modal confirm-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-delete-title"
    >
      <div class="modal__header">
        <h2 class="modal__title" id="modal-delete-title">Delete Page</h2>
        <button
          class="modal__close"
          type="button"
          aria-label="Close"
          @click="showDeleteModal = false"
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
          Are you sure you want to delete <strong>"{{ deletingPage?.title }}"</strong>?<br />
          This action cannot be undone.
        </p>
      </div>

      <div class="modal__footer">
        <button class="btn btn--ghost" type="button" @click="showDeleteModal = false">
          Cancel
        </button>
        <button class="btn btn--danger" type="button" @click="confirmDelete">
          {{ deleting ? 'Deleting...' : 'Ok, Delete' }}
        </button>
      </div>
    </div>
  </div>
</template>
