import { useState, useEffect } from 'react';

const INTERVAL_MS = 4000;

export default function Carousel({ images, videoUrl }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(null);
  const [fading, setFading] = useState(false);

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

  const active = images[activeIndex];

  function handleDownload() {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = 'erafy-through-the-ages.mp4';
    a.click();
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
        <button
          onClick={() => window.location.reload()}
          className="w-full py-2.5 rounded-xl font-medium text-gray-300 text-sm
            border border-gray-700 hover:border-gray-500 hover:text-white transition-colors"
        >
          Try with another photo
        </button>
      </div>
    </div>
  );
}
