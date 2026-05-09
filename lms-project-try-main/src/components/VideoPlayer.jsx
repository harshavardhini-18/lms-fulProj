import { forwardRef } from 'react'
import styles from './VideoPlayer.module.css'

function getYoutubeEmbedUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return ''
  const input = rawUrl.trim()
  if (!input) return ''

  try {
    const normalizedInput = /^https?:\/\//i.test(input) ? input : `https://${input}`
    const url = new URL(normalizedInput)
    const host = url.hostname.replace(/^www\./, '').toLowerCase()

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id ? `https://www.youtube.com/embed/${id}` : ''
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        const id = url.searchParams.get('v')
        return id ? `https://www.youtube.com/embed/${id}` : ''
      }
      if (url.pathname.startsWith('/embed/')) {
        const id = url.pathname.split('/')[2]
        return id ? `https://www.youtube.com/embed/${id}` : ''
      }
      if (url.pathname.startsWith('/shorts/')) {
        const id = url.pathname.split('/')[2]
        return id ? `https://www.youtube.com/embed/${id}` : ''
      }
    }
  } catch {
    return ''
  }

  return ''
}

const VideoPlayer = forwardRef(function VideoPlayer({ title, src, poster, children }, ref) {
  const hasVideoSource = typeof src === 'string' && src.trim().length > 0
  const youtubeEmbedUrl = hasVideoSource ? getYoutubeEmbedUrl(src) : ''
  const isYoutube = Boolean(youtubeEmbedUrl)

  return (
    <section className={styles.playerSection} aria-label={`${title} video player`}>
      {hasVideoSource ? (
        isYoutube ? (
          <iframe
            key={youtubeEmbedUrl}
            title={`${title} video`}
            className={styles.videoIframe}
            src={youtubeEmbedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <video
            key={src}
            ref={ref}
            className={styles.video}
            controls
            preload="metadata"
            poster={poster}
          >
            <source key={src} src={src} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )
      ) : (
        <div className={styles.videoUnavailable} role="status" aria-live="polite">
          <p className={styles.videoUnavailableTitle}>Video will be available soon.</p>
          <p className={styles.videoUnavailableHint}>
            This lesson does not have a playable video URL yet.
          </p>
        </div>
      )}

      {children ? <div className={styles.overlayLayer}>{children}</div> : null}
    </section>
  )
})

export default VideoPlayer
