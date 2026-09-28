const router = require('express').Router()
const prisma = require('../utils/prisma')
const { ok } = require('../utils/response')
const { authMiddleware, authorizeRole } = require('../middleware/auth.middleware')

router.use(authMiddleware, authorizeRole('ADMIN'))

// GET /api/reportes/caja/:id
router.get('/caja/:id', async (req, res) => {
  const caja = await prisma.caja.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      ventas: { include: { detalle: { include: { producto: { select: { nombre: true } } } } } },
      usuario: { select: { nombre: true } }
    }
  })
  return ok(res, caja)
})

// GET /api/reportes/diario
router.get('/diario', async (req, res) => {
  const hoy    = new Date(); hoy.setHours(0,0,0,0)
  const manana = new Date(hoy); manana.setDate(manana.getDate() + 1)
  const [ventas, pedidos] = await Promise.all([
    prisma.venta.findMany({
      where: { created_at: { gte: hoy, lt: manana }, estado: 'COMPLETADA' },
      include: { detalle: true }
    }),
    prisma.pedido.findMany({
      where: { created_at: { gte: hoy, lt: manana } }
    })
  ])
  const totalVentas   = ventas.reduce((s, v) => s + Number(v.total), 0)
  const totalPedidos  = pedidos.reduce((s, p) => s + Number(p.total), 0)
  return ok(res, { ventas, pedidos, totalVentas, totalPedidos, fecha: hoy })
})

// GET /api/reportes/mensual
router.get('/mensual', async (req, res) => {
  const now    = new Date()
  const inicio = new Date(now.getFullYear(), now.getMonth(), 1)
  const fin    = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const ventas = await prisma.venta.findMany({
    where: { created_at: { gte: inicio, lte: fin }, estado: 'COMPLETADA' }
  })
  const total = ventas.reduce((s, v) => s + Number(v.total), 0)
  return ok(res, { ventas, total, mes: inicio })
})

// GET /api/reportes/top-productos
router.get('/top-productos', async (req, res) => {
  const detalles = await prisma.detalleVenta.groupBy({
    by: ['producto_id'],
    _sum: { cantidad: true, subtotal: true },
    orderBy: { _sum: { cantidad: 'desc' } },
    take: 10
  })
  const ids = detalles.map(d => d.producto_id)
  const productos = await prisma.producto.findMany({ where: { id: { in: ids } }, select: { id: true, nombre: true, imagen: true } })
  const result = detalles.map(d => ({
    ...d,
    producto: productos.find(p => p.id === d.producto_id)
  }))
  return ok(res, result)
})

module.exports = router
