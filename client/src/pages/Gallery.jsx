import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useToast } from '../components/Toast.jsx';
import Icon from '../components/Icon.jsx';
import Modal from '../components/Modal.jsx';

export default function Gallery() {
  const { user, loading } = useAuth();
  const toast = useToast();
  const [artworks, setArtworks] = useState(null);
  const [open, setOpen] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    if (!user) return;
    api.get('/artworks').then(({ data }) => setArtworks(data)).catch((e) => toast(errorMessage(e), 'error'));
  }, [user, toast]);

  const remove = async (art) => {
    try {
      await api.delete(`/artworks/${art.id}`);
      setArtworks((list) => list.filter((a) => a.id !== art.id));
      setConfirmDelete(null);
      setOpen(null);
      toast('Picture removed.');
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  if (loading) return null;
  if (!user) {
    return (
      <Empty title="Your gallery lives here" body="Log in to save your colored pages and see them all in one place.">
        <Link to="/login" className="btn-primary">Log in</Link>
      </Empty>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-4xl font-semibold tracking-tight">My Gallery</h1>
      <p className="mt-1 text-plum-700">Every future you've colored so far.</p>

      {artworks?.length === 0 && (
        <Empty title="No pictures yet" body="Color a page and press Save. It will show up right here!">
          <Link to="/" className="btn-primary">Find a page to color</Link>
        </Empty>
      )}

      <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {(artworks ?? []).map((a, i) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setOpen(a)}
            className="card group animate-rise p-3 text-left transition hover:-translate-y-1"
            style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
          >
            <div className="aspect-square overflow-hidden rounded-2xl bg-white">
              <img src={a.colored_image_data} alt={`Colored ${a.page?.title}`} className="h-full w-full object-contain" />
            </div>
            <p className="px-1 pt-3 font-display text-lg font-semibold leading-tight">{a.page?.title}</p>
            <p className="px-1 text-sm text-plum-700">{new Date(a.saved_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </button>
        ))}
      </div>

      <Modal open={Boolean(open)} onClose={() => setOpen(null)} title={open?.page?.title} wide>
        {open && (
          <>
            <img src={open.colored_image_data} alt="" className="max-h-[60vh] w-full rounded-2xl bg-white object-contain ring-1 ring-lilac-200" />
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" className="btn-ghost text-rose-600" onClick={() => setConfirmDelete(open)}>
                <Icon name="trash" size={18} /> Delete
              </button>
              <a className="btn-soft" href={open.colored_image_data} download={`ColoredIn-${open.page?.title ?? 'art'}.png`}>
                <Icon name="download" size={18} /> Download
              </a>
              <Link className="btn-primary" to={`/color/${open.page_id}`}>Color it again</Link>
            </div>
          </>
        )}
      </Modal>

      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="Delete this picture?">
        <p className="text-plum-700">It will be gone from your gallery for good.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-soft" onClick={() => setConfirmDelete(null)}>Keep it</button>
          <button type="button" className="btn bg-rose-500 text-white hover:bg-rose-600" onClick={() => remove(confirmDelete)}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}

function Empty({ title, body, children }) {
  return (
    <div className="mx-auto mt-12 max-w-md text-center">
      <img src="/logo.png" alt="" className="mx-auto h-28 opacity-90" />
      <h2 className="mt-4 text-2xl font-semibold">{title}</h2>
      <p className="mt-2 text-plum-700">{body}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}
