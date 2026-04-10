import { Navigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import VideoPlayer from '../components/VideoPlayer'
import TimedQuizGate from '../components/TimedQuizGate'
import TableOfContents from '../components/TableOfContents'
import HandwrittenCanvas from '../components/HandwrittenCanvas'

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

const TABS = ['Activity', 'Summary', 'Notes']

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

function CourseDetail() {
  const { id } = useParams()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const tabRowRef = useRef(null)
  const shouldScrollAfterCreateRef = useRef(false)

  const course = useMemo(
    () => courses.find((c) => c.id === Number(id)),
    [id]
  )

  const lessons = useMemo(() => course?.lessons || [], [course])
  const modules = buildModuleSections(lessons)
  const timedQuiz = course?.timedQuiz || defaultTimedQuiz

  const [activeLessonIndex, setActiveLessonIndex] = useState(0)
  const [isQuizVisible, setIsQuizVisible] = useState(false)
  const [isQuizCompleted, setIsQuizCompleted] = useState(false)
  const [activeTab, setActiveTab] = useState('Summary')

  const [notes, setNotes] = useState([])
  const [selectedNoteId, setSelectedNoteId] = useState(null)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteText, setNoteText] = useState('')
  const [editorMode, setEditorMode] = useState('text')
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [formError, setFormError] = useState('')
  // composer save button transient state
  const [saveBtnSaved, setSaveBtnSaved] = useState(false)
  const saveBtnTimeoutRef = useRef(null)
  // ID of the note that was most recently saved (used to trigger inline indicator immediately)
  const [recentlySavedNoteId, setRecentlySavedNoteId] = useState(null)
  const recentlySavedTimerRef = useRef(null)

  // LOAD NOTES
  useEffect(() => {
    const saved = localStorage.getItem(`notes-${id}`)
    if (!saved) {
      // schedule state updates async to avoid synchronous setState in effect
      Promise.resolve().then(() => {
        setNotes([])
        setSelectedNoteId(null)
        setIsComposerOpen(false)
      })
      return
    }

    const parsedNotes = JSON.parse(saved)
    Promise.resolve().then(() => {
      setNotes(parsedNotes)
      setSelectedNoteId(null)
      setIsComposerOpen(false)
    })
  }, [id])

  // SAVE NOTES
  useEffect(() => {
    localStorage.setItem(`notes-${id}`, JSON.stringify(notes))
  }, [notes, id])

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
    if (activeTab !== 'Notes') return
    if (!tabRowRef.current) return

    const y = tabRowRef.current.getBoundingClientRect().top + window.scrollY - 20
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
  }, [activeTab])

  useEffect(() => {
    if (!shouldScrollAfterCreateRef.current) return
    if (activeTab !== 'Notes') return

    shouldScrollAfterCreateRef.current = false
    window.requestAnimationFrame(() => {
      window.scrollBy({ top: -72, behavior: 'smooth' })
    })
  }, [notes, activeTab])

  // cleanup for any pending composer save timeout
  useEffect(() => {
    return () => {
      if (saveBtnTimeoutRef.current) clearTimeout(saveBtnTimeoutRef.current)
    }
  }, [])

  const handleStartNewNote = () => {
    setIsComposerOpen(true)
    setNoteTitle('')
    setNoteText('')
    setEditorMode('text')
    setFormError('')
    setEditingNoteId(null)

    if (canvasRef.current) {
      canvasRef.current.clearCanvas()
    }
  }

  const handleToggleNote = (noteId) => {
    setSelectedNoteId((prev) => (prev === noteId ? null : noteId))
    setIsComposerOpen(false)
  }

  const handleEditNote = (note) => {
    setIsComposerOpen(true)
    setNoteTitle(note.title || '')
    setNoteText(note.textContent || '')
    setEditingNoteId(note.id)

    // If the note has a drawing scene, open the canvas in draw mode and set the scene
    const scene = note?.scene || EMPTY_SCENE
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
    setNotes((prev) => prev.filter((n) => n.id !== noteId))
    // if deleting the currently selected note, collapse
    if (selectedNoteId === noteId) setSelectedNoteId(null)
    // if deleting the note being edited, close composer
    if (editingNoteId === noteId) {
      setIsComposerOpen(false)
      setEditingNoteId(null)
    }
  }

  const handleSaveNote = () => {
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

    const now = new Date().toISOString()

    if (editingNoteId) {
      // update existing note
      setNotes((prev) => {
        const updated = prev.map((n) =>
          n.id === editingNoteId
            ? { ...n, title, textContent: noteText, scene, lastSavedAt: now, _previous: { ...n } }
            : n
        )
        return updated
      })
      setEditingNoteId(null)
      // mark this note as recently saved so the inline indicator shows immediately
      setRecentlySavedNoteId(editingNoteId)
      if (recentlySavedTimerRef.current) clearTimeout(recentlySavedTimerRef.current)
      recentlySavedTimerRef.current = setTimeout(() => setRecentlySavedNoteId(null), 3200)
    } else {
      const newNote = {
        id: Date.now(),
        title,
        textContent: noteText,
        scene,
        createdAt: now,
        lastSavedAt: now,
        _action: 'created',
      }

      setNotes((prev) => {
        const updated = [newNote, ...prev]
        setSelectedNoteId(null)
        return updated
      })
      shouldScrollAfterCreateRef.current = true
      // ensure the newly created note shows the inline saved indicator
      setRecentlySavedNoteId(newNote.id)
      if (recentlySavedTimerRef.current) clearTimeout(recentlySavedTimerRef.current)
      recentlySavedTimerRef.current = setTimeout(() => setRecentlySavedNoteId(null), 3200)
    }

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

        {selectedNoteId === note.id && (
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
                onClick={() => {
                  if (window.confirm('Delete this note?')) handleDeleteNote(note.id)
                }}
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

  if (!course) return <Navigate to="/courses" replace />

  return (
    <section className={styles.page}>
      <div className={styles.mainContainer}>

        {/* LEFT */}
        <div className={styles.leftColumn}>

          <div className={styles.titleBlock}>
            <h1 className={styles.courseTitleCentered}>{course.title}</h1>
          </div>

          <VideoPlayer ref={videoRef} src={course.videoUrl}>
            {isQuizVisible && (
              <TimedQuizGate
                quiz={timedQuiz}
                onSuccess={() => {
                  setIsQuizCompleted(true)
                  setIsQuizVisible(false)
                  videoRef.current.play()
                }}
              />
            )}
          </VideoPlayer>

          {/* TABS */}
          <div ref={tabRowRef} className={styles.tabRow}>
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`${styles.tabButton} ${activeTab === tab ? styles.activeTab : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Summary' && (
            <div className={styles.summaryCard}>
              <p className={styles.summaryBody}>{course.description}</p>
            </div>
          )}

          {/* NOTES */}
          {activeTab === 'Notes' && (
            <div className={styles.notesWrapper}>
              {notes.length === 0 && !isComposerOpen ? (
                <div className={styles.notesEmptyCenterWrap}>
                  <div className={styles.notesEmptyMessage}>
                    <p className={styles.notesEmptyTitle}>No previous notes</p>
                    <p className={styles.notesEmptyHint}>Click below to add a new note.</p>
                  </div>
                  <button type="button" className={styles.addNewBtnCenter} onClick={handleStartNewNote}>
                    Add New Note
                  </button>
                </div>
              ) : (
                <>
                  <div className={styles.notesTopBar}>
                   
                    <button type="button" className={styles.addNewBtn} onClick={handleStartNewNote}>
                       Add Note
                    </button>
                  </div>

                  <div className={styles.notesSingleColumn}>
                    {isComposerOpen && (
                      <div className={styles.noteFormCard}>
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
                            onClick={() => {
                              setEditorMode('text')
                            }}
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
                            key="composer-canvas"
                            ref={canvasRef}
                            initialScene={EMPTY_SCENE}
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

                    {notes.length > 0 && (
                      <section className={styles.notesRail}>
                        <p className={styles.railTitle}>All Notes</p>

                        <div className={styles.noteList}>
                          {notes.map((note) => (
                            <NoteItem key={note.id} note={note} recentlySavedNoteId={recentlySavedNoteId} />
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* RIGHT */}
        <div className={styles.tocPanel}>
          <TableOfContents
            lessons={lessons}
            modules={modules}
            activeLessonIndex={activeLessonIndex}
            onLessonSelect={(i, t) => {
              videoRef.current.currentTime = t
              videoRef.current.play()
            }}
          />
        </div>

      </div>
    </section>
  )
}

export default CourseDetail