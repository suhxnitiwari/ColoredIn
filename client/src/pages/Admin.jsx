import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api, { errorMessage } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useToast } from '../components/Toast.jsx';
import Icon from '../components/Icon.jsx';
import Modal from '../components/Modal.jsx';

const TABS = [
  { id: 'pages', label: 'Coloring pages' },
  { id: 'categories', label: 'Career categories' },
  { id: 'users', label: 'Users' },
];

export default function Admin() {
  const { user, loading } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('pages');
  const [pages, setPages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null); // { kind, item }
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    try {
      const [p, c, u] = await Promise.all([api.get('/pages'), api.get('/categories'), api.get('/users')]);
      setPages(p.data);
      setCategories(c.data);
      setUsers(u.data);
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  }, [toast]);

  useEffect(() => { if (user?.role === 'admin') load(); }, [user, load]);

  if (loading) return null;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  const save = async (kind, item) => {
    const base = kind === 'page' ? '/pages' : '/categories';
    try {
      if (item.id) await api.put(`${base}/${item.id}`, item);
      else await api.post(base, item);
      toast(item.id ? 'Changes saved.' : 'Added!');
      setEditing(null);
      load();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const remove = async () => {
    const { kind, item } = deleting;
    try {
      await api.delete(`${kind === 'page' ? '/pages' : '/categories'}/${item.id}`);
      toast('Deleted.');
      setDeleting(null);
      load();
    } catch (e) {
      toast(errorMessage(e), 'error');
      setDeleting(null);
    }
  };

  const setRole = async (u, role) => {
    try {
      await api.put(`/users/${u.id}`, { role });
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, role } : x)));
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Admin dashboard</h1>
          <p className="mt-1 text-plum-700">Keep the careers accurate, inclusive, and fresh.</p>
        </div>
        {tab !== 'users' && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => setEditing(tab === 'pages'
              ? { kind: 'page', item: { title: '', job_description: '', fun_fact: '', image_url: '', audio_url: '', category_id: categories[0]?.id } }
              : { kind: 'category', item: { name: '', description: '', color: '#b867d3', sort_order: categories.length } })}
          >
            <Icon name="plus" size={20} /> {tab === 'pages' ? 'New page' : 'New category'}
          </button>
        )}
      </div>

      <div className="mt-6 inline-flex gap-1 rounded-full bg-white p-1 ring-1 ring-lilac-200" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 font-display text-sm transition ${tab === t.id ? 'bg-plum-900 text-white' : 'text-plum-800 hover:bg-lilac-100'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card mt-6 overflow-hidden">
        {tab === 'pages' && (
          <ul className="divide-y divide-lilac-100">
            {pages.map((p) => (
              <Row
                key={p.id}
                thumb={p.image_url}
                title={p.title}
                subtitle={p.category?.name}
                dot={p.category?.color}
                onEdit={() => setEditing({ kind: 'page', item: { ...p } })}
                onDelete={() => setDeleting({ kind: 'page', item: p })}
              />
            ))}
          </ul>
        )}
        {tab === 'categories' && (
          <ul className="divide-y divide-lilac-100">
            {categories.map((c) => (
              <Row
                key={c.id}
                title={c.name}
                subtitle={`${pages.filter((p) => p.category_id === c.id).length} pages · ${c.description ?? ''}`}
                dot={c.color}
                onEdit={() => setEditing({ kind: 'category', item: { ...c } })}
                onDelete={() => setDeleting({ kind: 'category', item: c })}
              />
            ))}
          </ul>
        )}
        {tab === 'users' && (
          <ul className="divide-y divide-lilac-100">
            {users.map((u) => (
              <li key={u.id} className="flex items-center gap-4 px-5 py-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-blush-300 font-display">{u.name?.[0]}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{u.name}</p>
                  <p className="truncate text-sm text-plum-700">{u.email}</p>
                </div>
                <select
                  value={u.role}
                  onChange={(e) => setRole(u, e.target.value)}
                  disabled={u.id === user.id}
                  className="rounded-full border-2 border-lilac-200 bg-white px-3 py-1.5 font-display text-sm"
                  aria-label={`Role for ${u.name}`}
                >
                  <option value="child">Child</option>
                  <option value="admin">Admin</option>
                </select>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.item.id ? 'Edit' : 'Add'} wide>
        {editing?.kind === 'page' && (
          <PageForm item={editing.item} categories={categories} onCancel={() => setEditing(null)} onSave={(item) => save('page', item)} />
        )}
        {editing?.kind === 'category' && (
          <CategoryForm item={editing.item} onCancel={() => setEditing(null)} onSave={(item) => save('category', item)} />
        )}
      </Modal>

      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Delete this?">
        <p className="text-plum-700">
          “{deleting?.item.title ?? deleting?.item.name}” will be removed
          {deleting?.kind === 'page' ? ', along with any artwork kids saved from it.' : '.'}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-soft" onClick={() => setDeleting(null)}>Cancel</button>
          <button type="button" className="btn bg-rose-500 text-white hover:bg-rose-600" onClick={remove}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}

function Row({ thumb, title, subtitle, dot, onEdit, onDelete }) {
  return (
    <li className="flex items-center gap-4 px-5 py-3">
      {thumb
        ? <img src={thumb} alt="" className="h-14 w-14 rounded-xl bg-white object-contain ring-1 ring-lilac-200" />
        : <span className="h-10 w-10 rounded-full" style={{ background: dot }} />}
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-lg font-semibold">{title}</p>
        <p className="flex items-center gap-1.5 truncate text-sm text-plum-700">
          {thumb && dot && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: dot }} />}
          {subtitle}
        </p>
      </div>
      <button type="button" onClick={onEdit} className="grid h-10 w-10 place-items-center rounded-full hover:bg-lilac-100" aria-label={`Edit ${title}`}><Icon name="edit" size={20} /></button>
      <button type="button" onClick={onDelete} className="grid h-10 w-10 place-items-center rounded-full text-rose-600 hover:bg-rose-50" aria-label={`Delete ${title}`}><Icon name="trash" size={20} /></button>
    </li>
  );
}

function PageForm({ item, categories, onSave, onCancel }) {
  const [form, setForm] = useState(item);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <form className="grid gap-4 md:grid-cols-[1fr_220px]" onSubmit={(e) => { e.preventDefault(); onSave({ ...form, category_id: Number(form.category_id) }); }}>
      <div className="grid gap-3">
        <label><span className="label">Career title</span><input className="input" required value={form.title} onChange={set('title')} placeholder="Marine Biologist" /></label>
        <label>
          <span className="label">Category</span>
          <select className="input" value={form.category_id ?? ''} onChange={set('category_id')} required>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label>
          <span className="label">Kid-friendly job description</span>
          <textarea className="input min-h-24" required value={form.job_description} onChange={set('job_description')} placeholder="Two or three short sentences a 5-year-old would understand." />
          <span className="mt-1 block text-xs text-plum-700/70">{form.job_description.split(/\s+/).filter(Boolean).length} words · aim for under 35</span>
        </label>
        <label><span className="label">Fun fact (optional)</span><input className="input" value={form.fun_fact ?? ''} onChange={set('fun_fact')} /></label>
        <label><span className="label">Line-art image URL</span><input className="input" required value={form.image_url} onChange={set('image_url')} placeholder="/pages/marine-biologist.png" /></label>
        <label><span className="label">Read-aloud audio URL (optional)</span><input className="input" value={form.audio_url ?? ''} onChange={set('audio_url')} placeholder="Leave blank to generate automatically" /></label>
      </div>
      <div>
        <span className="label">Preview</span>
        <div className="grid aspect-square place-items-center overflow-hidden rounded-2xl bg-white ring-2 ring-lilac-200">
          {form.image_url ? <img src={form.image_url} alt="" className="h-full w-full object-contain" /> : <span className="text-sm text-plum-700/60">No image yet</span>}
        </div>
        <p className="mt-2 text-xs text-plum-700/80">Use clean black line art on white. Show her actively building or creating, and vary hair types and features across pages.</p>
      </div>
      <div className="flex justify-end gap-2 md:col-span-2">
        <button type="button" className="btn-soft" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary">Save page</button>
      </div>
    </form>
  );
}

function CategoryForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState(item);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); onSave({ ...form, sort_order: Number(form.sort_order) || 0 }); }}>
      <label><span className="label">Name</span><input className="input" required value={form.name} onChange={set('name')} /></label>
      <label><span className="label">Description</span><textarea className="input min-h-20" value={form.description ?? ''} onChange={set('description')} /></label>
      <div className="grid grid-cols-2 gap-3">
        <label><span className="label">Color</span><input type="color" className="input h-12 !p-1" value={form.color} onChange={set('color')} /></label>
        <label><span className="label">Sort order</span><input type="number" className="input" value={form.sort_order} onChange={set('sort_order')} /></label>
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button type="button" className="btn-soft" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary">Save category</button>
      </div>
    </form>
  );
}
