/**
 * Fullscreen helpers for the student quiz flow.
 * Call tryEnterQuizFullscreenFromUserGesture() synchronously from a click handler
 * before any await — otherwise the browser will reject requestFullscreen.
 */

export function getFullscreenElement() {
  if (typeof document === 'undefined') return null
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement ||
    null
  )
}

export function requestElFullscreen(el) {
  if (!el) return Promise.reject(new Error('no element'))
  const req =
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.webkitRequestFullScreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen
  if (!req) return Promise.reject(new Error('fullscreen unsupported'))
  try {
    const p = req.call(el, { navigationUI: 'hide' })
    return p instanceof Promise ? p : Promise.resolve()
  } catch (e) {
    return Promise.reject(e)
  }
}

export function exitDocumentFullscreen() {
  if (typeof document === 'undefined') return Promise.resolve()
  const d = document
  if (!getFullscreenElement()) return Promise.resolve()
  const x =
    d.exitFullscreen ||
    d.webkitExitFullscreen ||
    d.webkitCancelFullScreen ||
    d.mozCancelFullScreen ||
    d.msExitFullscreen
  if (!x) return Promise.resolve()
  try {
    const p = x.call(d)
    return p instanceof Promise ? p : Promise.resolve()
  } catch {
    return Promise.resolve()
  }
}

/** Document root fullscreen — best chance to hide browser chrome after SPA navigation. */
export function tryEnterQuizFullscreenFromUserGesture() {
  if (typeof document === 'undefined') return
  const docEl = document.documentElement
  void requestElFullscreen(docEl).catch(() => {})
}

export function isLikelyQuizFullscreenTarget(fs) {
  if (!fs) return false
  if (typeof document === 'undefined') return false
  if (fs === document.documentElement) return true
  if (fs === document.body) return true
  return false
}
