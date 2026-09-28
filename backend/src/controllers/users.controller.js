const bcrypt  = require('bcryptjs')
const prisma  = require('../utils/prisma')
const { ok, paginated, err } = require('../utils/response')

// GET /api/users
async function getUsuarios(req, res) {
  const { page = 1, limit = 20, buscar, rol } = req.query
  const skip = (Number(page) - 1) * Number(limit)
  const where = {
    ...(buscar ? { OR: [
      { nombre: { contains: buscar, mode: 'insensitive' } },
      { email:  { contains: buscar, mode: 'insensitive' } },
    ]} : {}),
    ...(rol ? { rol } : {}),
  }
  const [total, users] = await Promise.all([
    prisma.usuario.count({ where }),
    prisma.usuario.findMany({
      where, skip, take: Number(limit),
      orderBy: { created_at: 'desc' },
      select: { id: true, nombre: true, email: true, rol: true, activo: true, created_at: true }
    })
  ])
  return paginated(res, users, total, page, limit)
}

// GET /api/users/roles
async function getRoles(req, res) {
  return ok(res, ['ADMIN', 'OPERADOR', 'CLIENTE'])
}

// GET /api/users/:id
async function getUsuario(req, res) {
  const user = await prisma.usuario.findUnique({
    where: { id: Number(req.params.id) },
    include: { cliente: true }
  })
  if (!user) return err(res, 'Usuario no encontrado', 404)
  return ok(res, user)
}

// DELETE /api/users/:id
async function deleteUsuario(req, res) {
  const id = Number(req.params.id)
  if (id === req.user.id) return err(res, 'No puedes eliminarte a ti mismo')
  await prisma.usuario.delete({ where: { id } })
  return ok(res, { id })
}

module.exports = { getUsuarios, getRoles, getUsuario, deleteUsuario }
