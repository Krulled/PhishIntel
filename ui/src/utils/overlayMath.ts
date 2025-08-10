/**
 * Compute overlay positioning for image overlays with object-contain scaling behavior.
 * Used for placing bounding boxes over images that are scaled to fit their container.
 */

export interface Size {
  width: number
  height: number
}

export interface OverlayTransform {
  scaleX: number
  scaleY: number
  offsetX: number
  offsetY: number
}

/**
 * Calculate scaling and offset for positioning overlays on an image with object-contain behavior.
 * 
 * @param naturalSize - Original image dimensions (e.g., from naturalWidth/naturalHeight)
 * @param displaySize - Actual displayed image size (e.g., from getBoundingClientRect())
 * @param containerSize - Container element size (parent element dimensions)
 * @returns Transform values for positioning overlays
 */
export function computeOverlayRects(
  naturalSize: Size,
  displaySize: Size,
  containerSize: Size
): OverlayTransform {
  // Calculate scaling factors from natural to display size
  const scaleX = displaySize.width / naturalSize.width
  const scaleY = displaySize.height / naturalSize.height
  
  // Calculate offset for centered image (object-contain behavior)
  // The image is centered within the container
  const offsetX = (containerSize.width - displaySize.width) / 2
  const offsetY = (containerSize.height - displaySize.height) / 2
  
  return { scaleX, scaleY, offsetX, offsetY }
}

/**
 * Apply overlay transform to a bounding box to get CSS positioning.
 * 
 * @param box - Bounding box in original image coordinates
 * @param transform - Transform from computeOverlayRects
 * @returns CSS positioning properties
 */
export function applyOverlayTransform(
  box: { x: number; y: number; w: number; h: number },
  transform: OverlayTransform
): { left: number; top: number; width: number; height: number } {
  return {
    left: transform.offsetX + (box.x * transform.scaleX),
    top: transform.offsetY + (box.y * transform.scaleY),
    width: box.w * transform.scaleX,
    height: box.h * transform.scaleY
  }
}
