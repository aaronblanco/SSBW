import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import CarruselProductos from './components/CarruselProductos'
import GaleriaGatitos from './components/GaleriaGatitos'
import BuscadorProductos from './components/BuscadorProductos'

type CartUser = {
  firstName: string
  lastName: string
  email: string
  role: string
}

type CartProduct = {
  id: number
  title: string
  price: number
  image?: string | null
  url?: string | null
}

type CartItem = CartProduct & {
  quantity: number
}

type CartInfo = {
  user: CartUser | null
  items: CartItem[]
  count: number
  totalAmount: number
  loading: boolean
  error: string | null
}

async function readJson(response: Response) {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo actualizar el carrito')
  }

  return data
}

function Layout({
  children,
  cart,
  drawerOpen,
  onToggleDrawer,
  onCloseDrawer,
  onRemoveItem,
  onClearCart
}: {
  children: React.ReactNode
  cart: CartInfo
  drawerOpen: boolean
  onToggleDrawer: () => void
  onCloseDrawer: () => void
  onRemoveItem: (productId: number) => Promise<void>
  onClearCart: () => Promise<void>
}) {
  const location = useLocation();
  const { user, count, items, totalAmount, loading, error } = cart;

  const astroHref = '/';

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-dark navbar-dark font-montserrat">
        <div className="container d-flex flex-wrap justify-content-between align-items-center">
          <div className="d-flex align-items-center flex-wrap gap-2">
            <Link className="navbar-brand mb-0 h1" to="/">SSBW - MiauMarket</Link>
            
            <div className="navbar-nav flex-row gap-3 ms-2 ms-md-4">
              <Link className={`nav-link ${location.pathname === '/' ? 'active fw-bold' : ''}`} to="/">Tienda</Link>
              <Link className={`nav-link ${location.pathname === '/adopcion' ? 'active fw-bold' : ''}`} to="/adopcion">Adopción</Link>
              <a className="nav-link" href={astroHref}>Astro</a>
            </div>
          </div>

          <div className="d-flex gap-2 align-items-center mt-2 mt-lg-0 ms-auto">
            {user?.role === 'admin' && (
              <a className="btn btn-sm btn-outline-warning" href="/admin.html">Admin</a>
            )}
            <button className="btn btn-sm btn-outline-light" type="button" onClick={onToggleDrawer}>
              Carrito ({count})
            </button>
            <span className={`badge ${user?.role === 'admin' ? 'text-bg-warning' : user ? 'text-bg-success' : 'text-bg-secondary'}`}>
              {user ? `${user.firstName} (${user.role})` : 'No autenticado'}
            </span>
            <a className="btn btn-sm btn-outline-light" href="/auth.html">Acceso</a>
          </div>
        </div>
      </nav>

      <div className={`ssbw-cart-backdrop ${drawerOpen ? 'is-open' : ''}`} onClick={onCloseDrawer} />
      <aside className={`ssbw-cart-panel ${drawerOpen ? 'is-open' : ''}`}>
        <div className="ssbw-cart-panel__header">
          <div>
            <h2 className="h5 mb-1 font-montserrat">Carrito</h2>
            <p className="small text-muted mb-0">
              {user ? `${user.firstName} · ${count} productos` : 'Inicia sesión para usar el carrito'}
            </p>
          </div>
          <button className="btn btn-sm btn-outline-secondary" type="button" onClick={onCloseDrawer}>
            Cerrar
          </button>
        </div>

        <div className="ssbw-cart-panel__body">
          {loading && <div className="text-muted small">Cargando carrito...</div>}
          {error && <div className="alert alert-warning py-2 mb-3">{error}</div>}

          {!loading && !user && (
            <div className="alert alert-info py-2 mb-3">
              Necesitas autenticarte para guardar productos en el carrito.
            </div>
          )}

          {!loading && user && items.length === 0 && (
            <div className="text-muted small">El carrito está vacío.</div>
          )}

          {items.map((item) => (
            <article key={item.id} className="ssbw-cart-item">
              <div className="ssbw-cart-item__meta">
                <div className="fw-semibold">{item.title}</div>
                <div className="small text-muted">
                  {Number.isFinite(item.price) ? `${item.price.toFixed(2)} EUR` : '0.00 EUR'} · Cantidad: {item.quantity}
                </div>
              </div>
              <button
                className="btn btn-sm btn-outline-danger"
                type="button"
                onClick={() => void onRemoveItem(item.id)}
              >
                Quitar
              </button>
            </article>
          ))}
        </div>

        <div className="ssbw-cart-panel__footer">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-muted small">Total estimado</span>
            <strong>{Number.isFinite(totalAmount) ? `${totalAmount.toFixed(2)} EUR` : '0.00 EUR'}</strong>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-danger btn-sm flex-fill" type="button" onClick={() => void onClearCart()}>
              Vaciar carrito
            </button>
            <button className="btn btn-primary btn-sm flex-fill" type="button" onClick={onCloseDrawer}>
              Seguir comprando
            </button>
          </div>
        </div>
      </aside>

      <main>
        {children}
      </main>
    </>
  )
}

function Tienda({
  onAddToCart
}: {
  onAddToCart: (product: CartProduct) => Promise<void>
}) {
  return (
    <>
      {/* Carrusel de Productos en la página principal */}
      <CarruselProductos onAddToCart={onAddToCart} />

      <hr className="container opacity-25" />

      {/* Buscador y grilla de productos original */}
      <BuscadorProductos onAddToCart={onAddToCart} />
    </>
  )
}

async function loadCurrentUser(): Promise<CartUser | null> {
  const response = await fetch('/api/auth/me', {
    credentials: 'include'
  })

  if (!response.ok) {
    return null
  }

  const data = await readJson(response)
  return data.user || null
}

async function loadCart(): Promise<Omit<CartInfo, 'user' | 'loading' | 'error'>> {
  const response = await fetch('/api/cart', {
    credentials: 'include'
  })

  const data = await readJson(response)

  return {
    items: Array.isArray(data.items) ? data.items : [],
    count: Number(data.count) || 0,
    totalAmount: Number(data.totalAmount) || 0
  }
}

function App() {
  const basename = window.location.pathname.startsWith('/react') ? '/react' : '/';
  const [cart, setCart] = useState<CartInfo>({
    user: null,
    items: [],
    count: 0,
    totalAmount: 0,
    loading: true,
    error: null
  })
  const [drawerOpen, setDrawerOpen] = useState(false)

  const refreshCart = async () => {
    setCart((current) => ({ ...current, loading: true, error: null }))

    try {
      const user = await loadCurrentUser()

      if (!user) {
        setCart({
          user: null,
          items: [],
          count: 0,
          totalAmount: 0,
          loading: false,
          error: null
        })
        return
      }

      const nextCart = await loadCart()
      setCart({
        user,
        loading: false,
        error: null,
        ...nextCart
      })
    } catch (error) {
      setCart({
        user: null,
        items: [],
        count: 0,
        totalAmount: 0,
        loading: false,
        error: error instanceof Error ? error.message : 'No se pudo cargar el carrito'
      })
    }
  }

  useEffect(() => {
    void refreshCart()
  }, [])

  const buildReturnUrl = () => {
    const currentUrl = new URL(window.location.href)
    const returnUrl = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
    return returnUrl.startsWith('/react') ? returnUrl : '/react/'
  }

  const addToCart = async (product: CartProduct) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(product)
      })

      await readJson(response)
      await refreshCart()
      setDrawerOpen(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message === 'No autenticado') {
        window.location.href = `/auth.html?next=${encodeURIComponent(buildReturnUrl())}`
        return
      }

      setCart((current) => ({
        ...current,
        error: message || 'No se pudo anadir al carrito'
      }))
      setDrawerOpen(true)
    }
  }

  const removeFromCart = async (productId: number) => {
    const response = await fetch(`/api/cart/${productId}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    await readJson(response)
    await refreshCart()
  }

  const clearCart = async () => {
    const response = await fetch('/api/cart', {
      method: 'DELETE',
      credentials: 'include'
    })

    await readJson(response)
    await refreshCart()
  }

  return (
    <BrowserRouter basename={basename}>
      <Layout
        cart={cart}
        drawerOpen={drawerOpen}
        onToggleDrawer={() => setDrawerOpen((current) => !current)}
        onCloseDrawer={() => setDrawerOpen(false)}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
      >
        <Routes>
          <Route path="/" element={<Tienda onAddToCart={addToCart} />} />
          <Route path="/adopcion" element={<GaleriaGatitos />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
