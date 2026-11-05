import { useEffect, useMemo, useRef, useState } from "react";

import type { ProductData, ProductVariantData } from "~/lib/product";

type ProductImage = {
  id?: string | null;
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

function useGalleryImages(
  product: ProductData,
  selectedVariant: ProductVariantData | null,
) {
  return useMemo(() => {
    const images: ProductImage[] = [];
    const seen = new Set<string>();

    const addImage = (image: ProductImage | null | undefined) => {
      if (!image?.url || seen.has(image.url)) return;
      seen.add(image.url);
      images.push(image);
    };

    addImage(
      selectedVariant?.image ??
        product.featuredImage ??
        product.images.nodes[0],
    );

    for (const image of product.images.nodes) {
      addImage(image);
    }

    return images;
  }, [product, selectedVariant]);
}

function galleryDotClass(active: boolean) {
  if (active) return "bg-on-surface size-2 rounded-full";
  return "bg-on-surface/30 size-2 rounded-full";
}

export function ProductGallery({
  product,
  selectedVariant,
}: {
  product: ProductData;
  selectedVariant: ProductVariantData | null;
}) {
  const images = useGalleryImages(product, selectedVariant);
  const primaryImageUrl = images[0]?.url;
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveIndex(0);

    if (trackRef.current) {
      trackRef.current.scrollLeft = 0;
    }
  }, [primaryImageUrl]);

  return (
    <div data-testid="product-gallery">
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={product.title}
        className="relative grid"
      >
        <div
          data-product-gallery-track
          ref={trackRef}
          className="flex snap-x snap-mandatory overflow-x-auto md:grid md:grid-cols-2 md:overflow-visible"
          style={{ scrollbarWidth: "none" }}
          tabIndex={0}
          onScroll={(event) => {
            const track = event.currentTarget;
            if (track.clientWidth > 0) {
              setActiveIndex(Math.round(track.scrollLeft / track.clientWidth));
            }
          }}
        >
          {images.map((image, index) => (
            <div
              key={image.url}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} of ${images.length}`}
              className="w-full shrink-0 snap-center contain-paint md:w-auto md:shrink"
            >
              <div className="aspect-square overflow-hidden bg-surface-secondary">
                <img
                  src={image.url}
                  alt={image.altText ?? product.title}
                  width={image.width ?? undefined}
                  height={image.height ?? undefined}
                  className="h-full w-full object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  data-testid={
                    index === 0 ? "product-gallery-image" : undefined
                  }
                />
              </div>
            </div>
          ))}
        </div>

        {images.length > 1 ? (
          <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-3 md:hidden">
            <div
              data-slideshow-dots
              role="group"
              aria-label="Slideshow pagination"
              className="flex items-center justify-center gap-2"
            >
              {images.map((image, index) => (
                <span
                  key={image.url}
                  className={galleryDotClass(index === activeIndex)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
