import React, { useState, useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { lessonContentImageExtension } from './LessonContentImageExtension';
import { adminUploadService } from '../../services/adminUploadService';
import './LessonContentModal.css';

const EMPTY_DOC = { type: 'doc', content: [] };

export default function LessonContentModal({ isOpen, initialContent, topicTitle, lessonTitle, onSave, onClose }) {
  const displayTitle = topicTitle || lessonTitle;
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = React.useRef(null);

  const extensions = useMemo(
    () => [
      // StarterKit already includes link + underline in this setup.
      // Keep a single source of truth to avoid duplicate extension warnings.
      StarterKit.configure({ codeBlock: false, horizontalRule: false, link: { openOnClick: false } }),
      lessonContentImageExtension,
    ],
    []
  );

  const editor = useEditor({
    extensions,
    content: EMPTY_DOC,
  });

  useEffect(() => {
    if (editor && isOpen) {
      editor.commands.setContent(initialContent || EMPTY_DOC, false);
    }
  }, [isOpen, editor]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!editor) return;
    onSave(editor.getJSON());
  };

  const handleInsertImage = () => {
    const url = imageUrl.trim();
    if (!url || !editor) return;
    editor.chain().focus().setImage({ src: url, alt: 'Topic image' }).run();
    setImageUrl('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editor) return;
    if (!file.type.startsWith('image/')) return;

    setUploadingImage(true);
    try {
      const result = await adminUploadService.uploadFile(file, { folder: 'lesson-images' });
      const url = result?.data?.url;
      if (url) {
        editor.chain().focus().setImage({ src: url, alt: file.name || 'Topic image' }).run();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Image upload failed', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSetLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('Enter URL:', prev);
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
    }
  };

  const headingLevel = editor?.isActive('heading', { level: 2 })
    ? '2'
    : editor?.isActive('heading', { level: 3 })
      ? '3'
      : editor?.isActive('heading', { level: 4 })
        ? '4'
        : '0';

  return (
    <div className="lcm-overlay" onClick={onClose}>
      <div className="lcm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="lcm-header">
          <div className="lcm-header-left">
            <button className="lcm-close" onClick={onClose} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
            <div>
              <h2 className="lcm-title">Content Editor</h2>
              {displayTitle && <p className="lcm-subtitle">{displayTitle}</p>}
            </div>
          </div>
          <div className="lcm-header-actions">
            <button className="lcm-btn-cancel" onClick={onClose}>Cancel</button>
            <button className="lcm-btn-save" onClick={handleSave}>Save Content</button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="lcm-toolbar">
          <div className="lcm-tool-group">
            <button
              className="lcm-tool"
              onClick={() => editor?.chain().focus().undo().run()}
              title="Undo"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h13a5 5 0 0 1 0 10H3" /><polyline points="7 6 3 10 7 14" /></svg>
            </button>
            <button
              className="lcm-tool"
              onClick={() => editor?.chain().focus().redo().run()}
              title="Redo"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10H8a5 5 0 0 0 0 10h13" /><polyline points="17 6 21 10 17 14" /></svg>
            </button>
          </div>

          <span className="lcm-tool-divider" />

          <select
            className="lcm-tool-select"
            value={headingLevel}
            onChange={(e) => {
              const level = Number(e.target.value);
              if (level === 0) editor?.chain().focus().setParagraph().run();
              else editor?.chain().focus().setHeading({ level }).run();
            }}
          >
            <option value="0">Paragraph</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
            <option value="4">Heading 4</option>
          </select>

          <span className="lcm-tool-divider" />

          <div className="lcm-tool-group">
            <button
              className={`lcm-tool lcm-tool-bold${editor?.isActive('bold') ? ' is-active' : ''}`}
              onClick={() => editor?.chain().focus().toggleBold().run()}
              title="Bold"
            >
              B
            </button>
            <button
              className={`lcm-tool lcm-tool-italic${editor?.isActive('italic') ? ' is-active' : ''}`}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              title="Italic"
            >
              I
            </button>
            <button
              className={`lcm-tool lcm-tool-underline${editor?.isActive('underline') ? ' is-active' : ''}`}
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              title="Underline"
            >
              U
            </button>
          </div>

          <span className="lcm-tool-divider" />

          <div className="lcm-tool-group">
            <button
              className={`lcm-tool${editor?.isActive('bulletList') ? ' is-active' : ''}`}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              title="Bullet list"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="3" cy="6" r="1.5" fill="currentColor" /><circle cx="3" cy="12" r="1.5" fill="currentColor" /><circle cx="3" cy="18" r="1.5" fill="currentColor" /></svg>
            </button>
            <button
              className={`lcm-tool${editor?.isActive('orderedList') ? ' is-active' : ''}`}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              title="Numbered list"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" /><path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" /></svg>
            </button>
            <button
              className={`lcm-tool${editor?.isActive('link') ? ' is-active' : ''}`}
              onClick={handleSetLink}
              title="Insert link"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
            </button>
          </div>

          <span className="lcm-tool-divider" />

          <button
            className="lcm-tool"
            onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
            title="Clear formatting"
          >
            Clear
          </button>
        </div>

        {/* Editor body */}
        <div className="lcm-body">
          <EditorContent editor={editor} className="lcm-editor-content" />
        </div>

        {/* Image insert bar */}
        <div className="lcm-image-bar">
          {/* File upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <button
            type="button"
            className={`lcm-upload-btn${uploadingImage ? ' uploading' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            title="Upload image from device"
          >
            {uploadingImage ? (
              <span className="lcm-upload-spinner" />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            )}
            Upload
          </button>

          <span className="lcm-image-or">or</span>

          <input
            className="lcm-image-input"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Paste image URL…"
            onKeyDown={(e) => e.key === 'Enter' && handleInsertImage()}
          />
          <button className="lcm-image-btn" onClick={handleInsertImage}>
            Insert URL
          </button>
        </div>
      </div>
    </div>
  );
}
