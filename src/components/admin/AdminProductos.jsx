import { useState, useEffect, useCallback, useRef } from 'react'
import { getProductos, getCategorias, getProveedores, getMarcas, createProducto, updateProducto, deleteProducto, uploadImagen } from '../../services/api'
import { toArr, toTotal } from '../../utils/parseResponse'
import Modal from './shared/Modal'
import Pagination from './shared/Pagination'
import * as Icons from './shared/Icons'

const emptyForm = {
  nombre: '', codigo: '', marca: '', descripcion: '',
  precio_venta: '', precio_compra: '', precio_anterior: '',
  stock: '', stock_minimo: '5',
  imagen: '', badge: '',
  categoria_id: '', proveedor_id: '',
}

const LIMIT = 12

function AdminProductos() {
  const [products, setProducts]       = useState([])
  const [categorias, setCategorias]   = useState([])
  const [proveedores, setProveedores] = useState([])
  const [marcas, setMarcas]           = useState([])
  const [total, setTotal]             = useState(0)
  const [page, setPage]               = useState(1)

  // Filtros
  const [search, setSearch]         = useState('')
  const [filterCat, setFilterCat]   = useState('')
  const [filterMarca, setFilterMarca] = useState('')
  const [filterMin, setFilterMin]   = useState('')
  const [filterMax, setFilterMax]   = useState('')
  const [filterStock, setFilterStock] = useState(false)

  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm]             = useState(emptyForm)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState(null)
  const [uploading, setUploading]   = useState(false)
  const fileRef                     = useRef(null)

  // Cargar datos auxiliares una sola vez
  useEffect(() => {
    Promise.all([
      getCategorias().catch(() => ({ data: [] })),
      getProveedores({ limit: 200 }).catch(() => ({ data: [] })),
      getMarcas().catch(() => ({ data: [] })),
    ]).then(([cats, provs, mrcs]) => {
      setCategorias(toArr(cats.data))
      setProveedores(toArr(provs.data))
      const mrcList = mrcs.data?.data ?? mrcs.data
      setMarcas(Array.isArray(mrcList) ? mrcList : [])
    })
  }, [])

  const cargar = useCallback(() => {
    setLoading(true)
    const params = { page, limit: LIMIT }
    if (search)      params.buscar      = search
    if (filterCat)   params.categoria_id = filterCat
    if (filterMarca) params.marca        = filterMarca
    if (filterMin)   params.minPrice     = filterMin
    if (filterMax)   params.maxPrice     = filterMax
    if (filterStock) params.inStock      = 'true'
    getProductos(params)
      .then(r => { setProducts(toArr(r.data)); setTotal(toTotal(r.data)) })
      .catch(() => setError('Error al cargar productos'))
      .finally(() => setLoading(false))
  }, [page, search, filterCat, filterMarca, filterMin, filterMax, filterStock])

  useEffect(() => { cargar() }, [cargar])

  function resetFiltros() {
    setSearch(''); setFilterCat(''); setFilterMarca('')
    setFilterMin(''); setFilterMax(''); setFilterStock(false)
    setPage(1)
  }

  function handleEdit(p) {
    setEditProduct(p)
    setForm({
      nombre:          p.nombre          || '',
      codigo:          p.codigo          || '',
      marca:           p.marca           || '',
      descripcion:     p.descripcion     || '',
      precio_venta:    p.precio_venta    || '',
      precio_compra:   p.precio_compra   || '',
      precio_anterior: p.precio_anterior || '',
      stock:           p.stock           ?? '',
      stock_minimo:    p.stock_minimo    ?? '5',
      imagen:          p.imagen          || '',
      badge:           p.badge           || '',
      categoria_id:    p.categoria_id    || p.categorias?.id || '',
      proveedor_id:    p.proveedor_id    || p.proveedores?.id || '',
    })
    setShowForm(true)
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este producto?')) return
    try {
      await deleteProducto(id)
      setProducts(prev => prev.filter(p => p.id !== id))
      setTotal(t => t - 1)
    } catch { alert('No se pudo eliminar') }
  }

  async function handleSubmit() {
    const nombre = form.nombre.trim()
    const precioVenta = parseFloat(form.precio_venta)
    if (!nombre)                      return setError('El nombre es requerido')
    if (!form.precio_venta && form.precio_venta !== 0) return setError('El precio de venta es requerido')
    if (isNaN(precioVenta) || precioVenta < 0) return setError('El precio de venta debe ser un número mayor o igual a 0')
    const precioCompra   = form.precio_compra   ? parseFloat(form.precio_compra)   : undefined
    const precioAnterior = form.precio_anterior ? parseFloat(form.precio_anterior) : undefined
    if (precioCompra   !== undefined && precioCompra   < 0) return setError('El precio de compra no puede ser negativo')
    if (precioAnterior !== undefined && precioAnterior < 0) return setError('El precio anterior no puede ser negativo')
    const stockVal = parseInt(form.stock)
    if (!isNaN(stockVal) && stockVal < 0) return setError('El stock no puede ser negativo')
    setSaving(true); setError(null)
    try {
      const payload = {
        nombre,
        codigo:          form.codigo.trim()      || undefined,
        marca:           form.marca.trim()       || undefined,
        descripcion:     form.descripcion.trim() || undefined,
        precio_venta:    precioVenta,
        precio_compra:   precioCompra,
        precio_anterior: precioAnterior,
        stock:           isNaN(stockVal) ? 0 : stockVal,
        stock_minimo:    parseInt(form.stock_minimo) || 5,
        imagen:          form.imagen.trim()  || undefined,
        badge:           form.badge.trim()   || undefined,
        categoria_id:    form.categoria_id   ? parseInt(form.categoria_id)  : undefined,
        proveedor_id:    form.proveedor_id   ? parseInt(form.proveedor_id)  : undefined,
      }
      if (editProduct) {
        const { data } = await updateProducto(editProduct.id, payload)
        setProducts(prev => prev.map(p => p.id === editProduct.id ? (data?.data || data) : p))
      } else {
        const { data } = await createProducto(payload)
        setProducts(prev => [data?.data || data, ...prev])
        setTotal(t => t + 1)
      }
      setShowForm(false); setEditProduct(null); setForm(emptyForm)
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al guardar')
    } finally { setSaving(false) }
  }

  async function handleImageUpload(file) {
    if (!file) return
    setUploading(true)
    try {
      const { data } = await uploadImagen(file)
      if (data?.url) setForm(p => ({ ...p, imagen: data.url }))
    } catch { setError('Error al subir la imagen') }
    finally { setUploading(false) }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))
  const hayFiltros = search || filterCat || filterMarca || filterMin || filterMax || filterStock

  const fi = (label, key, type = 'text', placeholder = '') => (
    <div key={key}>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={form[key]} placeholder={placeholder}
        min={type === 'number' ? '0' : undefined}
        step={type === 'number' ? '0.01' : undefined}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        style={inputStyle}
      />
    </div>
  )

  return (
    <div>
      {/* ── Barra superior ───────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ position: 'relative' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--subtle)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Buscar producto, código, marca..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{ padding: '0.65rem 1rem 0.65rem 2.4rem', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', width: '280px', outline: 'none' }}
          />
        </div>
        <button onClick={() => { setShowForm(true); setEditProduct(null); setForm(emptyForm); setError(null) }}
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
          + Agregar producto
        </button>
      </div>

      {/* ── Panel de filtros ─────────────────────── */}
      <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1', minWidth: '160px' }}>
          <label style={labelStyle}>Categoría</label>
          <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1) }} style={selectStyle}>
            <option value="">Todas</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div style={{ flex: '1', minWidth: '140px' }}>
          <label style={labelStyle}>Marca</label>
          <select value={filterMarca} onChange={e => { setFilterMarca(e.target.value); setPage(1) }} style={selectStyle}>
            <option value="">Todas</option>
            {marcas.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <div>
            <label style={labelStyle}>Precio mín $</label>
            <input type="number" min="0" placeholder="0" value={filterMin}
              onChange={e => { setFilterMin(e.target.value); setPage(1) }}
              style={{ ...inputStyle, width: '90px' }} />
          </div>
          <span style={{ paddingBottom: '0.6rem', color: 'var(--subtle)', fontSize: '0.85rem' }}>—</span>
          <div>
            <label style={labelStyle}>Precio máx $</label>
            <input type="number" min="0" placeholder="∞" value={filterMax}
              onChange={e => { setFilterMax(e.target.value); setPage(1) }}
              style={{ ...inputStyle, width: '90px' }} />
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted-fg)', paddingBottom: '0.1rem' }}>
          <input type="checkbox" checked={filterStock} onChange={e => { setFilterStock(e.target.checked); setPage(1) }}
            style={{ accentColor: 'var(--accent)', width: '15px', height: '15px' }} />
          Solo con stock
        </label>
        {hayFiltros && (
          <button onClick={resetFiltros} style={{ padding: '0.6rem 0.875rem', borderRadius: '8px', border: '1.5px solid var(--border)', background: 'var(--secondary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', color: 'var(--muted-fg)' }}>
            <span style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}><Icons.X size={13} /> Limpiar filtros</span>
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--subtle)', paddingBottom: '0.15rem' }}>
          {loading ? '' : `${total} producto${total !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* ── Grid de cards ────────────────────────── */}
      {loading ? (
        <div style={gridStyle}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ background: '#f4f6fb', borderRadius: '12px', height: '340px', animation: 'pulse 1.4s ease-in-out infinite' }} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--subtle)' }}>
          <div style={{ marginBottom: '1rem', color: '#ccc' }}><Icons.Package size={48} /></div>
          <p style={{ fontWeight: 600 }}>No se encontraron productos</p>
          {hayFiltros && <button onClick={resetFiltros} style={{ marginTop: '1rem', padding: '0.5rem 1.25rem', borderRadius: '8px', border: '1.5px solid var(--accent)', color: 'var(--accent)', background: 'transparent', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Limpiar filtros</button>}
        </div>
      ) : (
        <div style={gridStyle}>
          {products.map(p => (
            <ProductAdminCard key={p.id} product={p} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* ── Modal crear/editar ───────────────────── */}
      {showForm && (
        <Modal onClose={() => setShowForm(false)} maxWidth="600px">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: '1.5rem' }}>
            {editProduct ? 'Editar producto' : 'Agregar producto'}
          </h3>
          {error && <p style={{ color: '#c62828', marginBottom: '1rem', fontSize: '0.875rem', background: '#ffebee', padding: '0.6rem 1rem', borderRadius: '6px' }}>{error}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            {fi('Nombre *',       'nombre')}
            {fi('Código / SKU',   'codigo')}
            {fi('Marca',          'marca')}
            {fi('Badge',          'badge',           'text', 'NUEVO, OFERTA…')}
            {fi('Precio venta *', 'precio_venta',    'number')}
            {fi('Precio compra',  'precio_compra',   'number')}
            {fi('Precio anterior','precio_anterior', 'number')}
            {fi('Stock',          'stock',           'number')}
            {fi('Stock mínimo',   'stock_minimo',    'number')}
          </div>

          {/* Imagen */}
          <div style={{ marginTop: '0.875rem' }}>
            <label style={labelStyle}>Imagen</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="text" value={form.imagen} placeholder="https://... o sube un archivo"
                onChange={e => setForm(p => ({ ...p, imagen: e.target.value }))}
                style={{ ...inputStyle, flex: 1 }} />
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => handleImageUpload(e.target.files[0])} />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                style={{ padding: '0.6rem 0.875rem', border: '1.5px solid var(--accent)', borderRadius: '8px', background: 'transparent', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                {uploading ? '...' : <span style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}><Icons.Upload size={14} /> Subir</span>}
              </button>
            </div>
            {form.imagen && <img src={form.imagen} alt="preview" style={{ marginTop: '0.5rem', height: '68px', borderRadius: '6px', objectFit: 'cover' }} />}
          </div>

          {/* Descripción */}
          <div style={{ marginTop: '0.875rem' }}>
            <label style={labelStyle}>Descripción</label>
            <textarea value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
              rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {/* Categoría + Proveedor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginTop: '0.875rem' }}>
            <div>
              <label style={labelStyle}>Categoría</label>
              <select value={form.categoria_id} onChange={e => setForm(p => ({ ...p, categoria_id: e.target.value }))} style={selectStyle}>
                <option value="">Sin categoría</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Proveedor</label>
              <select value={form.proveedor_id} onChange={e => setForm(p => ({ ...p, proveedor_id: e.target.value }))} style={selectStyle}>
                <option value="">Sin proveedor</option>
                {proveedores.map(pr => <option key={pr.id} value={pr.id}>{pr.nombre}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button onClick={handleSubmit} disabled={saving}
              style={{ flex: 1, background: 'var(--accent)', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
              {saving ? 'Guardando...' : editProduct ? 'Guardar cambios' : 'Agregar'}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ flex: 1, background: 'var(--secondary)', color: 'var(--fg)', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Shared styles ─────────────────────────────────────
const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '1.25rem',
  marginBottom: '1.5rem',
}
const labelStyle = { fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-fg)', display: 'block', marginBottom: '0.3rem' }
const inputStyle = { width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
const selectStyle = { width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', background: '#fff', fontFamily: 'inherit' }

// ── ProductAdminCard ──────────────────────────────────
function ProductAdminCard({ product: p, onEdit, onDelete }) {
  const precio    = parseFloat(p.precio_venta || 0)
  const anterior  = parseFloat(p.precio_anterior || 0)
  const stockOk   = p.stock > (p.stock_minimo || 0)
  const descuento = anterior > 0 ? Math.round((1 - precio / anterior) * 100) : 0

  return (
    <div style={{
      background: '#fff', borderRadius: '12px', border: '1.5px solid var(--border)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'none' }}
    >
      {/* Imagen */}
      <div style={{ position: 'relative', aspectRatio: '4/3', background: 'var(--secondary)', overflow: 'hidden' }}>
        {p.imagen
          ? <img src={p.imagen} alt={p.nombre} loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}><Icons.Package size={40} /></div>
        }
        {/* Badge */}
        {p.badge && (
          <span style={{
            position: 'absolute', top: '8px', left: '8px',
            background: 'var(--accent)', color: '#fff',
            fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.5px',
          }}>{p.badge}</span>
        )}
        {/* Descuento */}
        {descuento > 0 && (
          <span style={{
            position: 'absolute', top: '8px', right: '8px',
            background: '#2E7D32', color: '#fff',
            fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
          }}>-{descuento}%</span>
        )}
      </div>

      {/* Contenido */}
      <div style={{ padding: '0.875rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {/* Marca + Categoría */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {p.marca && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{p.marca}</span>}
          {p.categorias?.nombre && <span style={{ fontSize: '0.7rem', color: 'var(--subtle)', background: 'var(--secondary)', padding: '1px 6px', borderRadius: '4px' }}>{p.categorias.nombre}</span>}
        </div>

        {/* Nombre */}
        <p style={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.35, flex: 1,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {p.nombre}
        </p>

        {/* Código */}
        {p.codigo && <p style={{ fontSize: '0.7rem', color: 'var(--subtle)', fontFamily: 'monospace' }}>{p.codigo}</p>}

        {/* Precio */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.25rem' }}>
          <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--fg)' }}>${precio.toFixed(2)}</span>
          {anterior > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--subtle)', textDecoration: 'line-through' }}>${anterior.toFixed(2)}</span>}
        </div>

        {/* Stock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
            background: stockOk ? '#e8f5e9' : '#ffebee',
            color: stockOk ? '#2E7D32' : '#c62828',
          }}>
            {p.stock} uds
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--subtle)' }}>mín {p.stock_minimo || 0}</span>
          {p.proveedores?.nombre && (
            <span style={{ fontSize: '0.68rem', color: 'var(--subtle)', marginLeft: 'auto', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }} title={p.proveedores.nombre}>
              {p.proveedores.nombre}
            </span>
          )}
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button onClick={() => onEdit(p)}
            style={{ flex: 1, padding: '0.45rem 0', borderRadius: '7px', fontSize: '0.78rem', fontWeight: 700,
              cursor: 'pointer', border: '1.5px solid var(--accent)', color: 'var(--accent)', background: 'transparent',
              transition: 'background 0.15s, color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--accent)' }}
          >
            <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.3rem' }}><Icons.Edit size={13} /> Editar</span>
          </button>
          <button onClick={() => onDelete(p.id)}
            style={{ flex: 1, padding: '0.45rem 0', borderRadius: '7px', fontSize: '0.78rem', fontWeight: 700,
              cursor: 'pointer', border: '1.5px solid #c62828', color: '#c62828', background: 'transparent',
              transition: 'background 0.15s, color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#c62828'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c62828' }}
          >
            <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.3rem' }}><Icons.Trash2 size={13} /> Eliminar</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminProductos
