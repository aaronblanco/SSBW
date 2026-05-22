import { useState } from 'react';
import useSWR from 'swr';

type CatApiImage = {
	url: string;
	id?: string;
};

const fetcher = (url: string) => fetch(url).then((response) => response.json());

export default function GaleriaGatitos() {
	const [seed, setSeed] = useState(0);
	const { data, error, isLoading } = useSWR<CatApiImage[]>(
		`https://api.thecatapi.com/v1/images/search?limit=1&seed=${seed}`,
		fetcher
	);

	const gatito = data?.[0];

	return (
		<section className="kitty-shell">
			<div className="kitty-card">
				<div className="kitty-copy">
					<p className="kitty-kicker">Galería React</p>
					<h3>Gatitos para adoptar</h3>
					<p>
						Esta galería sigue cargando la imagen desde una API, pero ahora entra en Astro como
						isla React.
					</p>
				</div>

				<div className="kitty-frame">
					{isLoading && <span>Cargando un michi...</span>}
					{error && <span>No se pudo cargar la imagen.</span>}
					{gatito && <img src={gatito.url} alt="Gatito en adopción" />}
				</div>

				<button className="kitty-button" type="button" onClick={() => setSeed((value) => value + 1)}>
					¡Quiero ver otro gatito! 🐱
				</button>
			</div>

			<style>{`
				.kitty-shell {
					display: grid;
					place-items: center;
				}

				.kitty-card {
					width: min(100%, 720px);
					padding: 1.4rem;
					border-radius: 28px;
					background: rgba(255, 255, 255, 0.06);
					border: 1px solid var(--line);
					box-shadow: var(--shadow);
					backdrop-filter: blur(18px);
					display: grid;
					gap: 1rem;
				}

				.kitty-copy h3 {
					margin: 0;
					font-size: 1.55rem;
				}

				.kitty-copy p {
					margin: 0.5rem 0 0;
					color: var(--muted);
					line-height: 1.6;
				}

				.kitty-kicker {
					margin: 0;
					text-transform: uppercase;
					letter-spacing: 0.22em;
					font-size: 0.72rem;
					font-weight: 700;
					color: var(--accent);
				}

				.kitty-frame {
					min-height: 380px;
					border-radius: 22px;
					overflow: hidden;
					background: rgba(3, 7, 18, 0.58);
					border: 1px solid var(--line);
					display: grid;
					place-items: center;
				}

				.kitty-frame img {
					width: 100%;
					height: 100%;
					object-fit: cover;
					display: block;
				}

				.kitty-frame span {
					color: var(--muted);
					padding: 1rem;
					text-align: center;
				}

				.kitty-button {
					justify-self: start;
					border: 0;
					border-radius: 999px;
					padding: 0.8rem 1rem;
					background: linear-gradient(135deg, var(--accent), #fb7185);
					color: #111827;
					font-weight: 800;
					cursor: pointer;
				}
			`}</style>
		</section>
	);
}