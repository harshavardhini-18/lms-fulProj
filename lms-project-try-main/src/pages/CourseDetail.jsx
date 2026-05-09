import { Navigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import VideoPlayer from '../components/VideoPlayer'
import TimedQuizGate from '../components/TimedQuizGate'
import TableOfContents from '../components/TableOfContents'
import HandwrittenCanvas from '../components/HandwrittenCanvas'
import { getBackendCourseDetail, resolveBackendCourseId } from '../api/courses'
import { createNote, deleteNote, listNotesByCourse, updateNote } from '../api/notes'

import { courses } from '../data/coursesData'
import styles from './CourseDetail.module.css'

const moduleTitles = ['Beginner Module', 'Intermediate Module', 'Advanced Module', 'Expert Module']

const defaultTimedQuiz = {
  timestampSeconds: 10,
  questions: [
    {
      id: 'q-1',
      question: 'Which statement best describes blockchain?',
      options: [
        { id: 'a', label: 'A central server controls every transaction.' },
        { id: 'b', label: 'It is a distributed ledger validated by network participants.' },
        { id: 'c', label: 'It is only used for storing video files.' },
      ],
      correctOptionId: 'b',
    },
  ],
}

const EMPTY_SCENE = {
  elements: [],
  appState: {
    viewBackgroundColor: '#ffffff',
  },
  files: {},
}

function formatCreatedAt(isoDate) {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return 'Unknown time'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function hasDrawing(scene) {
  if (!scene || !Array.isArray(scene.elements)) return false
  return scene.elements.some((element) => !element.isDeleted)
}

function getNoteScene(note) {
  if (note?.scene && Array.isArray(note.scene.elements)) return note.scene
  if (note?.drawingData && Array.isArray(note.drawingData.elements)) return note.drawingData
  return EMPTY_SCENE
}

function hasVisibleNoteDrawing(note) {
  return hasDrawing(getNoteScene(note))
}

function getActiveLessonIndex(lessons, currentTime) {
  let index = 0
  for (let i = 0; i < lessons.length; i++) {
    if (currentTime >= lessons[i].startSeconds) index = i
  }
  return index
}

function buildModuleSections(lessons) {
  const chunk = Math.ceil(lessons.length / moduleTitles.length)
  return moduleTitles.map((title, i) => ({
    id: title,
    title,
    lessons: lessons.slice(i * chunk, (i + 1) * chunk),
  }))
}

function mapBackendModulesForToc(backendModules = []) {
  return backendModules.map((module, moduleIndex) => ({
    id: module.id || `module-${moduleIndex}`,
    title: module.title || moduleTitles[moduleIndex] || `Module ${moduleIndex + 1}`,
    lessons: Array.isArray(module.lessons)
      ? module.lessons.map((lesson, lessonIndex) => ({
          id: lesson.id || `${module.id || moduleIndex}-${lessonIndex}`,
          title: lesson.title || `Lesson ${lessonIndex + 1}`,
          startSeconds: Number(lesson.timestampStart ?? lesson.timestamp_start ?? 0),
          duration: lesson.duration || lesson.durationLabel || '',
          // Support all known backend video field names to avoid blank players.
          videoUrl: String(
            lesson.videoUrl ||
            lesson.primaryVideoUrl ||
            lesson.video_url ||
            ''
          ).trim(),
          contentJson: lesson.contentJson || lesson.content_json || { type: 'doc', content: [] },
        }))
      : [],
  }))
}

function renderTiptapNode(node, keyPrefix = 'node') {
  if (!node || typeof node !== 'object') return null
  const nodeType = String(node.type || '')
  const children = Array.isArray(node.content)
    ? node.content.map((child, i) => renderTiptapNode(child, `${keyPrefix}-${i}`))
    : null

  if (nodeType === 'text') {
    let content = node.text || ''
    const marks = Array.isArray(node.marks) ? node.marks : []
    marks.forEach((mark) => {
      const markType = String(mark?.type || '')
      if (markType === 'bold') content = <strong key={`${keyPrefix}-b`}>{content}</strong>
      if (markType === 'italic') content = <em key={`${keyPrefix}-i`}>{content}</em>
      if (markType === 'underline') content = <u key={`${keyPrefix}-u`}>{content}</u>
      if (markType === 'code') content = <code key={`${keyPrefix}-c`}>{content}</code>
      if (markType === 'link') {
        const href = String(mark?.attrs?.href || '').trim()
        if (href) {
          content = (
            <a key={`${keyPrefix}-a`} href={href} target="_blank" rel="noreferrer">
              {content}
            </a>
          )
        }
      }
    })
    return <span key={keyPrefix}>{content}</span>
  }

  if (nodeType === 'paragraph') return <p key={keyPrefix}>{children}</p>
  if (nodeType === 'heading') {
    const level = Number(node?.attrs?.level || 2)
    if (level === 1) return <h1 key={keyPrefix}>{children}</h1>
    if (level === 3) return <h3 key={keyPrefix}>{children}</h3>
    if (level === 4) return <h4 key={keyPrefix}>{children}</h4>
    return <h2 key={keyPrefix}>{children}</h2>
  }
  if (nodeType === 'bulletList') return <ul key={keyPrefix}>{children}</ul>
  if (nodeType === 'orderedList') return <ol key={keyPrefix}>{children}</ol>
  if (nodeType === 'listItem') return <li key={keyPrefix}>{children}</li>
  if (nodeType === 'blockquote') return <blockquote key={keyPrefix}>{children}</blockquote>
  if (nodeType === 'codeBlock') return <pre key={keyPrefix}>{children}</pre>
  if (nodeType === 'hardBreak') return <br key={keyPrefix} />
  if (nodeType === 'horizontalRule') return <hr key={keyPrefix} />
  if (nodeType === 'image') {
    const src = String(node?.attrs?.src || '').trim()
    if (!src) return null
    const alt = String(node?.attrs?.alt || 'Lesson image')
    return <img key={keyPrefix} className={styles.richImage} src={src} alt={alt} loading="lazy" />
  }

  if (children) return <span key={keyPrefix}>{children}</span>
  return null
}

function CourseDetail() {
  const { id } = useParams()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const composerRef = useRef(null)
  const shouldScrollAfterCreateRef = useRef(false)

  const course = useMemo(
    () => courses.find((c) => c.id === Number(id)),
    [id]
  )
  const [backendCourseDetail, setBackendCourseDetail] = useState(null)
  const [backendCourseError, setBackendCourseError] = useState('')
  const [backendDetailLoading, setBackendDetailLoading] = useState(true)

  const backendModules = useMemo(
    () => mapBackendModulesForToc(backendCourseDetail?.modules || []),
    [backendCourseDetail]
  )
  const flattenedBackendLessons = useMemo(
    () => backendModules.flatMap((module) => module.lessons || []),
    [backendModules]
  )
  const lessons = useMemo(
    () => (flattenedBackendLessons.length > 0 ? flattenedBackendLessons : course?.lessons || []),
    [flattenedBackendLessons, course]
  )
  const modules = useMemo(
    () => (backendModules.length > 0 ? backendModules : buildModuleSections(lessons)),
    [backendModules, lessons]
  )
  const [activeLessonIndex, setActiveLessonIndex] = useState(0)
  const [isQuizVisible, setIsQuizVisible] = useState(false)
  const [isQuizCompleted, setIsQuizCompleted] = useState(false)
  const timedQuiz = course?.timedQuiz || defaultTimedQuiz
  const currentLesson = lessons[activeLessonIndex] || null
  const videoSrc = currentLesson?.videoUrl || course?.videoUrl || ''
  const lessonContentJson = currentLesson?.contentJson || null
  const hasBackendRichContent = Boolean(
    lessonContentJson &&
      lessonContentJson.type === 'doc' &&
      Array.isArray(lessonContentJson.content) &&
      lessonContentJson.content.length > 0
  )
  const fallbackCourseId = useMemo(() => `frontend-course-${course?.id || id}`, [course?.id, id])
  const courseTitle = course?.title || backendCourseDetail?.title || 'Course'
  const courseImage =
    course?.image || backendCourseDetail?.thumbnailUrl || backendCourseDetail?.bannerUrl || ''

  const [sidebarTab, setSidebarTab] = useState('toc') // 'toc' | 'notes'
  const [notes, setNotes] = useState([])
  const [selectedNoteId, setSelectedNoteId] = useState(null)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteText, setNoteText] = useState('')
  const [editorMode, setEditorMode] = useState('text')
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [formError, setFormError] = useState('')
  const [composerInitialScene, setComposerInitialScene] = useState(EMPTY_SCENE)
  const [notesError, setNotesError] = useState('')
  const [backendCourseId, setBackendCourseId] = useState(null)
  const [deleteTargetNote, setDeleteTargetNote] = useState(null)
  // composer save button transient state
  const [saveBtnSaved, setSaveBtnSaved] = useState(false)
  const saveBtnTimeoutRef = useRef(null)
  // ID of the note that was most recently saved (used to trigger inline indicator immediately)
  const [recentlySavedNoteId, setRecentlySavedNoteId] = useState(null)
  const recentlySavedTimerRef = useRef(null)

  // LOAD COURSE DETAIL (backend when available)
  useEffect(() => {
    let cancelled = false

    async function loadCourseDetail() {
      try {
        setBackendDetailLoading(true)
        const resolvedCourseId = course ? await resolveBackendCourseId(course) : String(id || '')
        if (!resolvedCourseId) {
          if (!cancelled) {
            setBackendCourseDetail(null)
            setBackendCourseError('')
            setBackendDetailLoading(false)
          }
          return
        }
        const detail = await getBackendCourseDetail(resolvedCourseId)
        if (cancelled) return
        setBackendCourseDetail(detail)
        setBackendCourseError('')
      } catch (error) {
        if (cancelled) return
        setBackendCourseDetail(null)
        setBackendCourseError(error?.message || 'Unable to load backend course detail.')
      } finally {
        if (!cancelled) setBackendDetailLoading(false)
      }
    }

    loadCourseDetail()
    return () => {
      cancelled = true
    }
  }, [course, id])

  // LOAD NOTES (backend only)
  useEffect(() => {
    let cancelled = false

    async function loadNotes() {
      setNotesError('')
      setBackendCourseId(fallbackCourseId)

      try {
        const resolvedCourseId = course ? await resolveBackendCourseId(course) : String(id || '')
        const effectiveCourseId =
          resolvedCourseId ||
          import.meta.env.VITE_BACKEND_COURSE_ID ||
          fallbackCourseId

        const backendNotes = await listNotesByCourse(effectiveCourseId)
        if (cancelled) return

        const mapped = backendNotes.map((n) => ({
          id: n._id,
          title: n.title || '',
          textContent: n.textContent || '',
          scene: n.drawingScene || EMPTY_SCENE,
          createdAt: n.createdAt || new Date().toISOString(),
          lastSavedAt: n.lastSavedAt || n.updatedAt || new Date().toISOString(),
          _raw: n,
        }))

        setBackendCourseId(effectiveCourseId)
        setNotes(mapped)
        setSelectedNoteId(null)
        setIsComposerOpen(false)
      } catch (error) {
        if (cancelled) return
        setNotes([])
        setSelectedNoteId(null)
        setIsComposerOpen(false)
        setNotesError(error?.message || 'Unable to load notes from backend.')
      }
    }

    loadNotes()
    return () => {
      cancelled = true
    }
  }, [id, course?.title, fallbackCourseId])

  // VIDEO TRACKING
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handler = () => {
      const time = video.currentTime

      setActiveLessonIndex(getActiveLessonIndex(lessons, time))

      if (!isQuizCompleted && time >= timedQuiz.timestampSeconds) {
        video.pause()
        setIsQuizVisible(true)
      }
    }

    video.addEventListener('timeupdate', handler)
    return () => video.removeEventListener('timeupdate', handler)
  }, [lessons, timedQuiz, isQuizCompleted])

  useEffect(() => {
    if (!shouldScrollAfterCreateRef.current) return

    shouldScrollAfterCreateRef.current = false
    window.requestAnimationFrame(() => {
      window.scrollBy({ top: -72, behavior: 'smooth' })
    })
  }, [notes])

  useEffect(() => {
    setIsComposerOpen(false)
    setEditingNoteId(null)
    setSelectedNoteId(null)
    setNoteTitle('')
    setNoteText('')
    setFormError('')
  }, [id])

  useEffect(() => {
    if (!isComposerOpen) return
    const raf = requestAnimationFrame(() => {
      const node = composerRef.current
      if (!node) return
      const top = node.getBoundingClientRect().top + window.scrollY - 24
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(raf)
  }, [isComposerOpen])

  useEffect(() => {
    return () => {
      if (saveBtnTimeoutRef.current) clearTimeout(saveBtnTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (!deleteTargetNote) return undefined

    const handleEsc = (event) => {
      if (event.key === 'Escape') setDeleteTargetNote(null)
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [deleteTargetNote])

  const handleStartNewNote = () => {
    setSidebarTab('notes')
    setIsComposerOpen(true)
    setNoteTitle('')
    setNoteText('')
    setEditorMode('text')
    setFormError('')
    setEditingNoteId(null)
    setComposerInitialScene(EMPTY_SCENE)

    if (canvasRef.current) {
      canvasRef.current.clearCanvas()
    }
  }

  const handleToggleNote = (noteId) => {
    setSelectedNoteId((prev) => (prev === noteId ? null : noteId))
    setIsComposerOpen(false)
  }

  const handleEditNote = (note) => {
    setSidebarTab('notes')
    setIsComposerOpen(true)
    setNoteTitle(note.title || '')
    setNoteText(note.textContent || '')
    setEditingNoteId(note.id)

    // If the note has a drawing scene, open the canvas in draw mode and set the scene
    const scene = note?.scene || EMPTY_SCENE
    setComposerInitialScene(scene)
    if (hasDrawing(scene)) {
      setEditorMode('draw')
      // give the canvas a moment to mount (if needed) then set scene
      setTimeout(() => {
        if (canvasRef.current?.setScene) {
          canvasRef.current.setScene(scene)
        }
        if (canvasRef.current?.setTool) {
          canvasRef.current.setTool('freedraw')
        }
      }, 0)
    } else {
      setEditorMode('text')
      // clear canvas when editing text-only note
      setTimeout(() => {
        if (canvasRef.current?.clearCanvas) canvasRef.current.clearCanvas()
      }, 0)
    }

    setFormError('')
    // keep the note expanded while editing
    setSelectedNoteId(note.id)
  }

  const handleDeleteNote = (noteId) => {
    const run = async () => {
      try {
        await deleteNote(noteId)
      } catch (error) {
        setNotesError(error?.message || 'Failed to delete note.')
        return
      }

      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== noteId)
        return next
      })

      // if deleting the currently selected note, collapse
      if (selectedNoteId === noteId) setSelectedNoteId(null)
      // if deleting the note being edited, close composer
      if (editingNoteId === noteId) {
        setIsComposerOpen(false)
        setEditingNoteId(null)
      }
    }

    run()
  }

  const handleRequestDeleteNote = (note) => {
    setDeleteTargetNote(note)
  }

  const handleConfirmDeleteNote = () => {
    if (!deleteTargetNote?.id) return
    handleDeleteNote(deleteTargetNote.id)
    setDeleteTargetNote(null)
  }

  const handleSaveNote = () => {
    const saveToBackend = async ({ title, textContent, scene }) => {
      const effectiveCourseId =
        backendCourseId || import.meta.env.VITE_BACKEND_COURSE_ID || fallbackCourseId
      if (!effectiveCourseId) throw new Error('Missing backend course')

      const anchorTimestampSeconds = Math.floor(Number(videoRef.current?.currentTime || 0))

      if (editingNoteId) {
        const updated = await updateNote(editingNoteId, {
          title,
          textContent,
          drawingScene: scene,
          anchorTimestampSeconds,
        })
        return {
          id: updated._id,
          title: updated.title || '',
          textContent: updated.textContent || '',
          scene: updated.drawingScene || EMPTY_SCENE,
          createdAt: updated.createdAt || new Date().toISOString(),
          lastSavedAt: updated.lastSavedAt || updated.updatedAt || new Date().toISOString(),
          _raw: updated,
        }
      }

      const created = await createNote({
        course: effectiveCourseId,
        title,
        textContent,
        drawingScene: scene,
        anchorTimestampSeconds,
      })

      return {
        id: created._id,
        title: created.title || '',
        textContent: created.textContent || '',
        scene: created.drawingScene || EMPTY_SCENE,
        createdAt: created.createdAt || new Date().toISOString(),
        lastSavedAt: created.lastSavedAt || created.updatedAt || new Date().toISOString(),
        _raw: created,
      }
    }

    const title = noteTitle.trim()
    const content = noteText.trim()
    const scene = canvasRef.current?.getScene?.() || EMPTY_SCENE
    const hasVisibleDrawing = hasDrawing(scene)

    if (!title) {
      setFormError('Add a title to save this note.')
      return
    }

    if (!content && !hasVisibleDrawing) {
      setFormError('Add text or drawing to save this note.')
      return
    }

    const run = async () => {
      try {
        const saved = await saveToBackend({ title, textContent: noteText, scene })

        setNotes((prev) => {
          const next = editingNoteId
            ? prev.map((n) => (n.id === editingNoteId ? { ...n, ...saved } : n))
            : [saved, ...prev]
          return next
        })

        if (editingNoteId) {
          setRecentlySavedNoteId(editingNoteId)
        } else {
          shouldScrollAfterCreateRef.current = true
          setRecentlySavedNoteId(saved.id)
        }
      } catch (error) {
        setFormError(error?.message || 'Failed to save note. Please try again.')
        return
      } finally {
        setEditingNoteId(null)
      }

      if (recentlySavedTimerRef.current) clearTimeout(recentlySavedTimerRef.current)
      recentlySavedTimerRef.current = setTimeout(() => setRecentlySavedNoteId(null), 3200)

      setNoteTitle('')
      setNoteText('')
      setIsComposerOpen(false)
      setFormError('')

      if (canvasRef.current) {
        canvasRef.current.clearCanvas()
      }

      // composer save button temporary feedback
      if (saveBtnTimeoutRef.current) clearTimeout(saveBtnTimeoutRef.current)
      setSaveBtnSaved(true)
      saveBtnTimeoutRef.current = setTimeout(() => setSaveBtnSaved(false), 1500)
    }

    run()
  }

  useEffect(() => {
    return () => {
      if (saveBtnTimeoutRef.current) clearTimeout(saveBtnTimeoutRef.current)
      if (recentlySavedTimerRef.current) clearTimeout(recentlySavedTimerRef.current)
    }
  }, [])

  // (undo removed — keeping notes immutable by default)

    function NoteItem({ note, recentlySavedNoteId }) {
  const [justSaved, setJustSaved] = useState(false)
  const justSavedTimer = useRef(null)
  const prevSavedRef = useRef(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    // keep track of mount so we don't show "Saved" for notes that already have a timestamp on initial render
    if (!mountedRef.current) {
      mountedRef.current = true
      prevSavedRef.current = note?.lastSavedAt || null
      return
    }

    const current = note?.lastSavedAt || null
    // if timestamp changed (a save happened for this specific note), show the transient indicator
    if (current && current !== prevSavedRef.current) {
      setJustSaved(true)
      if (justSavedTimer.current) clearTimeout(justSavedTimer.current)
      justSavedTimer.current = setTimeout(() => setJustSaved(false), 3000)
    }

    prevSavedRef.current = current

    return () => {
      if (justSavedTimer.current) clearTimeout(justSavedTimer.current)
    }
  }, [note.lastSavedAt])

  useEffect(() => {
    // If parent signals this note was just saved, show the transient indicator.
    if (recentlySavedNoteId && recentlySavedNoteId === note.id) {
      setJustSaved(true)
      if (justSavedTimer.current) clearTimeout(justSavedTimer.current)
      justSavedTimer.current = setTimeout(() => setJustSaved(false), 3000)
    }

    return () => {
      if (justSavedTimer.current) clearTimeout(justSavedTimer.current)
    }
  }, [recentlySavedNoteId, note.id])

    // timeAgo removed — inline indicator is intentionally brief and minimal

    return (
      <article key={note.id} className={`${styles.noteItem} ${selectedNoteId === note.id ? styles.noteItemOpen : ''}`}>
        <div className={`${styles.noteCard} ${selectedNoteId === note.id ? styles.noteCardActive : ''}`}>
          <div className={styles.noteCardMain}>
            <div className={styles.noteCardHeader}>
              <span className={styles.noteCardTitle}>
                <span className={styles.noteCardTitleText}>{note.title || 'Untitled note'}</span>
                <span className={`${styles.savedInline} ${justSaved ? styles.savedInlineShow : ''}`} aria-hidden>{/* inline saved indicator */}Saved ✓</span>
              </span>
              <span className={styles.noteCardDate}>{formatCreatedAt(note.createdAt)}</span>
            </div>
            {typeof note.textContent === 'string' && note.textContent.trim().length > 0 && (
              <span className={styles.noteCardSnippet}>
                {note.textContent
                  .split('\n')[0]
                  .replace(/\.{3,}\s*$/, '')
                  .replace(/…\s*$/, '')}
              </span>
            )}
          </div>
          <button
            type="button"
            className={styles.noteCardArrowBtn}
            onClick={() => handleToggleNote(note.id)}
            aria-expanded={selectedNoteId === note.id}
            aria-label={selectedNoteId === note.id ? 'Collapse note' : 'Expand note'}
          >
            <span className={`${styles.noteCardArrow} ${selectedNoteId === note.id ? styles.noteCardArrowOpen : ''}`}>
              <i className="fa-solid fa-caret-down" aria-hidden="true" />
            </span>
          </button>
        </div>

        {selectedNoteId === note.id && !(isComposerOpen && editingNoteId === note.id) && (
          <div className={styles.noteExpandedBody}>
            {note.textContent && <div className={styles.textPreview}>{note.textContent}</div>}

            {hasVisibleNoteDrawing(note) && (
              <div className={styles.noteImage}>
                <HandwrittenCanvas key={`preview-${note.id}`} initialScene={getNoteScene(note)} readOnly height={420} />
              </div>
            )}

            {!note.textContent && !hasVisibleNoteDrawing(note) && (
              <p className={styles.previewEmpty}>This note has no visible text or drawing.</p>
            )}

            <div className={styles.noteExpandedActions}>
              <button type="button" className={styles.iconActionBtn} onClick={() => handleEditNote(note)} aria-label="Edit note" title="Edit note">
                <i className="fa-solid fa-pen-to-square" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`${styles.iconActionBtn} ${styles.iconDeleteBtn}`}
                onClick={() => handleRequestDeleteNote(note)}
                aria-label="Delete note"
                title="Delete note"
              >
                <i className="fa-solid fa-trash-can" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </article>
    )
  }

  if (!course && backendDetailLoading) return null
  if (!course && !backendCourseDetail) return <Navigate to="/courses" replace />

  return (
    <section className={styles.page}>
      <div className={`${styles.mainContainer} ${isComposerOpen ? styles.mainContainerExpanded : ''}`}>
        {/* LEFT (sidebar — TOC / Notes toggle) */}
        <aside className={styles.tocPanel}>
          <div className={styles.sidebarTabs} role="tablist" aria-label="Sidebar view">
            <button
              type="button"
              role="tab"
              aria-selected={sidebarTab === 'toc'}
              className={`${styles.sidebarTabBtn} ${sidebarTab === 'toc' ? styles.sidebarTabBtnActive : ''}`}
              onClick={() => setSidebarTab('toc')}
            >
              Contents
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={sidebarTab === 'notes'}
              className={`${styles.sidebarTabBtn} ${sidebarTab === 'notes' ? styles.sidebarTabBtnActive : ''}`}
              onClick={() => setSidebarTab('notes')}
            >
              Notes
            </button>
          </div>

          {sidebarTab === 'toc' && (
            <TableOfContents
              lessons={lessons}
              modules={modules}
              activeLessonIndex={activeLessonIndex}
              onLessonSelect={(i, t) => {
                videoRef.current.currentTime = t
                videoRef.current.play()?.catch(() => {})
              }}
            />
          )}

          {sidebarTab === 'notes' && (
            <div className={styles.sidebarNotesPanel}>
              <div className={styles.sidebarNotesHeader}>
                <p className={styles.railTitle}>All Notes</p>
                <button
                  type="button"
                  className={styles.addNewBtn}
                  onClick={handleStartNewNote}
                >
                  Add Note
                </button>
              </div>

              {isComposerOpen && (
                <div ref={composerRef} className={styles.noteFormCard}>
                  <label htmlFor="note-title" className={styles.label}>Title</label>
                  <input
                    id="note-title"
                    className={styles.titleInput}
                    value={noteTitle}
                    onChange={(event) => setNoteTitle(event.target.value)}
                    placeholder="Example: Blockchain consensus diagram"
                  />

                  <div className={styles.drawLabelRow}>
                    <p className={styles.label}>Editor Mode</p>
                    <p className={styles.drawHint}>Pick Text or Draw before writing your note.</p>
                  </div>

                  <div className={styles.modeToggleRow}>
                    <button
                      type="button"
                      className={`${styles.modeToggleBtn} ${editorMode === 'text' ? styles.modeToggleBtnActive : ''}`}
                      onClick={() => setEditorMode('text')}
                    >
                      Text
                    </button>
                    <button
                      type="button"
                      className={`${styles.modeToggleBtn} ${editorMode === 'draw' ? styles.modeToggleBtnActive : ''}`}
                      onClick={() => {
                        setEditorMode('draw')
                        canvasRef.current?.setTool?.('freedraw')
                      }}
                    >
                      Draw
                    </button>
                  </div>

                  <div className={editorMode === 'text' ? '' : styles.hiddenEditor}>
                    <textarea
                      className={styles.textEditor}
                      value={noteText}
                      onChange={(event) => setNoteText(event.target.value)}
                      placeholder="Start typing your note..."
                    />
                  </div>

                  <div className={`${styles.canvasArea} ${editorMode === 'draw' ? '' : styles.hiddenEditor}`}>
                    <HandwrittenCanvas
                      key={`composer-canvas-${editingNoteId || 'new'}`}
                      ref={canvasRef}
                      initialScene={composerInitialScene}
                      activeTool="freedraw"
                      height={520}
                    />
                  </div>

                  {formError && <p className={styles.formError}>{formError}</p>}

                  <div className={styles.noteActions}>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => {
                        setIsComposerOpen(false)
                        setNoteText('')
                        setFormError('')
                        if (canvasRef.current) {
                          canvasRef.current.clearCanvas()
                        }
                      }}
                    >
                      Cancel
                    </button>
                    <button type="button" className={styles.addNoteBtn} onClick={handleSaveNote}>
                      {saveBtnSaved ? 'Saved ✓' : 'Save Note'}
                    </button>
                  </div>
                </div>
              )}

              {notesError ? <p className={styles.formError}>{notesError}</p> : null}

              {notes.length === 0 && !isComposerOpen ? (
                <p className={styles.emptyNotesHint}>No notes yet.</p>
              ) : (
                notes.length > 0 && (
                  <div className={styles.noteList}>
                    {notes.map((note) => (
                      <NoteItem key={note.id} note={note} recentlySavedNoteId={recentlySavedNoteId} />
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </aside>

        {/* RIGHT (content) */}
        <div className={styles.leftColumn}>

          <div className={styles.titleBlock}>
            <h1 className={styles.courseTitleCentered}>{courseTitle}</h1>
          </div>

          <VideoPlayer ref={videoRef} title={courseTitle} src={videoSrc}>
            {isQuizVisible && (
              <TimedQuizGate
                quiz={timedQuiz}
                onSuccess={() => {
                  setIsQuizCompleted(true)
                  setIsQuizVisible(false)
                  videoRef.current.play()?.catch(() => {})
                }}
              />
            )}
          </VideoPlayer>

          <article className={styles.articleBody}>
            {backendCourseError ? <p className={styles.formError}>{backendCourseError}</p> : null}
            {hasBackendRichContent ? (
              <div className={styles.richContentBody}>
                {lessonContentJson.content.map((node, index) =>
                  renderTiptapNode(node, `lesson-content-${index}`)
                )}
              </div>
            ) : (
              <>
                <h2 className={styles.articleHeading}>Why {courseTitle} matters</h2>
                <p>
                  {courseTitle} is one of the most in-demand skills today. Teams use it
                  every day to ship faster, make better decisions, and build reliable
                  products. Learning it gives you a clear edge in real projects, interviews,
                  and on-the-job problem solving.
                </p>

                {lessons.length > 0 && (
                  <>
                    <h2 className={styles.articleHeading}>Key concepts in this course</h2>
                    <ul className={styles.bulletList}>
                      {lessons.map((lesson, lessonIndex) => (
                        <li key={`learn-${lesson.id || lessonIndex}`}>
                          <strong>{lesson.title}</strong>
                          {' — a focused walkthrough that builds practical, hands-on intuition.'}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                <h2 className={styles.articleHeading}>What you’ll be able to do</h2>
                <ul className={styles.bulletList}>
                  <li>Apply core {courseTitle} concepts to real-world scenarios with confidence.</li>
                  <li>Break down complex problems into clear, structured steps.</li>
                  <li>Communicate your work and results clearly to teammates and stakeholders.</li>
                  <li>Build a portfolio-ready outcome you can showcase on your resume.</li>
                </ul>

                {courseImage && (
                  <figure className={styles.articleFigure}>
                    <img src={courseImage} alt={courseTitle} loading="lazy" />
                    <figcaption>{courseTitle} — quick visual reference.</figcaption>
                  </figure>
                )}

                <h2 className={styles.articleHeading}>How this course is structured</h2>
                <p>
                  The course is organised into short, focused lessons that build on each
                  other. Each lesson introduces one clear idea, walks through a small
                  hands-on example, and ends with a short recap so concepts stay sticky.
                  You can follow the lessons in order, or use the Table of Contents on
                  the left to jump to any topic that interests you.
                </p>
                <p>
                  As you progress, take notes on patterns you find tricky and revisit
                  earlier lessons whenever a concept feels shaky — repetition is what
                  turns these ideas from theory into instinct. By the end you should be
                  able to explain the core ideas in your own words and apply them to a
                  small project of your own.
                </p>
              </>
            )}

          </article>

        </div>

      </div>
      {deleteTargetNote && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => setDeleteTargetNote(null)}
        >
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-note-modal-title"
            aria-describedby="delete-note-modal-description"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="delete-note-modal-title" className={styles.modalTitle}>
              Delete note?
            </h3>
            <p id="delete-note-modal-description" className={styles.modalDescription}>
              This will permanently remove
              <strong>{` "${deleteTargetNote.title || 'Untitled note'}"`}</strong>
              . This action cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setDeleteTargetNote(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalDeleteBtn}
                onClick={handleConfirmDeleteNote}
              >
                Delete Note
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default CourseDetail