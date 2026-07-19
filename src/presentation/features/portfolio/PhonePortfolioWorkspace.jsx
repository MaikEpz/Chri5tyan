import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/cormorant-garamond/latin-600.css";
import chrisLogoUrl from "../../../assets/branding/chris-logo.svg";
import { PRODUCTION_REFERENCES } from "../../../domain/production/productionReferences.js";
import { getPortfolioImage } from "./portfolioImages.js";

export function PhonePortfolioWorkspace({ onBack }) {
  return (
    <div className="phone-portfolio-workspace">
      <header className="portfolio-header">
        <button type="button" onClick={onBack}>
          <span aria-hidden="true">←</span>
          Volver
        </button>
        <span className="portfolio-brand" aria-label="Chris">
          <img src={chrisLogoUrl} alt="" aria-hidden="true" />
        </span>
        <span className="portfolio-header-label">Referencias</span>
      </header>

      <main className="portfolio-main">
        <section className="portfolio-intro">
          <span>Producciones seleccionadas</span>
          <h1>Historias que toman forma.</h1>
          <p>
            Una muestra breve de los formatos que podemos desarrollar,
            desde contenido vertical hasta producciones cinematográficas.
          </p>
        </section>

        <section className="portfolio-reference-list" aria-label="Referencias de producción">
          {PRODUCTION_REFERENCES.map((reference, index) => (
            <ReferenceCard
              key={reference.id}
              index={String(index + 1).padStart(2, "0")}
              reference={reference}
            />
          ))}
        </section>

        <footer className="portfolio-footer">
          <p>¿Tienes una referencia en mente?</p>
          <button type="button">Conversemos sobre tu proyecto →</button>
        </footer>
      </main>
    </div>
  );
}

function ReferenceCard({ index, reference }) {
  const imageUrl = getPortfolioImage(reference.imageId);

  return (
    <article
      className="portfolio-reference-card"
      data-featured={index === "01"}
    >
      <div className="portfolio-reference-media">
        <img
          src={imageUrl}
          alt={`Referencia ${reference.title}: ${reference.client}`}
          loading="lazy"
          decoding="async"
        />
        <span>{index}</span>
      </div>
      <div className="portfolio-reference-content">
        <div className="portfolio-reference-heading">
          <div>
            <small>{reference.category}</small>
            <h2>{reference.title}</h2>
            <p>{reference.client}</p>
          </div>
        </div>
        <p className="portfolio-reference-description">{reference.description}</p>
        <ul className="portfolio-reference-details">
          {reference.details.map((detail) => <li key={detail}>{detail}</li>)}
        </ul>
        <div className="portfolio-reference-services">
          <span>Servicios</span>
          <p>{reference.services.join(" · ")}</p>
        </div>
        <button type="button">Ver referencia →</button>
      </div>
    </article>
  );
}
