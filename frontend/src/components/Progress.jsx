const ERA_LABELS = [
  'Caveman',
  'Ancient Egypt',
  'Ancient Rome',
  'Medieval Knight',
  'Renaissance',
  'Victorian Era',
  '1970s Disco',
  'Modern Day',
];

const ERA_EMOJIS = ['🦣', '🏛️', '🏺', '⚔️', '🎨', '🎩', '🕺', '📸'];

export default function Progress({ completedEras, total }) {
  const completedIds = new Set(completedEras.map((e) => e.id));

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white mb-2">Generating your eras…</h2>
        <p className="text-gray-400 text-sm">
          {completedEras.length} of {total} complete
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className="bg-purple-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${(completedEras.length / total) * 100}%` }}
        />
      </div>

      {/* Era grid */}
      <div className="grid grid-cols-4 gap-3 w-full">
        {ERA_LABELS.map((label, i) => {
          const eraId = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          const completed = completedEras.find((e) => e.index === i);
          const isComplete = !!completed;

          return (
            <div
              key={i}
              className={`relative rounded-xl overflow-hidden aspect-square flex flex-col items-center justify-center
                transition-all duration-500
                ${isComplete ? 'bg-gray-800' : 'bg-gray-900 border border-gray-800'}`}
            >
              {isComplete ? (
                <>
                  <img
                    src={completed.imageUrl}
                    alt={label}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <span className="absolute bottom-1 left-0 right-0 text-center text-white text-xs font-semibold px-1">
                    {label}
                  </span>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl opacity-30">{ERA_EMOJIS[i]}</span>
                  <span className="text-gray-600 text-xs">{label}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
