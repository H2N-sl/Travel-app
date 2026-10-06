/**
 * ==============================================================================
 * FILE: src/composables/useImages.ts
 * COMPOSABLE FOR DYNAMIC IMAGE ASSETS WITH ROBUST FALLBACK HANDLING
 * ==============================================================================
 * 
 * 🔰 BEGINNER GUIDE - WHAT DOES THIS COMPOSABLE DO?
 * ------------------------------------------------------------------------------
 * This composable connects your Vue components directly to `images.ts`.
 * 
 * Usage in any component:
 * ```vue
 * <script setup>
 * import { useImages } from '../composables/useImages';
 * const { images, handleImageError, getTourImage } = useImages();
 * </script>
 * 
 * <template>
 *   <!-- Automatically falls back if the local file is missing! -->
 *   <img
 *     :src="images.hero.main.src"
 *     :alt="images.hero.main.alt"
 *     @error="handleImageError($event, images.hero.main.fallback)"
 *   />
 * </template>
 * ```
 */

import { reactive, readonly } from 'vue';
import { imagesConfig } from '../config/images';

// Reactive state for the images registry
const imagesState = reactive({ ...imagesConfig });

/**
 * Gracefully handles image load errors.
 * Replaces the broken source with a verified high-resolution fallback or SVG placeholder.
 * Prevents infinite error loops with a dataset flag.
 */
function handleImageError(event: Event, fallbackSrc?: string): void {
  const img = event.target as HTMLImageElement;
  if (!img) return;

  // Prevent infinite loops if fallback itself fails
  if (img.dataset.hasFallbackApplied === 'true') {
    img.src = imagesState.fallbacks.placeholder;
    return;
  }

  img.dataset.hasFallbackApplied = 'true';
  img.src = fallbackSrc || imagesState.fallbacks.tour;
}

/**
 * Returns a specific tour package image with fallback
 */
function getTourImage(tourKey: keyof typeof imagesConfig.tours): string {
  const item = imagesState.tours[tourKey];
  return item ? item.src : imagesState.fallbacks.tour;
}

/**
 * Returns a fleet vehicle image with fallback
 */
function getFleetImage(vehicleKey: keyof typeof imagesConfig.fleet): string {
  const item = imagesState.fleet[vehicleKey];
  return item ? item.src : imagesState.fallbacks.fleet;
}

/**
 * Returns general category fallback
 */
function getFallback(type: keyof typeof imagesConfig.fallbacks): string {
  return imagesState.fallbacks[type] || imagesState.fallbacks.placeholder;
}

export function useImages() {
  return {
    images: readonly(imagesState),
    handleImageError,
    getTourImage,
    getFleetImage,
    getFallback,
  };
}

export default useImages;
