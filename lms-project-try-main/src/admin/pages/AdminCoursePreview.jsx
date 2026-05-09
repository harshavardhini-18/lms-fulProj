import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import TableOfContents from '../../components/TableOfContents';
import VideoPlayer from '../../components/VideoPlayer';
import { adminCourseService } from '../services/adminCourseService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './AdminCoursePreview.css';

function renderTiptapNode(node, keyPrefix = 'node') {
  if (!node || typeof node !== 'object') return null;
  const type = String(node.type || '');
  const children = Array.isArray(node.content)
    ? node.content.map((child, index) => renderTiptapNode(child, `${keyPrefix}-${index}`))
    : null;

  if (type === 'text') {
    let content = node.text || '';
    const marks = Array.isArray(node.marks) ? node.marks : [];
    marks.forEach((mark) => {
      const markType = String(mark?.type || '');
      if (markType === 'bold') content = <strong key={`${keyPrefix}-b`}>{content}</strong>;
      if (markType === 'italic') content = <em key={`${keyPrefix}-i`}>{content}</em>;
      if (markType === 'underline') content = <u key={`${keyPrefix}-u`}>{content}</u>;
      if (markType === 'code') content = <code key={`${keyPrefix}-c`}>{content}</code>;
      if (markType === 'link') {
        const href = String(mark?.attrs?.href || '').trim();
        if (href) {
          content = (
            <a key={`${keyPrefix}-a`} href={href} target="_blank" rel="noreferrer">
              {content}
            </a>
          );
        }
      }
    });
    return <>{content}</>;
  }

  if (type === 'paragraph') return <p key={keyPrefix}>{children}</p>;
  if (type === 'heading') {
    const level = Number(node?.attrs?.level || 2);
    if (level === 1) return <h1 key={keyPrefix}>{children}</h1>;
    if (level === 3) return <h3 key={keyPrefix}>{children}</h3>;
    if (level === 4) return <h4 key={keyPrefix}>{children}</h4>;
    return <h2 key={keyPrefix}>{children}</h2>;
  }
  if (type === 'bulletList') return <ul key={keyPrefix}>{children}</ul>;
  if (type === 'orderedList') return <ol key={keyPrefix}>{children}</ol>;
  if (type === 'listItem') return <li key={keyPrefix}>{children}</li>;
  if (type === 'blockquote') return <blockquote key={keyPrefix}>{children}</blockquote>;
  if (type === 'codeBlock') return <pre key={keyPrefix}>{children}</pre>;
  if (type === 'hardBreak') return <br key={keyPrefix} />;
  if (type === 'horizontalRule') return <hr key={keyPrefix} />;
  if (type === 'image') {
    const src = String(node?.attrs?.src || '').trim();
    if (!src) return null;
    const alt = String(node?.attrs?.alt || 'Lesson image');
    return <img key={keyPrefix} className="acp-rich-image" src={src} alt={alt} loading="lazy" />;
  }
  if (children) return <>{children}</>;
  return null;
}

export default function AdminCoursePreview() {
  const { courseId } = useParams();
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [course, setCourse] = useState(null);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [sidebarTab, setSidebarTab] = useState('toc');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const payload = await adminCourseService.getCourse(courseId);
        if (cancelled) return;
        const data = payload?.data || null;
        setCourse(data);
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || 'Failed to load course preview');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const modules = useMemo(() => {
    if (!course?.modules) return [];
    return course.modules.map((module, moduleIndex) => ({
      id: module._id || module.id || `module-${moduleIndex}`,
      title: module.title || `Module ${moduleIndex + 1}`,
      lessons: (module.lessons || []).map((lesson, lessonIndex) => ({
        id: lesson._id || lesson.id || `${moduleIndex}-${lessonIndex}`,
        title: lesson.title || `Topic ${lessonIndex + 1}`,
        startSeconds: Number(lesson.timestampStart || 0),
      })),
    }));
  }, [course]);

  const lessons = useMemo(() => {
    if (!modules.length) return [];
    return modules.flatMap((module) =>
      (module.lessons || []).map((lesson) => ({
        ...lesson,
        startSeconds: Number(lesson.startSeconds || 0),
      }))
    );
  }, [modules]);

  const currentLesson = useMemo(() => lessons[activeLessonIndex] || null, [lessons, activeLessonIndex]);
  const lessonSource = useMemo(() => {
    if (!course?.modules?.length || !currentLesson) return null;
    for (const module of course.modules) {
      const found = (module.lessons || []).find((l) => String(l._id || l.id) === String(currentLesson.id));
      if (found) return found;
    }
    return null;
  }, [course, currentLesson]);

  const videoSrc = lessonSource?.videoUrl || '';
  const contentJson = lessonSource?.contentJson || null;
  const hasRichContent =
    contentJson &&
    contentJson.type === 'doc' &&
    Array.isArray(contentJson.content) &&
    contentJson.content.length > 0;

  if (loading) return <LoadingSpinner />;

  return (
    <section className="acp-page">
      <div className="acp-topbar">
        <Link to="/admin/courses" className="acp-back-link">← Course Library</Link>
        <Link to={`/admin/courses/${courseId}`} className="acp-edit-link">Edit course</Link>
      </div>

      {error ? (
        <div className="acp-error">{error}</div>
      ) : (
        <div className="acp-layout">
          <aside className="acp-sidebar">
            <div className="acp-tabs">
              <button
                type="button"
                className={`acp-tab${sidebarTab === 'toc' ? ' active' : ''}`}
                onClick={() => setSidebarTab('toc')}
              >
                Contents
              </button>
              <button
                type="button"
                className={`acp-tab${sidebarTab === 'notes' ? ' active' : ''}`}
                onClick={() => setSidebarTab('notes')}
              >
                Notes
              </button>
            </div>

            {sidebarTab === 'toc' ? (
              <TableOfContents
                lessons={lessons}
                modules={modules}
                activeLessonIndex={activeLessonIndex}
                onLessonSelect={(index, startSeconds) => {
                  setActiveLessonIndex(index);
                  if (videoRef.current && Number.isFinite(startSeconds)) {
                    videoRef.current.currentTime = startSeconds;
                  }
                }}
              />
            ) : (
              <div className="acp-notes-placeholder">
                <h4>Notes panel</h4>
                <p>This is preview mode. Notes UI is shown here similar to student view.</p>
              </div>
            )}
          </aside>

          <main className="acp-content">
            <h1 className="acp-title">{course?.title || 'Course preview'}</h1>
            <VideoPlayer ref={videoRef} title={course?.title || 'Course'} src={videoSrc} />

            <article className="acp-article">
              {hasRichContent ? (
                <div className="acp-rich-body">
                  {contentJson.content.map((node, index) =>
                    renderTiptapNode(node, `preview-content-${index}`)
                  )}
                </div>
              ) : (
                <>
                  <h2>Course content preview</h2>
                  <p>Add topic content from admin editor to view here.</p>
                </>
              )}
            </article>
          </main>
        </div>
      )}
    </section>
  );
}
