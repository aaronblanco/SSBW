import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import CarruselProductos from './components/CarruselProductos'
import GaleriaGatitos from './components/GaleriaGatitos'
import BuscadorProductos from './components/BuscadorProductos'

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-dark navbar-dark font-montserrat">
        <div className="container d-flex flex-wrap justify-content-between align-items-center">
          <div className="d-flex align-items-center flex-wrap gap-2">
            <Link className="navbar-brand mb-0 h1" to="/">SSBW - MiauMarket</Link>
            
            <div className="navbar-nav flex-row gap-3 ms-2 ms-md-4">
              <Link className={`nav-link ${location.pathname === '/' ? 'active fw-bold' : ''}`} to="/">Tienda</Link>
              <Link className={`nav-link ${location.pathname === '/adopcion' ? 'active fw-bold' : ''}`} to="/adopcion">Adopción</Link>
            </div>
          </div>

          <div className="d-flex gap-2 align-items-center mt-2 mt-lg-0 ms-auto">
            <button className="btn btn-sm btn-outline-light" type="button">Carrito</button>
            <span className="badge text-bg-secondary">No autenticado</span>
            <a className="btn btn-sm btn-outline-light" href="/auth.html">Acceso</a>
          </div>
        </div>
      </nav>

      <main>
        {children}
      </main>
    </>
  )
}

function Tienda() {
  return (
    <>
      {/* Carrusel de Productos en la página principal */}
      <CarruselProductos />

      <hr className="container opacity-25" />

      {/* Buscador y grilla de productos original */}
      <BuscadorProductos />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Tienda />} />
          <Route path="/adopcion" element={<GaleriaGatitos />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
