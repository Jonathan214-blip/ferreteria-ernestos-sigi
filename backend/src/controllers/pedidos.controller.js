const prisma = require('../utils/prisma')
const { ok, paginated, err } = require('../utils/response')

const include = {
  detalle_pedido: {
    include: { productos: { select: { id: true, nombre: true, imagen: true } } }
  },
  cliente: {
    include: { usuario: { select: { id: true, nombre: true, email: true } } }
  }
}

// GET /api/pedidos  (admin/operador)
async function getPedidos(req, res) {
  const { page = 1, limit = 20, estado, buscar } = req.query
  const skip = (Number(page) - 1) * Number(limit)
  const where = {
    ...(estado ? { estado } : {}),
    ...(buscar ? {
      OR: [
        { id: isNaN(buscar) ? undefined : Number(buscar) },
        { nombre_invitado: { contains: buscar, mode: 'insensitive' } },
        { cliente: { usuario: { nombre: { contains: buscar, mode: 'insensitive' } } } },
      ].filter(Boolean)
    } : {}),
  }
  const [total, data] = await Promise.all([
    prisma.pedido.count({ where }),
    prisma.pedido.findMany({ where, skip, take: Number(limit), orderBy: { created_at: 'desc' }, include })
  ])
  return paginated(res, data, total, page, limit)
}

// GET /api/pedidos/mis-pedidos  (cliente autenticado)
async function getMisPedidos(req, res) {
  if (!req.user.cliente_id) {
    return err(res, 'Tu cuenta no tiene un perfil de cliente vinculado', 400)
  }
  const { page = 1, limit = 10 } = req.query
  const skip    = (Number(page) - 1) * Number(limit)
  const where   = { cliente_id: req.user.cliente_id }
  const [total, data] = await Promise.all([
    prisma.pedido.count({ where }),
    prisma.pedido.findMany({ where, skip, take: Number(limit), orderBy: { created_at: 'desc' }, include })
  ])
  return paginated(res, data, total, page, limit)
}

// GET /api/pedidos/:id
async function getPedido(req, res) {
  const p = await prisma.pedido.findUnique({ where: { id: Number(req.params.id) }, include })
  if (!p) return err(res, 'Pedido no encontrado', 404)
  return ok(res, p)
}

// POST /api/pedidos
async function createPedido(req, res) {
  const { cliente_id, direccion_entrega, observaciones, items } = req.body
  if (!direccion_entrega || !items?.length) return err(res, 'Datos incompletos')

  let total = 0
  const detalles = []
  for (const item of items) {
    const p = await prisma.producto.findUnique({ where: { id: item.producto_id } })
    if (!p) return err(res, `Producto ${item.producto_id} no encontrado`)
    const precio = Number(p.precio_oferta ?? p.precio)
    const sub    = precio * item.cantidad
    total += sub
    detalles.push({ producto_id: p.id, cantidad: item.cantidad, precio_unit: precio, subtotal: sub })
  }

  const pedido = await prisma.pedido.create({
    data: {
      cliente_id: cliente_id ? Number(cliente_id) : null,
      direccion_entrega, observaciones, total,
      detalle_pedido: { create: detalles }
    },
    include
  })
  return ok(res, pedido, 201)
}

// PATCH /api/pedidos/:id/estado
async function actualizarEstado(req, res) {
  const { estado } = req.body
  const p = await prisma.pedido.update({
    where: { id: Number(req.params.id) },
    data: { estado },
    include
  })
  return ok(res, p)
}

// PATCH /api/pedidos/:id/confirmar
async function confirmar(req, res) {
  const p = await prisma.pedido.update({
    where: { id: Number(req.params.id) },
    data: { estado: 'CONFIRMADO', confirmado_whatsapp: true },
    include
  })
  return ok(res, p)
}

// PATCH /api/pedidos/:id/cancelar
async function cancelar(req, res) {
  const pedido = await prisma.pedido.findUnique({ where: { id: Number(req.params.id) }, include })
  if (!pedido) return err(res, 'Pedido no encontrado', 404)

  // Devolver stock
  for (const d of pedido.detalle_pedido) {
    await prisma.producto.update({
      where: { id: d.producto_id },
      data:  { stock: { increment: d.cantidad } }
    })
  }
  const p = await prisma.pedido.update({
    where: { id: pedido.id },
    data: { estado: 'CANCELADO' },
    include
  })
  return ok(res, p)
}

module.exports = { getPedidos, getMisPedidos, getPedido, createPedido, actualizarEstado, confirmar, cancelar }
