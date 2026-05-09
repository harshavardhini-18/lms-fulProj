import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { lessonContentImageExtension } from './LessonContentImageExtension';

const EMPTY_DOC = { type: 'doc', content: [] };

export default function LessonInlineContentEditor({ value, onChange }) {
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const lastAppliedRef = useRef('');

  const extensions = useMemo(
    () => [
      StarterKit.configure({ horizontalRule: false, link: { openOnClick: false } }),
      lessonContentImageExtension,
    ],
    []
  );

  const editor = useEditor({
    extensions,
    content: value || EMPTY_DOC,
    onUpdate: ({ editor: tiptapEditor }) => {
      onChange?.(tiptapEditor.getJSON());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const incoming = JSON.stringify(value || EMPTY_DOC);
    if (incoming === lastAppliedRef.current) return;
    const current = JSON.stringify(editor.getJSON());
    if (incoming !== current) {
      lastAppliedRef.current = incoming;
      editor.commands.setContent(value || EMPTY_DOC, false);
    }
  }, [editor, value]);

  const setLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('Enter URL:', prev);
    if (url === null) return;
    if (!url.trim()) editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  const insertImageByUrl = () => {
    if (!editor) return;
    const url = imageUrl.trim();
    if (!url) return;
    editor.chain().focus().setImage({ src: url, alt: 'Topic image' }).run();
    setImageUrl('');
  };

  const onFileUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editor || !file.type.startsWith('image/')) return;
    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      editor.chain().focus().setImage({ src: ev.target?.result, alt: file.name || 'Topic image' }).run();
      setUploadingImage(false);
    };
    reader.onerror = () => setUploadingImage(false);
    reader.readAsDataURL(file);
  };

  const headingLevel = editor?.isActive('heading', { level: 2 })
    ? '2'
    : editor?.isActive('heading', { level: 3 })
      ? '3'
      : editor?.isActive('heading', { level: 4 })
        ? '4'
        : '0';

  return (
    <div className="lf-inline-editor-wrap">
      <div className="lf-inline-toolbar">
        <div className="lf-inline-group">
          <button type="button" className="lf-inline-tool" onClick={() => editor?.chain().focus().undo().run()} title="Undo">
            ↶
          </button>
          <button type="button" className="lf-inline-tool" onClick={() => editor?.chain().focus().redo().run()} title="Redo">
            ↷
          </button>
        </div>

        <span className="lf-inline-divider" />

        <select
          className="lf-inline-select"
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

        <span className="lf-inline-divider" />

        <div className="lf-inline-group">
          <button type="button" className={`lf-inline-tool${editor?.isActive('bold') ? ' active' : ''}`} onClick={() => editor?.chain().focus().toggleBold().run()}>B</button>
          <button type="button" className={`lf-inline-tool${editor?.isActive('italic') ? ' active' : ''}`} onClick={() => editor?.chain().focus().toggleItalic().run()}>I</button>
          <button type="button" className={`lf-inline-tool${editor?.isActive('bulletList') ? ' active' : ''}`} onClick={() => editor?.chain().focus().toggleBulletList().run()}>•</button>
          <button type="button" className={`lf-inline-tool${editor?.isActive('orderedList') ? ' active' : ''}`} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1.</button>
          <button type="button" className={`lf-inline-tool${editor?.isActive('codeBlock') ? ' active' : ''}`} onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>{'</>'}</button>
          <button type="button" className={`lf-inline-tool${editor?.isActive('link') ? ' active' : ''}`} onClick={setLink}>🔗</button>
          <button type="button" className="lf-inline-tool" onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}>Clear</button>
        </div>
      </div>

      <div className="lf-inline-body">
        <EditorContent editor={editor} className="lf-inline-content" />
      </div>

      <div className="lf-inline-imagebar">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
          className="lf-file-input"
          onChange={onFileUpload}
        />
        <button
          type="button"
          className="lf-inline-upload"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage}
        >
          {uploadingImage ? 'Uploading…' : 'Upload'}
        </button>
        <span className="lf-inline-or">or</span>
        <input
          type="text"
          className="lf-inline-image-input"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Paste image URL…"
          onKeyDown={(e) => e.key === 'Enter' && insertImageByUrl()}
        />
        <button type="button" className="lf-inline-insert" onClick={insertImageByUrl}>
          Insert URL
        </button>
      </div>
    </div>
  );
}
