<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePreviewStore } from '@/stores/preview'
import { useBuilderStore } from '@/stores/builder'

const route = useRoute()
const router = useRouter()
const previewStore = usePreviewStore()
const builderStore = useBuilderStore()
const slug = route.params.slug

onMounted(async () => {
  try {
    await previewStore.fetchPreview(slug)
  } catch (error) {
    console.error('Could not load preview:', error)
  }
})
function backToBuilder() {
  const currentSlug = builderStore.page?.slug || route.params.slug
  router.push({ name: 'builders', params: { slug: currentSlug } })
}
</script>

<template>
  <div class="preview-layout">
    <!-- Loading -->
    <div v-if="previewStore.loading">Loading preview...</div>

    <!-- Error -->
    <div v-else-if="previewStore.error">
      {{ previewStore.error }}
    </div>

    <template v-else-if="previewStore.itinerary">
      <!-- Top bar -->
      <div class="preview-topbar">
        <div class="preview-topbar__info">
          <span class="preview-topbar__badge">Preview</span>
          <span class="preview-topbar__title">{{ previewStore.page.title }}</span>
          <span class="preview-topbar__slug">/{{ previewStore.page.slug }}</span>
        </div>
        <button class="btn btn--ghost btn--sm" type="button" @click="backToBuilder">
          <svg
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 2L3 6.5 8 11"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="square"
              stroke-linejoin="round"
            />
          </svg>
          Back to Builder
        </button>
      </div>

      <!-- Preview content -->
      <div class="preview-content">
        <!-- Section label -->
        <div
          class="preview-section"
          v-for="(section, index) in previewStore.sections"
          :key="section.id"
        >
          <div class="preview-section__label">
            <span class="preview-section__num">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="preview-section__template-name">{{ section.template?.slug }}</span>
          </div>
          <!-- Section body -->
          <div class="preview-section__body">
            <div class="preview-fields">
              <div v-for="field in section.fields" :key="field.id" class="preview-field">
                <!-- Image field -->
                <div v-if="field.type === 'image'" class="preview-field__image">
                  <img v-if="field.value" :src="field.value" :alt="field.name" />

                  <div v-else class="preview-image-placeholder">No image provided</div>
                </div>

                <!-- Text field -->
                <div v-else class="preview-field__text">
                  <h3>{{ field.name.replaceAll('_', ' ') }}</h3>

                  <p>
                    {{ field.value || 'No content provided' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- /preview-content -->
    </template>
  </div>
</template>
