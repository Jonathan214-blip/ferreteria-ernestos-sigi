const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const prisma = require('../utils/prisma')
const { ok, err } = require('../utils/response')

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, rol: user.rol, cliente_id: user.cliente?.id ?? null },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body
  if (!email || !password) return err(res, 'Email y contraseña requeridos')

  const user = await prisma.usuario.findUnique({
    where: { email },
    include: { cliente: { select: { id: true } } }
  })
  if (!user || !user.activo) return err(res, 'Credenciales inválidas', 401)

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return err(res, 'Credenciales inválidas', 401)

  const token = signToken(user)
  // Devolver token en raíz para compatibilidad con AuthContext (busca data.token)
  res.json({
    ok: true,
    token,
    user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, cliente_id: user.cliente?.id ?? null }
  })
}

// POST /api/auth/register  (registro público → rol CLIENTE)
async function register(req, res) {
  const { nombre, email, password } = req.body
  if (!nombre || !email || !password) return err(res, 'Todos los campos son requeridos')

  const exists = await prisma.usuario.findUnique({ where: { email } })
  if (exists) return err(res, 'El email ya está registrado')

  const hash = await bcrypt.hash(password, 10)
  const user = await prisma.usuario.create({
    data: { nombre, email, password: hash, rol: 'CLIENTE',
      cliente: { create: {} }
    },
    include: { cliente: { select: { id: true } } }
  })

  const token = signToken(user)
  res.status(201).json({
    ok: true,
    token,
    user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, cliente_id: user.cliente?.id ?? null }
  })
}

// POST /api/auth/register-cliente  (alias público del registro)
const registerCliente = register

// GET /api/auth/me
async function me(req, res) {
  const user = await prisma.usuario.findUnique({
    where: { id: req.user.id },
    include: { cliente: { select: { id: true, telefono: true, direccion: true } } }
  })
  if (!user) return err(res, 'Usuario no encontrado', 404)
  return ok(res, {
    id: user.id, nombre: user.nombre, email: user.email,
    rol: user.rol, cliente_id: user.cliente?.id ?? null,
    telefono: user.cliente?.telefono ?? null,
    direccion: user.cliente?.direccion ?? null,
  })
}

// PUT /api/auth/perfil
async function updatePerfil(req, res) {
  const { nombre, telefono, direccion } = req.body
  const user = await prisma.usuario.update({
    where: { id: req.user.id },
    data: { nombre, updated_at: new Date() }
  })
  if (req.user.cliente_id) {
    await prisma.cliente.update({
      where: { id: req.user.cliente_id },
      data: { telefono, direccion }
    })
  }
  return ok(res, { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol })
}

module.exports = { login, register, registerCliente, me, updatePerfil }
