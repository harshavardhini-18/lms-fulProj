import { forwardRef } from 'react'
import styles from './VideoPlayer.module.css'

const VideoPlayer = forwardRef(function VideoPlayer({ title, src, poster, children }, ref) {
  return (
    <section className={styles.playerSection} aria-label={`${title} video player`}>
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

      {children ? <div className={styles.overlayLayer}>{children}</div> : null}
    </section>
  )
})

export default VideoPlayer
