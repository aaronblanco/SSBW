import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function GaleriaGatitos() {
  const { data, error, isLoading, mutate } = useSWR('https://api.thecatapi.com/v1/images/search?limit=1', fetcher);

  const Recarga = () => {
    mutate();
  }

  return (
    <div className="container py-4">
      <section className="card shadow-sm border-0 bg-white">
        <div className="card-body text-center">
          <h3 className="h4 font-montserrat mb-4">Galería de Gatitos para Adoptar</h3>
          
          <div className="mx-auto bg-light rounded d-flex align-items-center justify-content-center mb-4" style={{ width: '100%', maxWidth: '400px', height: '400px', overflow: 'hidden' }}>
            {isLoading && <p className="text-muted font-montserrat">Buscando un michi...</p>}
            {error && <p className="text-danger font-montserrat">Error al cargar imagen</p>}
            {data && data[0] && (
              <img 
                src={data[0].url} 
                alt="Gatito en adopción" 
                className="img-fluid"
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              />
            )}
          </div>

          <button 
            onClick={Recarga} 
            className="btn btn-outline-primary font-montserrat"
          >
            ¡Quiero ver otro gatito! 🐱
          </button>
        </div>
      </section>
    </div>
  );
}
