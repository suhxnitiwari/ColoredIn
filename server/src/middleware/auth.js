export function requireAuth(req, res, next) {
  if (req.user) return next();
  res.status(401).json({ error: 'Please log in first.' });
}

export function requireAdmin(req, res, next) {
  if (req.user?.role === 'admin') return next();
  res.status(403).json({ error: 'Admins only.' });
}
