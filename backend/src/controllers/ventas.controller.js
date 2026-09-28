const prisma = require('../utils/prisma')
const { ok, paginated, err } = require('../utils/response')

const include = {
  detalle: { include: { producto: { select: { id: true, nombre: true } } } },
  cliente: { include: { usuario: { select: { nombre: true, email: true } } } },
  caja: { select: { id: true } }
}

async function getVentas(req, res) {
  const { page = 1, limit = 20, estado } = req.query
  const skip  = (Number(page) - 1) * Number(limit)
  const where = estado ? { estado } : {}
  const [total, data] = await Promise.all([
    prisma.venta.count({ where }),
    prisma.venta.findMany({ where, skip, take: Number(limit), orderBy: { created_at: 'desc' }, include })
  ])
  return paginated(res, data, total, page, limit)
}

async function getVenta(req, res) {
  const v = await prisma.venta.findUnique({ where: { id: Number(req.params.id) }, include })
  if (!v) return err(res, 'Venta no encontrada', 404)
  return ok(res, v)
}

async function createVenta(req, res) {
  const { cliente_id, caja_id, descuento = 0, observaciones, items } = req.body
  if (!items?.length) return err(res, 'Debes incluir al menos un producto')

  let subtotal = 0
  const detalles = []
  for (const item of items) {
    const p = await prisma.producto.findUnique({ where: { id: item.producto_id } })
    if (!p) return err(res, `Producto ${item.producto_id} no encontrado`)
    if (item.cantidad > p.stock) return err(res, `Stock insuficiente para "${p.nombre}"`)
    const precio = Number(p.precio_oferta ?? p.precio)
    const sub = precio * item.cantidad
    subtotal += sub
    detalles.push({ producto_id: p.id, cantidad: item.cantidad, precio_unit: precio, subtotal: sub })
  }
  const total = Math.max(0, subtotal - Number(descuento))

  const venta = await prisma.venta.create({
    data: {
      cliente_id: cliente_id ? Number(cliente_id) : null,
      caja_id:    caja_id    ? Number(caja_id)    : null,
      total, descuento: Number(descuento), observaciones,
      detalle: { create: detalles }
    },
    include
  })

  // Restar stock
  for (const item of items) {
    await prisma.producto.update({
      where: { id: item.producto_id },
      data:  { stock: { decrement: item.cantidad } }
    })
  }

  // Actualizar total de la caja
  if (caja_id) {
    await prisma.caja.update({
      where: { id: Number(caja_id) },
      data:  { total_ventas: { increment: total } }
    })
  }

  return ok(res, venta, 201)
}

async function cancelarVenta(req, res) {
  const venta = await prisma.venta.findUnique({ where: { id: Number(req.params.id) }, include })
  if (!venta) return err(res, 'Venta no encontrada', 404)
  if (venta.estado === 'CANCELADA') return err(res, 'La venta ya está cancelada')

  // Devolver stock
  for (const d of venta.detalle) {
    await prisma.producto.update({
      where: { id: d.producto_id },
      data:  { stock: { increment: d.cantidad } }
    })
  }

  // Revertir de caja
  if (venta.caja_id) {
    await prisma.caja.update({
      where: { id: venta.caja_id },
      data:  { total_ventas: { decrement: Number(venta.total) } }
    })
  }

  const v = await prisma.venta.update({
    where: { id: venta.id },
    data:  { estado: 'CANCELADA' },
    include
  })
  return ok(res, v)
}

module.exports = { getVentas, getVenta, createVenta, cancelarVenta }
