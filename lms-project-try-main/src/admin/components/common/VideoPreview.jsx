import React from 'react';
import './VideoPreview.css';

export default function VideoPreview({ videoUrl, onClose }) {
  return (
    <div className="video-preview-modal" onClick={onClose}>
      <div className="video-preview-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>✕</button>
        
        {videoUrl && (
          <>
            {videoUrl.includes('youtu') ? (
              // YouTube
              <iframe
                width="100%"
                height="500"
                src={`https://www.youtube.com/embed/${extractYoutubeId(videoUrl)}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : videoUrl.includes('vimeo') ? (
              // Vimeo
              <iframe
                width="100%"
                height="500"
                src={`https://player.vimeo.com/video/${extractVimeoId(videoUrl)}`}
                allow="autoplay; fullscreen"
                allowFullScreen
              ></iframe>
            ) : (
              // Direct video file
              <video width="100%" height="500" controls>
                <source src={videoUrl} />
                Your browser does not support the video tag.
              </video>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Helper functions
function extractYoutubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

function extractVimeoId(url) {
  const regExp = /vimeo\.com\/(\d+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}
