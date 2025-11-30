// SVG Icons
const GridIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const ListIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <circle cx="4" cy="6" r="1.5" fill="currentColor" />
    <circle cx="4" cy="12" r="1.5" fill="currentColor" />
    <circle cx="4" cy="18" r="1.5" fill="currentColor" />
  </svg>
);

function ViewToggle({ viewMode, onToggle }) {
  return (
    <div className="flex items-center glass-strong rounded-xl p-1">
      <button
        onClick={() => onToggle('card')}
        className={`p-2.5 rounded-lg transition-all ${
          viewMode === 'card' 
            ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' 
            : 'text-slate-400 hover:text-white'
        }`}
        title="Card View"
      >
        <GridIcon className="w-5 h-5" />
      </button>
      <button
        onClick={() => onToggle('grid')}
        className={`p-2.5 rounded-lg transition-all ${
          viewMode === 'grid' 
            ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' 
            : 'text-slate-400 hover:text-white'
        }`}
        title="List View"
      >
        <ListIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

export default ViewToggle;
