import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import SearchBar from '../ui/SearchBar'

function Header() {
  const { cartTotal, wishlist, setCartOpen, setWishlistOpen, setAuthOpen } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  function handleCuenta() {
    if (user) {
      if (user._rol === 'admin')         navigate('/admin')
      else if (user._rol === 'operador') navigate('/operador')
      else                               navigate('/cliente')
    } else {
      setAuthOpen(true)
    }
  }

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="header__logo">
          Ferretería <span>Ernesto's</span>
        </Link>

        <SearchBar />

        <div className="header__icons">
          <button className="header__icon-btn" aria-label="Favoritos" onClick={() => setWishlistOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
            {wishlist.length > 0 && (
              <span className="cart-badge" style={{background:'#e91e63'}}>{wishlist.length}</span>
            )}
          </button>

          <button className="header__icon-btn" aria-label="Carrito" onClick={() => setCartOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            {cartTotal > 0 && <span className="cart-badge">{cartTotal}</span>}
          </button>

          <button className="header__icon-btn" aria-label="Cuenta" onClick={handleCuenta}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header