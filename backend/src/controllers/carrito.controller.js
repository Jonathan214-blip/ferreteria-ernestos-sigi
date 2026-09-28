const prisma = require('../utils/prisma')
const { ok, err } = require('../utils/response')

// Helpers ──────────────────────────────────────────────────────────────────────
async function getOrCreateCarrito(session_id, cliente_id) {
  let carrito = await prisma.carrito.findUnique({
    where: { session_id },
    include: { items: { include: { producto: true } } }
  })
  if (!carrito) {
    carrito = await prisma.carrito.create({
      data: { session_id, cliente_id: cliente_id ? Number(cliente_id) : null },
      include: { items: { include: { producto: true } } }
    })
  }
  return carrito
}

function buildCartResponse(carrito) {
  const items = carrito.items.map(i => ({
    producto_id:     i.producto_id,
    cantidad:        i.cantidad,
    precio_unitario: Number(i.producto.precio_oferta ?? i.producto.precio),
    subtotal:        Number(i.producto.precio_oferta ?? i.producto.precio) * i.cantidad,
    producto: {
      id:     i.producto.id,
      nombre: i.producto.nombre,
      imagen: i.producto.imagen,
      stock:  i.producto.stock,
    }
  }))
  const subtotal    = items.reduce((s, i) => s + i.subtotal, 0)
  const total_items = items.reduce((s, i) => s + i.cantidad, 0)
  return { items, subtotal, total_items }
}

// GET /api/carrito
async function getCarrito(req, res) {
  const { session_id, cliente_id } = req.query
  if (!session_id) return err(res, 'session_id requerido')
  const carrito = await getOrCreateCarrito(session_id, cliente_id)
  return ok(res, buildCartResponse(carrito))
}

// POST /api/carrito/items
async function addItem(req, res) {
  const { session_id, producto_id, cantidad, cliente_id } = req.body
  if (!session_id || !producto_id) return err(res, 'session_id y producto_id requeridos')

  const producto = await prisma.producto.findUnique({ where: { id: Number(producto_id) } })
  if (!producto || !producto.activo) return err(res, 'Producto no disponible', 404)

  const carrito = await getOrCreateCarrito(session_id, cliente_id)
  const qty     = Number(cantidad) || 1

  if (qty > producto.stock) return err(res, `Stock insuficiente. Disponible: ${producto.stock}`)

  await prisma.carritoItem.upsert({
    where:  { carrito_id_producto_id: { carrito_id: carrito.id, producto_id: Number(producto_id) } },
    update: { cantidad: qty },
    create: { carrito_id: carrito.id, producto_id: Number(producto_id), cantidad: qty }
  })

  const updated = await prisma.carrito.findUnique({
    where: { session_id },
    include: { items: { include: { producto: true } } }
  })
  return ok(res, buildCartResponse(updated))
}

// PUT /api/carrito/items/:producto_id
async function updateItem(req, res) {
  const { session_id, cantidad } = req.body
  const producto_id = Number(req.params.producto_id)
  if (!session_id) return err(res, 'session_id requerido')

  const carrito = await prisma.carrito.findUnique({ where: { session_id } })
  if (!carrito) return err(res, 'Carrito no encontrado', 404)

  const qty = Number(cantidad)
  if (qty <= 0) {
    await prisma.carritoItem.deleteMany({
      where: { carrito_id: carrito.id, producto_id }
    })
  } else {
    await prisma.carritoItem.update({
      where: { carrito_id_producto_id: { carrito_id: carrito.id, producto_id } },
      data: { cantidad: qty }
    })
  }

  const updated = await prisma.carrito.findUnique({
    where: { session_id },
    include: { items: { include: { producto: true } } }
  })
  return ok(res, buildCartResponse(updated))
}

// DELETE /api/carrito/items/:producto_id
async function removeItem(req, res) {
  const { session_id } = req.query
  const producto_id    = Number(req.params.producto_id)
  if (!session_id) return err(res, 'session_id requerido')

  const carrito = await prisma.carrito.findUnique({ where: { session_id } })
  if (!carrito) return err(res, 'Carrito no encontrado', 404)

  await prisma.carritoItem.deleteMany({ where: { carrito_id: carrito.id, producto_id } })

  const updated = await prisma.carrito.findUnique({
    where: { session_id },
    include: { items: { include: { producto: true } } }
  })
  return ok(res, buildCartResponse(updated))
}

// DELETE /api/carrito
async function clearCarrito(req, res) {
  const { session_id } = req.query
  const carrito = await prisma.carrito.findUnique({ where: { session_id } })
  if (carrito) {
    await prisma.carritoItem.deleteMany({ where: { carrito_id: carrito.id } })
  }
  return ok(res, { items: [], subtotal: 0, total_items: 0 })
}

// POST /api/carrito/checkout
async function checkout(req, res) {
  const { session_id, cliente_id, direccion_entrega, observaciones,
          nombre, telefono, email } = req.body

  if (!session_id || !direccion_entrega) {
    return err(res, 'session_id y dirección de entrega requeridos')
  }

  const carrito = await prisma.carrito.findUnique({
    where: { session_id },
    include: { items: { include: { producto: true } } }
  })
  if (!carrito || carrito.items.length === 0) return err(res, 'Carrito vacío')

  // Verificar stock y calcular total
  let total = 0
  for (const item of carrito.items) {
    if (item.cantidad > item.producto.stock) {
      return err(res, `Stock insuficiente para "${item.producto.nombre}". Disponible: ${item.producto.stock}`)
    }
    const precio = Number(item.producto.precio_oferta ?? item.producto.precio)
    total += precio * item.cantidad
  }

  // Crear pedido con sus detalles
  const pedido = await prisma.pedido.create({
    data: {
      cliente_id:       cliente_id ? Number(cliente_id) : null,
      nombre_invitado:  !cliente_id ? nombre : null,
      telefono_invitado:!cliente_id ? telefono : null,
      email_invitado:   !cliente_id ? email : null,
      direccion_entrega,
      observaciones,
      total,
      expires_at: new Date(Date.now() + 30 * 60 * 1000), // 30 min
      detalle_pedido: {
        create: carrito.items.map(item => {
          const precio = Number(item.producto.precio_oferta ?? item.producto.precio)
          return {
            producto_id: item.producto_id,
            cantidad:    item.cantidad,
            precio_unit: precio,
            subtotal:    precio * item.cantidad,
          }
        })
      }
    },
    include: { detalle_pedido: { include: { productos: true } } }
  })

  // Reducir stock
  for (const item of carrito.items) {
    await prisma.producto.update({
      where: { id: item.producto_id },
      data:  { stock: { decrement: item.cantidad } }
    })
  }

  // Vaciar carrito
  await prisma.carritoItem.deleteMany({ where: { carrito_id: carrito.id } })

  // Simular WhatsApp (log)
  const tel = cliente_id
    ? (await prisma.cliente.findUnique({ where: { id: Number(cliente_id) } }))?.telefono
    : telefono
  if (tel) {
    console.log(`📱 [WhatsApp simulado] → ${tel}`)
    console.log(`   Pedido #${pedido.id} creado por $${total.toFixed(2)}`)
    console.log(`   Responde SI para confirmar o NO para cancelar (30 min)`)
  }

  return ok(res, pedido, 201)
}

module.exports = { getCarrito, addItem, updateItem, removeItem, clearCarrito, checkout }
