import { Link } from "react-router";

export function HomeHero() {
  return (
    <section className="campaign page-shell" aria-labelledby="campaign-title">
      <div className="campaign-masthead" aria-label="Atelier Uomo">
        Atelier Uomo
      </div>
      <div className="campaign-grid">
        <figure className="campaign-photograph">
          <img
            src="/images/atelier-editorial.webp"
            alt="Menswear editorial: an espresso knit polo and charcoal tailoring in a sunlit stone courtyard"
            width={1122}
            height={1402}
            fetchPriority="high"
            loading="eager"
          />
          <figcaption>An Italian state of mind.</figcaption>
        </figure>
        <div className="campaign-story">
          <p className="editorial-kicker">The everyday issue</p>
          <h1 id="campaign-title">
            Less, but
            <br />
            with feeling.
          </h1>
          <p className="campaign-description">
            For slow mornings. Long afternoons.
            <br />
            And everything in between.
          </p>
          <Link to="/collections" className="editorial-link">
            Discover the collection <span aria-hidden="true">↗</span>
          </Link>
          <div className="campaign-note">
            <span className="atelier-symbol" aria-hidden="true">
              Au.
            </span>
            <p>
              A considered wardrobe.
              <br />
              An individual point of view.
            </p>
          </div>
        </div>
      </div>
      <div className="campaign-caption">
        <span>Atelier Uomo — a menswear study</span>
        <span>Clothing for the everyday</span>
      </div>
    </section>
  );
}
