import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth.jsx';
import { ToastProvider } from './components/Toast.jsx';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import ColorPage from './pages/ColorPage.jsx';
import Gallery from './pages/Gallery.jsx';
import Admin from './pages/Admin.jsx';
import Login from './pages/Login.jsx';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/color/:id" element={<ColorPage />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/my-gallery" element={<Gallery />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<div className="p-10 text-center font-display text-2xl">Page not found</div>} />
          </Route>
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
