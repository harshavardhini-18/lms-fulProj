import Image from '@tiptap/extension-image';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';

function LcmImageNodeView({ node, deleteNode }) {
  return (
    <NodeViewWrapper className="lcm-img-node" contentEditable={false}>
      <img
        src={node.attrs.src}
        alt={node.attrs.alt || 'Topic image'}
        className="lcm-prose-img"
        draggable={false}
      />
      <button
        type="button"
        className="lcm-img-delete"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          deleteNode();
        }}
        title="Remove image"
        aria-label="Remove image"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </NodeViewWrapper>
  );
}

/** Image blocks with an inline delete control */
export const lessonContentImageExtension = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(LcmImageNodeView);
  },
});
