import { useEffect, useRef } from 'react';

export default function Modal({ open, onClose, title, children, wide }) {
  const ref = useRef(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`m-auto w-[calc(100%-2rem)] rounded-3xl bg-white p-0 text-plum-900 shadow-2xl backdrop:bg-plum-900/40 backdrop:backdrop-blur-sm ${wide ? 'max-w-3xl' : 'max-w-md'}`}
    >
      {open && (
        <div className="animate-rise p-6">
          <h2 className="mb-2 text-2xl font-semibold">{title}</h2>
          {children}
        </div>
      )}
    </dialog>
  );
}
