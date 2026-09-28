const prisma = require('../utils/prisma')
const { ok, paginated, err } = require('../utils/response')

async function getDescuentos(req, res) {
  const { page = 1, limit = 20, activo } = req.query
  const skip  = (Number(page) - 1) * Number(limit)
  const where = activo !== undefined ? { activo: activo === 'true' } : {}
  const [total, data] = await Promise.all([
    prisma.descuento.count({ where }),
    prisma.descuento.findMany({ where, skip, take: Number(limit), orderBy: { created_at: 'desc' } })
  ])
  return paginated(res, data, total, page, limit)
}

async function getDescuento(req, res) {
  const d = await prisma.descuento.findUnique({ where: { id: Number(req.params.id) } })
  if (!d) return err(res, 'Descuento no encontrado', 404)
  return ok(res, d)
}

async function createDescuento(req, res) {
  const { nombre, tipo, valor, minimo, primera_compra, activo, inicio, fin } = req.body
  if (!nombre || !tipo || valor == null) return err(res, 'Datos requeridos')
  const d = await prisma.descuento.create({
    data: { nombre, tipo, valor: Number(valor), minimo: minimo ? Number(minimo) : null,
            primera_compra: !!primera_compra, activo: activo !== false,
            inicio: inicio ? new Date(inicio) : null, fin: fin ? new Date(fin) : null }
  })
  return ok(res, d, 201)
}

async function updateDescuento(req, res) {
  const { nombre, tipo, valor, minimo, primera_compra, activo, inicio, fin } = req.body
  const d = await prisma.descuento.update({
    where: { id: Number(req.params.id) },
    data: { nombre, tipo, ...(valor != null ? { valor: Number(valor) } : {}),
            minimo: minimo ? Number(minimo) : null, primera_compra: !!primera_compra,
            activo, inicio: inicio ? new Date(inicio) : null, fin: fin ? new Date(fin) : null }
  })
  return ok(res, d)
}

async function deleteDescuento(req, res) {
  await prisma.descuento.delete({ where: { id: Number(req.params.id) } })
  return ok(res, { id: Number(req.params.id) })
}

async function verificarPrimeraCompra(req, res) {
  const { cliente_id } = req.query
  if (!cliente_id) return err(res, 'cliente_id requerido')
  const count = await prisma.pedido.count({ where: { cliente_id: Number(cliente_id), estado: { not: 'CANCELADO' } } })
  return ok(res, { primera_compra: count === 0 })
}

module.exports = { getDescuentos, getDescuento, createDescuento, updateDescuento, deleteDescuento, verificarPrimeraCompra }
