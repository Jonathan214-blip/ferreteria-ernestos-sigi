const prisma = require('../utils/prisma')
const { ok, paginated, err } = require('../utils/response')

async function getMovimientos(req, res) {
  const { page = 1, limit = 20, producto_id, tipo } = req.query
  const skip  = (Number(page) - 1) * Number(limit)
  const where = {
    ...(producto_id ? { producto_id: Number(producto_id) } : {}),
    ...(tipo ? { tipo } : {}),
  }
  const [total, data] = await Promise.all([
    prisma.movimiento.count({ where }),
    prisma.movimiento.findMany({
      where, skip, take: Number(limit), orderBy: { created_at: 'desc' },
      include: {
        producto: { select: { id: true, nombre: true } },
        usuario:  { select: { id: true, nombre: true } }
      }
    })
  ])
  return paginated(res, data, total, page, limit)
}

async function createMovimiento(req, res) {
  const { producto_id, tipo, cantidad, motivo } = req.body
  if (!producto_id || !tipo || !cantidad) return err(res, 'producto_id, tipo y cantidad requeridos')

  const producto = await prisma.producto.findUnique({ where: { id: Number(producto_id) } })
  if (!producto) return err(res, 'Producto no encontrado', 404)

  const qty        = Number(cantidad)
  const stock_antes = producto.stock
  let stock_despues = stock_antes

  if (tipo === 'ENTRADA')   stock_despues = stock_antes + qty
  else if (tipo === 'SALIDA') {
    if (qty > stock_antes) return err(res, 'Stock insuficiente')
    stock_despues = stock_antes - qty
  } else if (tipo === 'AJUSTE') {
    stock_despues = qty
  }

  await prisma.producto.update({ where: { id: producto.id }, data: { stock: stock_despues } })

  const mov = await prisma.movimiento.create({
    data: {
      producto_id: producto.id,
      usuario_id:  req.user?.id ?? null,
      tipo, cantidad: qty, stock_antes, stock_despues, motivo
    },
    include: { producto: { select: { id: true, nombre: true } } }
  })
  return ok(res, mov, 201)
}

module.exports = { getMovimientos, createMovimiento }
