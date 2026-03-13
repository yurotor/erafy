import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

export default function Upload({ onUpload }) {
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  function handleGenerate() {
    if (selectedFile) onUpload(selectedFile);
  }

  return (
    <div className="w-full max-w-lg flex flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white mb-2">Upload your selfie</h2>
        <p className="text-gray-400 text-sm">
          We'll generate you across 8 historical eras
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`w-full border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors
          ${isDragActive
            ? 'border-purple-500 bg-purple-900/20'
            : 'border-gray-700 hover:border-purple-600 bg-gray-900/50'
          }`}
      >
        <input {...getInputProps()} />

        {preview ? (
          <div className="flex flex-col items-center gap-4">
            <img
              src={preview}
              alt="Preview"
              className="w-40 h-40 object-cover rounded-xl border border-gray-700"
            />
            <p className="text-gray-400 text-sm">Drop a different photo to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="text-5xl">🤳</div>
            <p className="text-gray-300 font-medium">
              {isDragActive ? 'Drop it here!' : 'Drag & drop your selfie'}
            </p>
            <p className="text-gray-500 text-sm">or click to browse</p>
            <p className="text-gray-600 text-xs mt-2">JPG, PNG, WEBP — max 10MB</p>
          </div>
        )}
      </div>

      <button
        onClick={handleGenerate}
        disabled={!selectedFile}
        className="w-full py-3 rounded-xl font-semibold text-white text-lg
          bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed
          transition-colors"
      >
        Generate My Eras ✨
      </button>
    </div>
  );
}
