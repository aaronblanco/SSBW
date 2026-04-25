import { useState, useEffect } from 'react';

export default function BuscadorProductos() {
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const take = 12;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const query = new URLSearchParams({ take: String(take), skip: String(skip) });
        if (search) query.set('search', search);
        
        const response = await fetch(`http://localhost:3000/api/products?${query.toString()}`);
        if (!response.ok) throw new Error("Error fetching");
        const data = await response.json();
        setProducts(data.items || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, [skip, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setSkip(0);
  };

  return (
    <div className="container py-4">
      <section className="card shadow-sm border-0 mb-4 ssbw-section">
        <div className="card-body">
          <h1 className="h4 mb-3 font-montserrat">Página de búsquedas</h1>
          <form onSubmit={handleSearch} className="row g-2">
            <div className="col-md-8">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div className="col-md-2 d-grid">
              <button className="btn btn-primary font-montserrat" type="submit">Buscar</button>
            </div>
            <div className="col-md-2 d-grid">
              <button className="btn btn-outline-dark font-montserrat" type="button">
                Re-scrapear
              </button>
            </div>
          </form>

          <div className="mt-3 d-flex gap-2 align-items-center font-montserrat">
            <span className="badge text-bg-secondary">Total: {total}</span>
            <span className="text-muted small">Listo para buscar</span>
          </div>
        </div>
      </section>

      <section className="row g-3">
        {products.length === 0 ? (
          <div className="col-12">
            <div className="alert alert-warning mb-0 font-montserrat">No hay productos para esta búsqueda.</div>
          </div>
        ) : (
          products.map(item => (
            <article key={item.id} className="col-md-6 col-xl-4">
              <div className="card h-100 shadow-sm border-0">
                <img
                  src={item.image || 'https://placehold.co/600x400?text=Sin+imagen'}
                  className="card-img-top"
                  alt={item.title}
                  style={{ objectFit: 'cover', height: '220px' }}
                />
                <div className="card-body d-flex flex-column">
                  <h2 className="h6 font-montserrat font-bold">{item.title}</h2>
                  <p className="mb-2 text-muted small">{item.price ? `${item.price.toFixed(2)} EUR` : 'Precio no disponible'}</p>
                  <div className="d-flex gap-2 mt-auto">
                    <a href={`/product.html?id=${item.id}`} className="btn btn-sm btn-primary font-montserrat">Detalle</a>
                    <a href={item.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary font-montserrat">Web tienda</a>
                    <button type="button" className="btn btn-sm btn-success font-montserrat">Añadir</button>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="d-flex justify-content-between align-items-center mt-4 ssbw-pager font-montserrat">
        <button 
          onClick={() => setSkip(Math.max(0, skip - take))} 
          disabled={skip === 0} 
          className="btn btn-outline-secondary font-montserrat"
        >Anterior</button>
        <span className="text-muted">Página {Math.floor(skip / take) + 1}</span>
        <button 
          onClick={() => setSkip(skip + take)} 
          disabled={skip + take >= total} 
          className="btn btn-outline-secondary font-montserrat"
        >Siguiente</button>
      </section>
    </div>
  );
}
