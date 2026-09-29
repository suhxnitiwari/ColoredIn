import Icon from './Icon.jsx';

/** Title, kid-friendly description, fun fact and a read-aloud button for one career. */
export default function CareerCard({ page, speaking, onSpeak, onClose, bare }) {
  return (
    <div className={`${bare ? '' : 'card animate-rise p-4'} relative overflow-hidden`}>
      {!bare && <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: page.category?.color }} />}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onSpeak}
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-full bg-grape-600 text-white shadow-md transition hover:bg-grape-500 active:scale-90 ${speaking ? 'animate-pulse' : ''}`}
          aria-label="Read aloud"
        >
          <Icon name="speaker" size={24} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-display text-xs uppercase tracking-wider" style={{ color: page.category?.color }}>{page.category?.name}</p>
          <h2 className="text-xl font-semibold leading-tight">{page.title}</h2>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-lilac-100" aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        )}
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-plum-800">{page.job_description}</p>
      {page.fun_fact && (
        <p className="mt-3 flex gap-2 rounded-2xl bg-lilac-50 p-3 text-sm text-plum-700">
          <Icon name="sparkle" size={18} className="mt-0.5 shrink-0 text-grape-500" />
          <span><strong className="font-bold text-plum-900">Fun fact:</strong> {page.fun_fact}</span>
        </p>
      )}
    </div>
  );
}
