require('dotenv').config()
const express  = require('express')
const cors     = require('cors')
const path     = require('path')

const app = express()

// ── Middlewares globales ──────────────────────────────────────────────────────
app.use(cors({ origin: '*', credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Archivos estáticos (imágenes subidas)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth.routes'))
app.use('/api/users',         require('./routes/users.routes'))
app.use('/api/products',      require('./routes/products.routes'))
app.use('/api/categorias',    require('./routes/categorias.routes'))
app.use('/api/clientes',      require('./routes/clientes.routes'))
app.use('/api/proveedores',   require('./routes/proveedores.routes'))
app.use('/api/carrito',       require('./routes/carrito.routes'))
app.use('/api/pedidos',       require('./routes/pedidos.routes'))
app.use('/api/ventas',        require('./routes/ventas.routes'))
app.use('/api/caja',          require('./routes/caja.routes'))
app.use('/api/descuentos',    require('./routes/descuentos.routes'))
app.use('/api/movimientos',   require('./routes/movimientos.routes'))
app.use('/api/inventario',    require('./routes/inventario.routes'))
app.use('/api/ordenes-compra',require('./routes/ordenesCompra.routes'))
app.use('/api/uploads',       require('./routes/uploads.routes'))
app.use('/api/dashboard',     require('./routes/dashboard.routes'))
app.use('/api/reportes',      require('./routes/reportes.routes'))
app.use('/api/whatsapp',      require('./routes/whatsapp.routes'))

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date() }))

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(err.status || 500).json({ message: err.message || 'Error interno del servidor' })
})

// ── Iniciar ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🔧 Ferretería API corriendo en http://localhost:${PORT}`)
})
