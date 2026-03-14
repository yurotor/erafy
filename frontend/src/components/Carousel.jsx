import { useState, useEffect } from 'react';

const INTERVAL_MS = 4000;

export default function Carousel({ images, videoUrl }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(null);
  const [fading, setFading] = useState(false);
  const [shareToast, setShareToast] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setPrevIndex(activeIndex);
      setFading(true);
      setTimeout(() => {
        setActiveIndex((i) => (i + 1) % images.length);
        setFading(false);
        setPrevIndex(null);
      }, 500);
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  }, [activeIndex, images.length]);

  useEffect(() => {
    if (!shareToast) return;
    const t = setTimeout(() => setShareToast(null), 3000);
    return () => clearTimeout(t);
  }, [shareToast]);

  const active = images[activeIndex];
  const shareUrl = videoUrl ? window.location.origin + videoUrl : '';

  function handleDownload() {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = 'erafy-through-the-ages.mp4';
    a.click();
  }

  function handleShareX() {
    const text = encodeURIComponent('Check out my eras on Erafy!');
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  }

  function handleShareFacebook() {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  }

  function handleShareInstagram() {
    handleDownload();
    setShareToast('Video downloaded — share it on Instagram!');
  }

  function handleShareTikTok() {
    handleDownload();
    setShareToast('Video downloaded — share it on TikTok!');
  }

  return (
    <div className="w-full max-w-lg flex flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white mb-1">Your Eras</h2>
        <p className="text-gray-400 text-sm">Auto-cycling through time</p>
      </div>

      {/* Main carousel */}
      <div className="relative w-80 h-80 rounded-2xl overflow-hidden bg-gray-900 shadow-2xl">
        {/* Current image */}
        <img
          key={activeIndex}
          src={active.imageUrl}
          alt={active.label}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500
            ${fading ? 'opacity-0' : 'opacity-100'}`}
        />

        {/* Era label */}
        <div className="absolute top-3 left-0 right-0 flex justify-center">
          <span className="bg-black/60 text-white text-sm font-bold px-4 py-1 rounded-full backdrop-blur-sm">
            {active.label.toUpperCase()}
          </span>
        </div>

        {/* Watermark */}
        <span className="absolute bottom-2 right-3 text-white/40 text-xs">erafy.com</span>
      </div>

      {/* Era dots */}
      <div className="flex gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setPrevIndex(activeIndex);
              setFading(true);
              setTimeout(() => {
                setActiveIndex(i);
                setFading(false);
                setPrevIndex(null);
              }, 300);
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              i === activeIndex ? 'bg-purple-400 w-4' : 'bg-gray-600 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 w-full justify-center">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all
              ${i === activeIndex ? 'border-purple-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
          >
            <img src={img.imageUrl} alt={img.label} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 w-full">
        {videoUrl && (
          <button
            onClick={handleDownload}
            className="w-full py-3 rounded-xl font-semibold text-white text-lg
              bg-purple-600 hover:bg-purple-500 transition-colors flex items-center justify-center gap-2"
          >
            <span>⬇️</span> Download Video
          </button>
        )}

        {/* Social share buttons */}
        {videoUrl && (
          <div className="flex justify-center gap-4">
            {/* Instagram */}
            <button
              onClick={handleShareInstagram}
              title="Share on Instagram"
              className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-600 transition-all flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </button>

            {/* TikTok */}
            <button
              onClick={handleShareTikTok}
              title="Share on TikTok"
              className="w-10 h-10 rounded-full bg-gray-800 hover:bg-black transition-all flex items-center justify-center group"
            >
              <svg className="w-5 h-5 text-white group-hover:text-[#00f2ea]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.81a8.23 8.23 0 004.76 1.5v-3.4a4.85 4.85 0 01-1-.22z" />
              </svg>
            </button>

            {/* X (Twitter) */}
            <button
              onClick={handleShareX}
              title="Share on X"
              className="w-10 h-10 rounded-full bg-gray-800 hover:bg-black transition-all flex items-center justify-center"
            >
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>

            {/* Facebook */}
            <button
              onClick={handleShareFacebook}
              title="Share on Facebook"
              className="w-10 h-10 rounded-full bg-gray-800 hover:bg-[#1877F2] transition-all flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
          </div>
        )}

        <button
          onClick={() => window.location.reload()}
          className="w-full py-2.5 rounded-xl font-medium text-gray-300 text-sm
            border border-gray-700 hover:border-gray-500 hover:text-white transition-colors"
        >
          Try with another photo
        </button>
      </div>

      {/* Share toast */}
      {shareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-5 py-2.5 rounded-full shadow-lg animate-fade-in">
          {shareToast}
        </div>
      )}
    </div>
  );
}
