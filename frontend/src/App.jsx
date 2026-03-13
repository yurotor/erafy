import { useState } from 'react';
import Upload from './components/Upload';
import Progress from './components/Progress';
import Carousel from './components/Carousel';
import './index.css';

export default function App() {
  const [screen, setScreen] = useState('upload'); // 'upload' | 'generating' | 'results'
  const [completedEras, setCompletedEras] = useState([]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  function handleUploadWithSSE(file) {
    setError(null);
    setCompletedEras([]);
    setResults(null);
    setScreen('generating');

    const formData = new FormData();
    formData.append('selfie', file);

    fetch('/api/generate', { method: 'POST', body: formData })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function processChunk({ done, value }) {
          if (done) return;
          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split('\n\n');
          buffer = parts.pop(); // keep incomplete chunk

          parts.forEach((part) => {
            const eventMatch = part.match(/^event: (\w+)/m);
            const dataMatch = part.match(/^data: (.+)/m);
            if (!eventMatch || !dataMatch) return;

            const event = eventMatch[1];
            let data;
            try {
              data = JSON.parse(dataMatch[1]);
            } catch {
              return;
            }

            if (event === 'era_complete') {
              setCompletedEras((prev) => [...prev, data]);
            } else if (event === 'done') {
              setResults(data);
              setScreen('results');
            } else if (event === 'error') {
              setError(data.message || 'Generation failed');
              setScreen('upload');
            }
          });

          reader.read().then(processChunk);
        }

        reader.read().then(processChunk);
      })
      .catch((err) => {
        setError(err.message);
        setScreen('upload');
      });
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 text-center border-b border-gray-800">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          <span className="text-purple-400">era</span>fy
        </h1>
        <p className="text-gray-400 text-sm mt-1">See yourself through the ages</p>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {error && (
          <div className="mb-6 max-w-md w-full bg-red-900/40 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {screen === 'upload' && (
          <Upload onUpload={handleUploadWithSSE} />
        )}

        {screen === 'generating' && (
          <Progress completedEras={completedEras} total={8} />
        )}

        {screen === 'results' && results && (
          <Carousel images={results.images} videoUrl={results.videoUrl} />
        )}
      </main>

      <footer className="py-4 text-center text-gray-600 text-xs border-t border-gray-800">
        erafy.com
      </footer>
    </div>
  );
}
