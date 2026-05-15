/**
 * imageConverter.js
 * Browser-based image → WebP converter using the Canvas API.
 *
 * Produces two variants:
 *   catalog  — max 800 px on longest side, quality 0.85
 *   thumb    — max 300 px on longest side, quality 0.80
 *
 * Falls back to PNG if the browser does not support WebP encoding
 * (Safari < 14, very old iOS — rare in 2025).
 */

const CATALOG_MAX = 800
const CATALOG_Q   = 0.85
const THUMB_MAX   = 300
const THUMB_Q     = 0.80

/** Load a File into an HTMLImageElement */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload  = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`No se pudo cargar la imagen: ${file.name}`)) }
    img.src = url
  })
}

/** Scale dimensions to fit inside maxSide × maxSide, never upscaling */
function scaleDims(img, maxSide) {
  const ratio = Math.min(1, maxSide / img.naturalWidth, maxSide / img.naturalHeight)
  return {
    w: Math.max(1, Math.round(img.naturalWidth  * ratio)),
    h: Math.max(1, Math.round(img.naturalHeight * ratio)),
  }
}

/** Draw an image into a new canvas at the given size */
function drawCanvas(img, w, h) {
  const canvas = document.createElement('canvas')
  canvas.width  = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled  = true
  ctx.imageSmoothingQuality  = 'high'
  ctx.drawImage(img, 0, 0, w, h)
  return canvas
}

/** Promisified canvas.toBlob */
function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('canvas.toBlob devolvió null'))),
      mime,
      quality,
    )
  })
}

/** Detect browser WebP encoding support via a quick canvas probe */
function detectWebPSupport(canvas) {
  try {
    return canvas.toDataURL('image/webp').startsWith('data:image/webp')
  } catch {
    return false
  }
}

/**
 * Convert any image File to two WebP (or PNG) variants.
 *
 * @param {File} file  — any browser-decodable image (JPEG, PNG, GIF, WebP, AVIF…)
 * @returns {Promise<{
 *   catalog:  Blob,   — catalog variant (≤800 px)
 *   thumb:    Blob,   — thumbnail variant (≤300 px)
 *   ext:      string, — 'webp' | 'png'
 *   mimeType: string, — 'image/webp' | 'image/png'
 *   width:    number, — catalog pixel width
 *   height:   number, — catalog pixel height
 * }>}
 */
export async function convertImage(file) {
  const img = await loadImage(file)

  const catDims   = scaleDims(img, CATALOG_MAX)
  const thumbDims = scaleDims(img, THUMB_MAX)

  const catCanvas   = drawCanvas(img, catDims.w,   catDims.h)
  const thumbCanvas = drawCanvas(img, thumbDims.w,  thumbDims.h)

  const supportsWebP = detectWebPSupport(catCanvas)
  const mime    = supportsWebP ? 'image/webp' : 'image/png'
  const ext     = supportsWebP ? 'webp'       : 'png'
  const catQ    = supportsWebP ? CATALOG_Q    : undefined
  const thumbQ  = supportsWebP ? THUMB_Q      : undefined

  const [catalog, thumb] = await Promise.all([
    canvasToBlob(catCanvas,   mime, catQ),
    canvasToBlob(thumbCanvas, mime, thumbQ),
  ])

  return {
    catalog,
    thumb,
    ext,
    mimeType: mime,
    width:    catDims.w,
    height:   catDims.h,
  }
}

/** Human-readable file size */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
