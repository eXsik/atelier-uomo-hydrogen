import { useState } from "react";
import { Link } from "react-router";
import type { HomeHeroData } from "~/lib/home-hero";

export function HomeHero({ hero }: { hero: HomeHeroData }) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const image = hero.image?.url !== failedImageUrl ? hero.image : null;

  return (
    <section
      className="atelier-hero max-w-page px-margin mx-auto w-full"
      aria-labelledby="hero-heading"
    >
      <div className="atelier-hero-copy">
        <p className="text-sm">Atelier Uomo / Everyday wardrobe</p>
        <h1 id="hero-heading">A considered way to dress.</h1>
        <p className="atelier-hero-description">
          Start with the essentials. Explore clothing and accessories for the
          rhythm of every day.
        </p>
        <Link
          to="/collections"
          className="button-primary inline-flex min-h-11 items-center justify-center px-7 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          Explore the collection
        </Link>
        <p className="mt-8 text-xs text-on-surface-secondary">
          An independent menswear storefront concept.
        </p>
      </div>
      <Link
        to={hero.to}
        className="atelier-hero-image group bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
        aria-label={`Explore ${hero.heading}`}
      >
        {image ? (
          <img
            src={image.url}
            alt={image.altText ?? hero.heading}
            fetchPriority="high"
            loading="eager"
            onError={() => setFailedImageUrl(image.url)}
          />
        ) : null}
        <span className="atelier-hero-caption">Explore {hero.heading}</span>
      </Link>
    </section>
  );
}
