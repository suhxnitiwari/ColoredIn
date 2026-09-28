import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

export default function Login() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [providers, setProviders] = useState({ google: false, dev: false });

  useEffect(() => {
    fetch('/auth/providers').then((r) => r.json()).then(setProviders).catch(() => {});
  }, []);

  if (user) return <Navigate to="/" replace />;
  const error = params.get('error');

  return (
    <div className="mx-auto grid max-w-md place-items-center px-4 py-16">
      <div className="card w-full animate-rise p-8 text-center">
        <img src="/logo.png" alt="" className="mx-auto h-24" />
        <h1 className="mt-2 text-3xl font-semibold">Welcome back!</h1>
        <p className="mt-2 text-plum-700">Grown-ups: log in to save artwork to your child's gallery.</p>

        {error && (
          <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">
            {error === 'google_not_configured' ? 'Google login isn\'t set up on this server yet.' : 'Login didn\'t work. Please try again.'}
          </p>
        )}

        <a href="/auth/google" className={`btn-soft mt-6 w-full !py-3 ${providers.google ? '' : 'pointer-events-none opacity-40'}`}>
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
          Continue with Google
        </a>

        {providers.dev && (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-lilac-200 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-plum-700/70">Local development</p>
            <div className="flex gap-2">
              <a href="/auth/dev?role=child" className="btn-ghost flex-1 ring-1 ring-lilac-200">Kid account</a>
              <a href="/auth/dev?role=admin" className="btn-ghost flex-1 ring-1 ring-lilac-200">Admin account</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
