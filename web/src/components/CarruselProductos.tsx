import { useState, useEffect } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function CarruselProductos() {
  // Obtenemos 5 productos para el carrusel
  const { data, error, isLoading } = useSWR('http://localhost:3000/api/products?take=5', fetcher);
  const products = data?.items || [];
  
  const [currentIndex, setCurrentIndex] = useState(0);

  // Autoplay: Rotar cada 5 segundos
  useEffect(() => {
    if (products.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [products.length, currentIndex]);

  const nextSlide = () => {
    if (products.length > 0) setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const prevSlide = () => {
    if (products.length > 0) setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  if (isLoading) return <div className="container py-4 text-center"><p className="font-montserrat text-muted">Cargando destacados...</p></div>;
  if (error) return <div className="container py-4 text-center"><p className="text-danger font-montserrat">Error al cargar destacados.</p></div>;
  if (products.length === 0) return null;

  const currentProduct = products[currentIndex];

  return (
    <div className="container py-4">
      <div className="position-relative mx-auto bg-white rounded shadow-sm overflow-hidden border-0" style={{ maxWidth: '900px', height: '450px' }}>
        
        {/* Imagen principal con transición suave */}
        <div className="w-100 h-100" style={{ transition: 'opacity 0.5s ease-in-out' }}>
          <img
            key={currentProduct.id} // Forza re-render para la transición
            src={currentProduct.image || 'https://placehold.co/900x600?text=Sin+imagen'}
            className="w-100 h-100 fade-in"
            alt={currentProduct.title}
            style={{ objectFit: 'cover', animation: 'fadeIn 0.5s ease-in-out' }}
          />
        </div>
        
        {/* Capa inferior oscura para el texto */}
        <div className="position-absolute bottom-0 start-0 w-100 p-4 text-white text-center" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}>
          <h4 className="font-montserrat fw-bold mb-2 text-shadow">{currentProduct.title}</h4>
          <p className="mb-3 fs-5 fw-semibold text-warning">{currentProduct.price ? `${currentProduct.price.toFixed(2)} EUR` : 'Precio no disponible'}</p>
          <a href={`/product.html?id=${currentProduct.id}`} className="btn btn-primary btn-sm font-montserrat">Ver producto</a>
        </div>

        {/* Flecha izquierda */}
        <button 
          onClick={prevSlide}
          className="btn btn-dark position-absolute top-50 start-0 translate-middle-y ms-3 rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: '45px', height: '45px', zIndex: 10, background: 'rgba(0,0,0,0.5)', border: 'none' }}
        >
          <span className="fs-5" style={{ transform: 'translateX(-2px)' }}>❮</span>
        </button>
        
        {/* Flecha derecha */}
        <button 
          onClick={nextSlide}
          className="btn btn-dark position-absolute top-50 end-0 translate-middle-y me-3 rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: '45px', height: '45px', zIndex: 10, background: 'rgba(0,0,0,0.5)', border: 'none' }}
        >
          <span className="fs-5" style={{ transform: 'translateX(2px)' }}>❯</span>
        </button>
        
        {/* Puntos indicadores */}
        <div className="position-absolute top-0 end-0 p-3 d-flex gap-2" style={{ zIndex: 10 }}>
          {products.map((_: any, idx: number) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`btn p-0 rounded-circle ${idx === currentIndex ? 'bg-primary' : 'bg-light opacity-75'}`}
              style={{ width: '12px', height: '12px', border: '1px solid rgba(0,0,0,0.3)', transition: 'all 0.3s' }}
              aria-label={`Ir a producto ${idx + 1}`}
            />
          ))}
        </div>

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0.8; }
          to { opacity: 1; }
        }
        .text-shadow {
          text-shadow: 1px 1px 4px rgba(0,0,0,0.8);
        }
      `}</style>
    </div>
  );
}
