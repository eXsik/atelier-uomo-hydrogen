import { Link } from "react-router";
import type { StorefrontShop } from "~/lib/storefront-shop";

export function Footer({ shopInfo }: { shopInfo: StorefrontShop }) {
  return (
    <footer className="atelier-footer">
      <div className="page-shell">
        <div className="footer-top">
          <div>
            <p className="editorial-kicker">An individual point of view</p>
            <h2>
              Well dressed.
              <br />
              Entirely yourself.
            </h2>
          </div>
          <nav aria-label="Footer navigation" className="footer-nav">
            <Link to="/collections">The collection</Link>
            <Link to="/search">Find a piece</Link>
            <Link to="/cart">Your bag</Link>
            <Link to="/account">Your account</Link>
          </nav>
          <p className="footer-project-note">
            An independent menswear concept.
            <br />
            Built as a portfolio storefront.
            <br />
            Demo catalog by mock.shop.
          </p>
        </div>
        <p className="footer-wordmark" aria-label={shopInfo.name}>
          Atelier Uomo
        </p>
        <div className="footer-bottom">
          <span>
            © {new Date().getUTCFullYear()} {shopInfo.name}
          </span>
          <span>A considered wardrobe. A personal style.</span>
          <a href="#main-content">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
