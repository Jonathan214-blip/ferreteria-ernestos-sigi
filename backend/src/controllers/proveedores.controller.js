const prisma = require('../utils/prisma')
const { ok, paginated, err } = require('../utils/response')

async function getProveedores(req, res) {
  const { page = 1, limit = 20, buscar } = req.query
  const skip = (Number(page) - 1) * Number(limit)
  const where = buscar ? {
    OR: [
      { nombre:   { contains: buscar, mode: 'insensitive' } },
      { contacto: { contains: buscar, mode: 'insensitive' } },
    ]
  } : {}
  const [total, data] = await Promise.all([
    prisma.proveedor.count({ where }),
    prisma.proveedor.findMany({ where, skip, take: Number(limit), orderBy: { nombre: 'asc' } })
  ])
  return paginated(res, data, total, page, limit)
}

async function getProveedor(req, res) {
  const p = await prisma.proveedor.findUnique({ where: { id: Number(req.params.id) } })
  if (!p) return err(res, 'Proveedor no encontrado', 404)
  return ok(res, p)
}

async function createProveedor(req, res) {
  const { nombre, contacto, telefono, email, direccion } = req.body
  if (!nombre) return err(res, 'Nombre requerido')
  const p = await prisma.proveedor.create({ data: { nombre, contacto, telefono, email, direccion } })
  return ok(res, p, 201)
}

async function updateProveedor(req, res) {
  const { nombre, contacto, telefono, email, direccion, activo } = req.body
  const p = await prisma.proveedor.update({ where: { id: Number(req.params.id) }, data: { nombre, contacto, telefono, email, direccion, activo } })
  return ok(res, p)
}

async function deleteProveedor(req, res) {
  await prisma.proveedor.delete({ where: { id: Number(req.params.id) } })
  return ok(res, { id: Number(req.params.id) })
}

module.exports = { getProveedores, getProveedor, createProveedor, updateProveedor, deleteProveedor }
