const prisma = require('../utils/prisma')
const { ok, paginated, err } = require('../utils/response')

async function getClientes(req, res) {
  const { page = 1, limit = 20, buscar } = req.query
  const skip = (Number(page) - 1) * Number(limit)
  const where = buscar ? {
    OR: [
      { usuario: { nombre: { contains: buscar, mode: 'insensitive' } } },
      { usuario: { email:  { contains: buscar, mode: 'insensitive' } } },
      { telefono:           { contains: buscar, mode: 'insensitive' } },
    ]
  } : {}
  const [total, data] = await Promise.all([
    prisma.cliente.count({ where }),
    prisma.cliente.findMany({
      where, skip, take: Number(limit),
      orderBy: { created_at: 'desc' },
      include: { usuario: { select: { id: true, nombre: true, email: true } } }
    })
  ])
  return paginated(res, data, total, page, limit)
}

async function getCliente(req, res) {
  const c = await prisma.cliente.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      usuario: { select: { id: true, nombre: true, email: true } },
      pedidos: {
        take: 6,
        orderBy: { created_at: 'desc' },
        include: { detalle_pedido: { include: { productos: true } } }
      }
    }
  })
  if (!c) return err(res, 'Cliente no encontrado', 404)
  return ok(res, c)
}

async function createCliente(req, res) {
  const { nombre, email, telefono, direccion } = req.body
  const bcrypt = require('bcryptjs')
  const hash   = await bcrypt.hash('Cliente123!', 10)
  const user   = await prisma.usuario.create({
    data: { nombre, email, password: hash, rol: 'CLIENTE',
      cliente: { create: { telefono, direccion } }
    },
    include: { cliente: true }
  })
  return ok(res, user.cliente, 201)
}

async function updateCliente(req, res) {
  const { telefono, direccion } = req.body
  const c = await prisma.cliente.update({
    where: { id: Number(req.params.id) },
    data: { telefono, direccion }
  })
  return ok(res, c)
}

async function deleteCliente(req, res) {
  const c = await prisma.cliente.findUnique({ where: { id: Number(req.params.id) } })
  if (!c) return err(res, 'Cliente no encontrado', 404)
  await prisma.usuario.delete({ where: { id: c.usuario_id } })
  return ok(res, { id: Number(req.params.id) })
}

module.exports = { getClientes, getCliente, createCliente, updateCliente, deleteCliente }
