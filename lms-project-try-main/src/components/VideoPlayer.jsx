import { forwardRef, useState, useEffect, useRef } from 'react'
import styles from './VideoPlayer.module.css'

function getYoutubeEmbedUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return ''
  const input = rawUrl.trim()
  if (!input) return ''

  try {
    // Handle URLs without protocol
    const normalizedInput = /^https?:\/\//i.test(input) ? input : `https://${input}`
    const url = new URL(normalizedInput)
    const host = url.hostname.replace(/^www\./, '').toLowerCase()

    // youtu.be shortlinks
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      if (id) {
        console.log(`[VideoPlayer] Converted youtu.be to embed: ${id}`)
        return `https://www.youtube.com/embed/${id}`
      }
    }

    // youtube.com variants
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      // /watch?v=ID format
      if (url.pathname === '/watch') {
        const id = url.searchParams.get('v')
        if (id) {
          console.log(`[VideoPlayer] Converted youtube.com/watch to embed: ${id}`)
          return `https://www.youtube.com/embed/${id}`
        }
      }
      // /embed/ID format (already embed)
      if (url.pathname.startsWith('/embed/')) {
        const id = url.pathname.split('/')[2]
        if (id) {
          console.log(`[VideoPlayer] Already embed format: ${id}`)
          return `https://www.youtube.com/embed/${id}`
        }
      }
      // /shorts/ID format
      if (url.pathname.startsWith('/shorts/')) {
        const id = url.pathname.split('/')[2]
        if (id) {
          console.log(`[VideoPlayer] Converted youtube.com/shorts to embed: ${id}`)
          return `https://www.youtube.com/embed/${id}`
        }
      }
      // /live/ID format (YouTube Live streams)
      if (url.pathname.startsWith('/live/')) {
        const id = url.pathname.split('/')[2]
        if (id) {
          console.log(`[VideoPlayer] Converted youtube.com/live to embed: ${id}`)
          return `https://www.youtube.com/embed/${id}`
        }
      }
    }
  } catch (error) {
    console.error(`[VideoPlayer] Error parsing URL "${rawUrl}":`, error.message)
    return ''
  }

  console.warn(`[VideoPlayer] Could not identify YouTube URL format: ${input}`)
  return ''
}

function withYoutubeApiParams(embedUrl) {
  if (!embedUrl) return ''
  const url = new URL(embedUrl)
  url.searchParams.set('enablejsapi', '1')
  url.searchParams.set('origin', window.location.origin)
  return url.toString()
}

const VideoPlayer = forwardRef(function VideoPlayer(
  { title, src, poster, children, onTimeUpdate, isLocked = false },
  ref
) {
  const [videoError, setVideoError] = useState(null)
  const [iframeError, setIframeError] = useState(null)
  const iframeRef = useRef(null)
  const videoRef = useRef(null)

  const hasVideoSource = typeof src === 'string' && src.trim().length > 0
  const youtubeEmbedUrl = hasVideoSource ? withYoutubeApiParams(getYoutubeEmbedUrl(src)) : ''
  const isYoutube = Boolean(youtubeEmbedUrl)

  console.log(`[VideoPlayer] Rendering: src="${src}", isYoutube=${isYoutube}, embedUrl="${youtubeEmbedUrl}"`)

  const assignVideoRef = (node) => {
    videoRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  // Setup HTML5 video element time tracking
  const handleTimeUpdate = (event) => {
    if (onTimeUpdate && event.target) {
      onTimeUpdate(event.target.currentTime)
    }
  }

  // Setup YouTube iframe postMessage listener for time tracking
  useEffect(() => {
    if (!isYoutube || !iframeRef.current) return

    const handleMessage = (event) => {
      // YouTube sends data with specific structure
      if (event.data && typeof event.data === 'object' && event.data.type === 'infoDelivery') {
        if (event.data.info && event.data.info.currentTime !== undefined) {
          if (onTimeUpdate) {
            onTimeUpdate(event.data.info.currentTime)
          }
        }
      }
    }

    window.addEventListener('message', handleMessage)
    
    // Inject YouTube IFrame API if not already present
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
    }

    return () => window.removeEventListener('message', handleMessage)
  }, [isYoutube, onTimeUpdate])

  useEffect(() => {
    const node = videoRef.current
    if (node && isLocked) {
      node.pause?.()
    }
    if (!node) return undefined

    const onPlay = () => {
      if (isLocked) node.pause?.()
    }
    node.addEventListener('play', onPlay)
    return () => node.removeEventListener('play', onPlay)
  }, [isLocked])

  useEffect(() => {
    if (!isYoutube || !iframeRef.current) return
    if (!isLocked) return
    try {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
        '*'
      )
    } catch {
      /* ignore */
    }
  }, [isLocked, isYoutube])

  const handleVideoError = (error) => {
    const msg = `Video failed to load: ${error?.message || 'Unknown error'}`
    console.error(`[VideoPlayer] ${msg}`)
    setVideoError(msg)
  }

  const handleIframeError = () => {
    const msg = 'YouTube video failed to load. Check if embedding is allowed.'
    console.error(`[VideoPlayer] ${msg}`)
    setIframeError(msg)
  }

  return (
    <section className={styles.playerSection} aria-label={`${title} video player`}>
      {hasVideoSource ? (
        isYoutube ? (
          <div className={`${styles.iframeWrapper}${isLocked ? ` ${styles.locked}` : ''}`}>
            <iframe
              ref={iframeRef}
              key={youtubeEmbedUrl}
              title={`${title} video`}
              className={styles.videoIframe}
              src={youtubeEmbedUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              onError={handleIframeError}
              sandbox="allow-same-origin allow-scripts allow-popups allow-presentation allow-top-navigation allow-forms"
            />
            {iframeError && (
              <div className={styles.errorMessage}>
                <p className={styles.errorIcon}>⚠️</p>
                <p className={styles.errorText}>{iframeError}</p>
              </div>
            )}
          </div>
        ) : (
          <div className={`${styles.videoWrapper}${isLocked ? ` ${styles.locked}` : ''}`}>
            <video
              key={src}
              ref={assignVideoRef}
              className={styles.video}
              controls={!isLocked}
              preload="metadata"
              poster={poster}
              onError={handleVideoError}
              onTimeUpdate={handleTimeUpdate}
            >
              <source key={src} src={src} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {videoError && (
              <div className={styles.errorMessage}>
                <p className={styles.errorIcon}>⚠️</p>
                <p className={styles.errorText}>{videoError}</p>
              </div>
            )}
          </div>
        )
      ) : (
        <div className={styles.videoUnavailable} role="status" aria-live="polite">
          <p className={styles.videoUnavailableTitle}>Video will be available soon.</p>
          <p className={styles.videoUnavailableHint}>
            This lesson does not have a playable video URL yet.
          </p>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '12px' }}>
            Debug: src="{src}"
          </p>
        </div>
      )}

      {isLocked ? <div className={styles.dimLayer} /> : null}
      {children ? (
        <div className={`${styles.overlayLayer}${isLocked ? ` ${styles.overlayLock}` : ''}`}>
          {children}
        </div>
      ) : null}
    </section>
  )
})

export default VideoPlayer
