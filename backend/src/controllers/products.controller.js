const prisma = require('../utils/prisma')
const { ok, paginated, err } = require('../utils/response')

const productSelect = {
  id: true, nombre: true, descripcion: true,
  precio: true, precio_oferta: true,
  stock: true, stock_minimo: true,
  imagen: true, marca: true, codigo: true,
  activo: true, destacado: true,
  categoria_id: true,
  categoria: { select: { id: true, nombre: true } },
  created_at: true, updated_at: true,
}

// GET /api/products
async function getProductos(req, res) {
  const { page = 1, limit = 20, buscar, categoria_id, marca, activo, destacado } = req.query
  const skip = (Number(page) - 1) * Number(limit)
  const where = {
    ...(buscar ? { OR: [
      { nombre:    { contains: buscar, mode: 'insensitive' } },
      { codigo:    { contains: buscar, mode: 'insensitive' } },
      { descripcion:{ contains: buscar, mode: 'insensitive' } },
    ]} : {}),
    ...(categoria_id ? { categoria_id: Number(categoria_id) } : {}),
    ...(marca        ? { marca: { contains: marca, mode: 'insensitive' } } : {}),
    ...(activo !== undefined ? { activo: activo === 'true' } : {}),
    ...(destacado !== undefined ? { destacado: destacado === 'true' } : {}),
  }
  const [total, data] = await Promise.all([
    prisma.producto.count({ where }),
    prisma.producto.findMany({ where, skip, take: Number(limit), orderBy: { nombre: 'asc' }, select: productSelect })
  ])
  return paginated(res, data, total, page, limit)
}

// GET /api/products/marcas
async function getMarcas(req, res) {
  const marcas = await prisma.producto.findMany({
    where: { marca: { not: null }, activo: true },
    select: { marca: true },
    distinct: ['marca'],
    orderBy: { marca: 'asc' }
  })
  return ok(res, marcas.map(m => m.marca))
}

// GET /api/products/:id
async function getProducto(req, res) {
  const p = await prisma.producto.findUnique({ where: { id: Number(req.params.id) }, select: productSelect })
  if (!p) return err(res, 'Producto no encontrado', 404)
  return ok(res, p)
}

// POST /api/products
async function createProducto(req, res) {
  const { nombre, descripcion, precio, precio_oferta, stock, stock_minimo,
          imagen, marca, codigo, activo, destacado, categoria_id } = req.body
  if (!nombre || precio == null) return err(res, 'Nombre y precio son requeridos')
  const p = await prisma.producto.create({
    data: {
      nombre, descripcion, precio: Number(precio),
      precio_oferta: precio_oferta ? Number(precio_oferta) : null,
      stock: Number(stock) || 0,
      stock_minimo: Number(stock_minimo) || 5,
      imagen, marca, codigo,
      activo: activo !== false,
      destacado: destacado === true,
      categoria_id: categoria_id ? Number(categoria_id) : null,
    },
    select: productSelect,
  })
  return ok(res, p, 201)
}

// PUT /api/products/:id
async function updateProducto(req, res) {
  const id = Number(req.params.id)
  const { nombre, descripcion, precio, precio_oferta, stock, stock_minimo,
          imagen, marca, codigo, activo, destacado, categoria_id } = req.body
  const p = await prisma.producto.update({
    where: { id },
    data: {
      nombre, descripcion,
      ...(precio != null ? { precio: Number(precio) } : {}),
      precio_oferta: precio_oferta ? Number(precio_oferta) : null,
      ...(stock != null ? { stock: Number(stock) } : {}),
      ...(stock_minimo != null ? { stock_minimo: Number(stock_minimo) } : {}),
      imagen, marca, codigo, activo, destacado,
      categoria_id: categoria_id ? Number(categoria_id) : null,
    },
    select: productSelect,
  })
  return ok(res, p)
}

// DELETE /api/products/:id
async function deleteProducto(req, res) {
  await prisma.producto.delete({ where: { id: Number(req.params.id) } })
  return ok(res, { id: Number(req.params.id) })
}

module.exports = { getProductos, getMarcas, getProducto, createProducto, updateProducto, deleteProducto }
