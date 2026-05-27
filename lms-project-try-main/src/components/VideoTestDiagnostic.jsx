import { useState } from 'react'
import styles from './VideoTestDiagnostic.module.css'

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

export default function VideoTestDiagnostic() {
  const [testUrl, setTestUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  const [embedUrl, setEmbedUrl] = useState('')
  const [isYoutube, setIsYoutube] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  const handleTest = () => {
    const embed = getYoutubeEmbedUrl(testUrl)
    setEmbedUrl(embed)
    setIsYoutube(Boolean(embed))
  }

  const testUrls = [
    { label: 'Rick Roll (watch format)', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { label: 'Rick Roll (short format)', url: 'https://youtu.be/dQw4w9WgXcQ' },
    { label: 'Sample Test Video', url: 'https://www.youtube.com/watch?v=xAnjqt3K35E' },
    { label: 'YouTube Live (if available)', url: 'https://www.youtube.com/live/ohb0GI0SeX4' },
    { label: 'Invalid Format (should fail)', url: 'https://invalid-site.com/video' },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>🎬 Video URL Tester</h2>

        <div className={styles.testSection}>
          <label>Enter a YouTube URL to test:</label>
          <div className={styles.inputGroup}>
            <input
              type="text"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="Paste YouTube URL here..."
              className={styles.input}
            />
            <button onClick={handleTest} className={styles.button}>
              Test URL
            </button>
          </div>
        </div>

        {embedUrl && (
          <div className={styles.results}>
            <div className={`${styles.resultBox} ${isYoutube ? styles.success : styles.error}`}>
              <p className={styles.resultLabel}>Status:</p>
              <p className={styles.resultValue}>
                {isYoutube ? '✅ YouTube URL Detected' : '❌ Not a YouTube URL'}
              </p>

              {isYoutube && (
                <>
                  <p className={styles.resultLabel}>Embed URL:</p>
                  <code className={styles.embedUrl}>{embedUrl}</code>

                  <button
                    onClick={() => setPreviewOpen(!previewOpen)}
                    className={`${styles.button} ${styles.previewButton}`}
                  >
                    {previewOpen ? 'Hide Preview' : 'Show Preview'}
                  </button>

                  {previewOpen && (
                    <div className={styles.preview}>
                      <iframe
                        title="Video Preview"
                        src={embedUrl}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className={styles.iframe}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <div className={styles.quickTest}>
          <h3>Quick Test URLs:</h3>
          <div className={styles.urlList}>
            {testUrls.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTestUrl(item.url)
                  setTimeout(handleTest, 100)
                }}
                className={styles.quickButton}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.info}>
          <h3>📋 Expected YouTube URL Formats:</h3>
          <ul>
            <li>✅ <code>https://www.youtube.com/watch?v=VIDEO_ID</code></li>
            <li>✅ <code>https://youtu.be/VIDEO_ID</code></li>
            <li>✅ <code>https://m.youtube.com/watch?v=VIDEO_ID</code></li>
            <li>✅ <code>https://www.youtube.com/embed/VIDEO_ID</code></li>
            <li>✅ <code>https://www.youtube.com/shorts/VIDEO_ID</code></li>
            <li>✅ <code>https://www.youtube.com/live/VIDEO_ID</code> (Live streams)</li>
          </ul>

          <h3>⚠️ Common Issues:</h3>
          <ul>
            <li>Missing <code>https://</code> prefix</li>
            <li>YouTube has disabled embedding for this video</li>
            <li>Video is private or deleted</li>
            <li>Invalid video ID</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
