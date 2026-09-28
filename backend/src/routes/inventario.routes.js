const router  = require('express').Router()
const prisma  = require('../utils/prisma')
const { ok }  = require('../utils/response')
const { authMiddleware, authorizeRole } = require('../middleware/auth.middleware')

router.use(authMiddleware, authorizeRole('ADMIN', 'OPERADOR'))

// GET /api/inventario/criticos
router.get('/criticos', async (req, res) => {
  const productos = await prisma.producto.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, stock: true, stock_minimo: true, imagen: true, marca: true }
  })
  // Filtra en JS para comparar los dos campos del mismo registro
  const criticos = productos.filter(p => p.stock <= p.stock_minimo)
  return ok(res, criticos)
})

module.exports = router
