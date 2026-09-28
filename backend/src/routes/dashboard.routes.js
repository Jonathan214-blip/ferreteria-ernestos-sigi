const router = require('express').Router()
const prisma = require('../utils/prisma')
const { ok } = require('../utils/response')
const { authMiddleware, authorizeRole } = require('../middleware/auth.middleware')

router.use(authMiddleware, authorizeRole('ADMIN', 'OPERADOR'))

router.get('/', async (req, res) => {
  const hoy    = new Date(); hoy.setHours(0,0,0,0)
  const manana = new Date(hoy); manana.setDate(manana.getDate() + 1)

  const [
    totalProductos,
    productosActivos,
    totalClientes,
    pedidosPendientes,
    pedidosHoy,
    ventasHoy,
    stockCriticos,
  ] = await Promise.all([
    prisma.producto.count(),
    prisma.producto.count({ where: { activo: true } }),
    prisma.cliente.count(),
    prisma.pedido.count({ where: { estado: 'PENDIENTE_CONFIRMACION' } }),
    prisma.pedido.count({ where: { created_at: { gte: hoy, lt: manana } } }),
    prisma.venta.aggregate({
      where: { created_at: { gte: hoy, lt: manana }, estado: 'COMPLETADA' },
      _sum: { total: true }
    }),
    prisma.producto.count({ where: { activo: true, stock: { lte: 5 } } }),
  ])

  return ok(res, {
    totalProductos, productosActivos, totalClientes,
    pedidosPendientes, pedidosHoy,
    ventasHoy: Number(ventasHoy._sum.total || 0),
    stockCriticos,
  })
})

module.exports = router
