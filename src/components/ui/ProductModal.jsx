import { useState } from 'react'
import { useCart } from '../../context/CartContext'

function ProductModal({ product, onClose }) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart()
  const [qty, setQty]           = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [activeImg, setActiveImg] = useState(0)
  const inWishlist = isInWishlist(product.id)

  const nombre   = product.nombre   || product.name  || ''
  const imagen   = product.imagen   || product.img   || ''
  const marca    = product.marca    || product.brand || ''
  const precio   = parseFloat(product.precio        || product.precio_venta   || product.price    || 0)
  const anterior = parseFloat(product.precio_oferta || product.precio_anterior || product.oldPrice || 0)
  const enStock  = product.stock != null ? product.stock > 0 : (product.inStock ?? true)
  const categoria = product.categorias?.nombre || product.categoria || ''
  const descripcion = product.descripcion || ''

  const images = product.images || (imagen ? [imagen] : [])

  return (
    <>
      <div className="modal-overlay open" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <button className="modal__close" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <div className="modal__grid">
            {/* Galería */}
            <div className="modal__gallery">
              <div className="modal__main-img">
                {images.length > 0
                  ? <img src={images[activeImg]} alt={nombre} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', background: '#f4f6fb' }}>📦</div>
                }
              </div>
              {images.length > 1 && (
                <div className="modal__thumbs">
                  {images.map((img, i) => (
                    <div key={i} className={`modal__thumb ${i === activeImg ? 'active' : ''}`} onClick={() => setActiveImg(i)}>
                      <img src={img} alt={`img ${i + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="modal__info">
              {marca && <p className="modal__brand">{marca}</p>}
              <h2 className="modal__name">{nombre}</h2>
              {anterior > 0 && <p className="modal__price-old">${anterior.toFixed(2)}</p>}
              <div className="modal__price-row">
                <span className="modal__price">${precio.toFixed(2)}</span>
                {product.badge && <span className="modal__price-badge">{product.badge}</span>}
              </div>
              <div className="modal__stock">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {enStock ? 'En stock - Envío disponible' : 'Agotado'}
              </div>

              <p className="modal__qty-label">Cantidad</p>
              <div className="modal__qty">
                <button className="modal__qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <span className="modal__qty-num">{qty}</span>
                <button className="modal__qty-btn" onClick={() => setQty(q => q + 1)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              </div>

              <div className="modal__actions">
                <button className="btn-cart" disabled={!enStock} onClick={() => { addToCart(product, qty); onClose() }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  Agregar al carrito
                </button>
                <button className="btn-buy" disabled={!enStock}>Comprar ahora</button>
                <button className="btn-wishlist" onClick={() => toggleWishlist(product)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill={inWishlist ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                  {inWishlist ? 'En favoritos ❤️' : 'Agregar a favoritos'}
                </button>
              </div>

              {/* Tabs */}
              <div className="modal__tabs-nav">
                {['description', 'specs'].map(t => (
                  <button key={t} className={`modal__tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                    {t === 'description' ? 'Descripción' : 'Especificaciones'}
                  </button>
                ))}
              </div>

              {activeTab === 'description' && (
                <div className="modal__tab-content active">
                  <p>{descripcion || 'Sin descripción disponible.'}</p>
                </div>
              )}
              {activeTab === 'specs' && (
                <div className="modal__tab-content active">
                  <table className="specs-table">
                    <tbody>
                      {marca    && <tr><td>Marca</td><td>{marca}</td></tr>}
                      <tr><td>Precio</td><td>${precio.toFixed(2)}</td></tr>
                      {categoria && <tr><td>Categoría</td><td>{categoria}</td></tr>}
                      <tr><td>Disponibilidad</td><td>{enStock ? 'En stock' : 'Agotado'}</td></tr>
                      {product.codigo && <tr><td>Código</td><td>{product.codigo}</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProductModal
