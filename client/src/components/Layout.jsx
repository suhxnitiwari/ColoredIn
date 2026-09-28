import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import Icon from './Icon.jsx';

const navClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-full px-4 py-2 font-display text-[15px] transition ${
    isActive ? 'bg-white text-grape-600 shadow-sm ring-1 ring-lilac-200' : 'text-plum-800 hover:bg-white/60'
  }`;

export default function Layout() {
  const { user } = useAuth();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-lilac-200/60 bg-lilac-50/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="h-11 w-auto" />
            <span className="leading-none">
              <span className="block font-display text-xl font-semibold tracking-tight text-plum-900">ColoredIn</span>
              <span className="hidden font-display text-xs text-grape-600 sm:block">Color Your Future</span>
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-1">
            <NavLink to="/" end className={navClass}><Icon name="compass" size={18} /><span className="hidden sm:inline">Explore</span></NavLink>
            <NavLink to="/my-gallery" className={navClass}><Icon name="gallery" size={18} /><span className="hidden sm:inline">My Gallery</span></NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={navClass}><Icon name="shield" size={18} /><span className="hidden sm:inline">Admin</span></NavLink>
            )}
            {user ? (
              <a href="/auth/logout" className="ml-1 flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm text-plum-700 hover:bg-white/60" title="Log out">
                <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-blush-300 font-display text-plum-900">
                  {user.avatar_url ? <img src={user.avatar_url} alt="" referrerPolicy="no-referrer" /> : user.name?.[0] ?? '?'}
                </span>
                <Icon name="logout" size={16} />
              </a>
            ) : (
              <Link to="/login" className="btn-primary ml-1 !px-4 !py-2 text-sm">Log in</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
