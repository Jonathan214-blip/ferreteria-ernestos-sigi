const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Sembrando base de datos...')

  // ── Usuarios ────────────────────────────────────────────────────────────────
  const hash = (pw) => bcrypt.hash(pw, 10)

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@ferreteria.com' },
    update: {},
    create: {
      nombre:   'Administrador',
      email:    'admin@ferreteria.com',
      password: await hash('Admin123!'),
      rol:      'ADMIN',
    }
  })

  const operador = await prisma.usuario.upsert({
    where: { email: 'operador@ferreteria.com' },
    update: {},
    create: {
      nombre:   'Operador Demo',
      email:    'operador@ferreteria.com',
      password: await hash('Operador123!'),
      rol:      'OPERADOR',
      operador: { create: {} }
    }
  })

  const clienteUser = await prisma.usuario.upsert({
    where: { email: 'cliente@demo.com' },
    update: {},
    create: {
      nombre:   'Cliente Demo',
      email:    'cliente@demo.com',
      password: await hash('Cliente123!'),
      rol:      'CLIENTE',
      cliente:  { create: { telefono: '50372880000', direccion: 'Col. Escalón, San Salvador' } }
    }
  })

  console.log(`  ✓ Usuarios: admin, operador, cliente`)

  // ── Categorías ───────────────────────────────────────────────────────────────
  const cats = await Promise.all([
    prisma.categoria.upsert({ where: { nombre: 'Construcción' },  update: {}, create: { nombre: 'Construcción',  icono: '🏗️' } }),
    prisma.categoria.upsert({ where: { nombre: 'Herramientas' },  update: {}, create: { nombre: 'Herramientas',  icono: '🔧' } }),
    prisma.categoria.upsert({ where: { nombre: 'Eléctrico' },     update: {}, create: { nombre: 'Eléctrico',     icono: '⚡' } }),
    prisma.categoria.upsert({ where: { nombre: 'Fontanería' },    update: {}, create: { nombre: 'Fontanería',    icono: '🚿' } }),
    prisma.categoria.upsert({ where: { nombre: 'Pintura' },       update: {}, create: { nombre: 'Pintura',       icono: '🎨' } }),
    prisma.categoria.upsert({ where: { nombre: 'Seguridad' },     update: {}, create: { nombre: 'Seguridad',     icono: '🔒' } }),
  ])
  console.log(`  ✓ Categorías: ${cats.length}`)

  // ── Productos ─────────────────────────────────────────────────────────────
  const productos = [
    { nombre: 'Cemento Holcim 42.5kg',     precio: 8.50,  stock: 200, marca: 'Holcim',    categoria_id: cats[0].id },
    { nombre: 'Block 20×20×40',            precio: 0.45,  stock: 1000,marca: 'Local',     categoria_id: cats[0].id },
    { nombre: 'Varilla 3/8" × 6m',         precio: 6.75,  stock: 150, marca: 'TASA',      categoria_id: cats[0].id },
    { nombre: 'Arena de río (m³)',          precio: 45.00, stock: 50,  marca: 'Local',     categoria_id: cats[0].id },
    { nombre: 'Martillo 16oz Stanley',     precio: 12.50, stock: 30,  marca: 'Stanley',   categoria_id: cats[1].id, destacado: true },
    { nombre: 'Taladro Bosch 500W',        precio: 85.00, stock: 15,  marca: 'Bosch',     categoria_id: cats[1].id, destacado: true },
    { nombre: 'Juego Destornilladores 6pz',precio: 9.99,  stock: 40,  marca: 'Stanley',   categoria_id: cats[1].id },
    { nombre: 'Nivel de burbuja 40cm',     precio: 7.25,  stock: 25,  marca: 'Stanley',   categoria_id: cats[1].id },
    { nombre: 'Cable calibre 12 (rollo)',  precio: 55.00, stock: 20,  marca: 'Condumex',  categoria_id: cats[2].id },
    { nombre: 'Interruptor doble Leviton', precio: 3.50,  stock: 80,  marca: 'Leviton',   categoria_id: cats[2].id },
    { nombre: 'Clavija triple 15A',        precio: 4.25,  stock: 60,  marca: 'Leviton',   categoria_id: cats[2].id },
    { nombre: 'Tubo PVC 1/2" × 6m',       precio: 3.20,  stock: 100, marca: 'AMANCO',    categoria_id: cats[3].id },
    { nombre: 'Llave de paso 1/2"',        precio: 6.80,  stock: 45,  marca: 'Bronce',    categoria_id: cats[3].id },
    { nombre: 'Codo PVC 90° 1/2"',        precio: 0.35,  stock: 300, marca: 'AMANCO',    categoria_id: cats[3].id },
    { nombre: 'Pintura vinil blanca 1gl',  precio: 14.50, stock: 50,  marca: 'Pintuco',   categoria_id: cats[4].id, destacado: true },
    { nombre: 'Brocha 3" cerdas naturales',precio: 3.75,  stock: 35,  marca: 'Purdy',     categoria_id: cats[4].id },
    { nombre: 'Candado 60mm Master Lock',  precio: 18.00, stock: 20,  marca: 'MasterLock',categoria_id: cats[5].id },
    { nombre: 'Cinta de señalización',     precio: 2.50,  stock: 100, marca: 'Local',     categoria_id: cats[5].id },
  ]

  for (const p of productos) {
    await prisma.producto.upsert({
      where:  { codigo: `SKU-${p.nombre.slice(0,8).replace(/\s/g,'').toUpperCase()}` },
      update: {},
      create: {
        ...p,
        codigo:      `SKU-${p.nombre.slice(0,8).replace(/\s/g,'').toUpperCase()}`,
        stock_minimo: 5,
        activo:      true,
        destacado:   p.destacado ?? false,
      }
    })
  }
  console.log(`  ✓ Productos: ${productos.length}`)

  // ── Proveedor demo ──────────────────────────────────────────────────────────
  await prisma.proveedor.upsert({
    where:  { id: 1 },
    update: {},
    create: { nombre: 'Distribuidora El Constructor', contacto: 'Juan Pérez', telefono: '22001100', email: 'ventas@constructor.com' }
  }).catch(() => {})

  console.log('\n✅ Seed completado.')
  console.log('\nCredenciales:')
  console.log('  Admin    → admin@ferreteria.com     / Admin123!')
  console.log('  Operador → operador@ferreteria.com  / Operador123!')
  console.log('  Cliente  → cliente@demo.com          / Cliente123!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
