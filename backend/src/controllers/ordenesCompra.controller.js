const prisma = require('../utils/prisma')
const { ok, paginated, err } = require('../utils/response')

const include = {
  proveedor: { select: { id: true, nombre: true } },
  detalle: { include: { producto: { select: { id: true, nombre: true } } } }
}

async function getOrdenes(req, res) {
  const { page = 1, limit = 20, estado } = req.query
  const skip  = (Number(page) - 1) * Number(limit)
  const where = estado ? { estado } : {}
  const [total, data] = await Promise.all([
    prisma.ordenCompra.count({ where }),
    prisma.ordenCompra.findMany({ where, skip, take: Number(limit), orderBy: { created_at: 'desc' }, include })
  ])
  return paginated(res, data, total, page, limit)
}

async function getOrden(req, res) {
  const o = await prisma.ordenCompra.findUnique({ where: { id: Number(req.params.id) }, include })
  if (!o) return err(res, 'Orden no encontrada', 404)
  return ok(res, o)
}

async function createOrden(req, res) {
  const { proveedor_id, notas, items } = req.body
  if (!proveedor_id || !items?.length) return err(res, 'proveedor_id e items requeridos')

  let total = 0
  const detalles = items.map(i => {
    const sub = Number(i.precio_unit) * i.cantidad
    total += sub
    return { producto_id: i.producto_id, cantidad: i.cantidad, precio_unit: Number(i.precio_unit) }
  })

  const orden = await prisma.ordenCompra.create({
    data: { proveedor_id: Number(proveedor_id), total, notas, detalle: { create: detalles } },
    include
  })
  return ok(res, orden, 201)
}

async function recibirOrden(req, res) {
  const orden = await prisma.ordenCompra.findUnique({ where: { id: Number(req.params.id) }, include })
  if (!orden) return err(res, 'Orden no encontrada', 404)
  if (orden.estado !== 'PENDIENTE') return err(res, 'La orden ya fue procesada')

  // Actualizar stock de cada producto
  for (const d of orden.detalle) {
    await prisma.producto.update({
      where: { id: d.producto_id },
      data:  { stock: { increment: d.cantidad } }
    })
    await prisma.movimiento.create({
      data: {
        producto_id:   d.producto_id,
        usuario_id:    req.user.id,
        tipo:          'ENTRADA',
        cantidad:      d.cantidad,
        stock_antes:   0,  // simplificado
        stock_despues: 0,
        motivo:        `Orden de compra #${orden.id}`
      }
    })
  }

  const o = await prisma.ordenCompra.update({
    where: { id: orden.id },
    data:  { estado: 'RECIBIDA', recibida_at: new Date() },
    include
  })
  return ok(res, o)
}

module.exports = { getOrdenes, getOrden, createOrden, recibirOrden }
