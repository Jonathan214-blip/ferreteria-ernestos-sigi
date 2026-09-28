const jwt = require('jsonwebtoken')

/**
 * Verifica el JWT. Adjunta req.user = { id, email, rol, cliente_id? }
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token requerido' })
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload
    next()
  } catch {
    return res.status(403).json({ message: 'Token inválido o expirado' })
  }
}

/**
 * Genera un middleware que acepta solo ciertos roles.
 * Úsalo DESPUÉS de authMiddleware.
 */
function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'No autenticado' })
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ message: 'Permisos insuficientes' })
    }
    next()
  }
}

module.exports = { authMiddleware, authorizeRole }
