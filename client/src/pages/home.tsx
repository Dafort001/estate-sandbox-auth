import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { SEOHead, SchemaTemplates } from "@/components/SEOHead";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SEOHead
        title="Professionelle Immobilienfotografie Hamburg & Berlin"
        description="PIX.IMMO - Professionelle Immobilienfotografie, Drohnenaufnahmen, 360°-Touren und Videos für Hamburg und Berlin. KI-gestützte Bildoptimierung und schnelle Lieferung."
        path="/"
        schema={SchemaTemplates.localBusiness}
      />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center justify-between px-[5vw] py-4">
          <div className="text-base font-semibold tracking-wide" data-testid="brand-logo">
            PIX.IMMO
          </div>
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            aria-label="Menü öffnen"
            aria-expanded={isMenuOpen}
            data-testid="button-menu-open"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main content area - fills remaining space, pushes image strip to bottom */}
      <div className="flex-1 flex flex-col min-h-[calc(100vh-4rem)]">
        {/* Spacer to push content down */}
        <div className="flex-1" aria-hidden="true" />
        
        {/* Hero Section - Just subtitle, no large title */}
        <section className="px-[5vw]">
          <p className="text-lg md:text-xl text-gray-600 tracking-wide mb-10" data-testid="hero-subtitle" style={{ marginTop: '23px' }}>
            Professionelle Immobilienfotografie
          </p>
        </section>

        {/* Navigation Links (plain text buttons) - 11px above image strip */}
        <nav className="flex items-center gap-6 px-[5vw] py-4 mb-[11px]" aria-label="Hauptnavigation">
        <Link href="/gallery">
          <span className="text-sm font-medium hover:underline cursor-pointer" data-testid="link-portfolio">Portfolio</span>
        </Link>
        <Link href="/preise">
          <span className="text-sm font-medium hover:underline cursor-pointer" data-testid="link-preise">Preise</span>
        </Link>
        <Link href="/blog">
          <span className="text-sm font-medium hover:underline cursor-pointer" data-testid="link-blog">
            Blog
          </span>
        </Link>
        <Link href="/login">
          <span className="text-sm font-medium hover:underline cursor-pointer" data-testid="link-login">Anmelden</span>
        </Link>
        </nav>

        {/* Horizontal Image Strip */}
        <div className="overflow-hidden bg-gray-100 h-[48vh] min-h-[300px] max-h-[620px]" data-testid="image-strip-container">
        <div
          ref={stripRef}
          className="flex gap-[11px] h-full image-strip"
          style={{
            animation: "scroll 120s linear infinite",
            willChange: "transform"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.animationPlayState = "paused";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.animationPlayState = "running";
          }}
        >
          {/* Set A - Original */}
          <div className="h-full flex-shrink-0 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center" style={{ width: "auto", aspectRatio: "3/2" }} data-testid="strip-img-1">
            <span className="text-white text-sm">Dummy 1200×800</span>
          </div>
          <div className="h-full flex-shrink-0 bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center" style={{ width: "auto", aspectRatio: "2/3" }} data-testid="strip-img-2">
            <span className="text-white text-sm">Dummy 560×880</span>
          </div>
          <div className="h-full flex-shrink-0 bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center" style={{ width: "auto", aspectRatio: "3/2" }} data-testid="strip-img-3">
            <span className="text-white text-sm">Dummy 1050×700</span>
          </div>
          <div className="h-full flex-shrink-0 bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center" style={{ width: "auto", aspectRatio: "1/1" }} data-testid="strip-img-4">
            <span className="text-white text-sm">Dummy 820×820</span>
          </div>
          <div className="h-full flex-shrink-0 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center" style={{ width: "auto", aspectRatio: "3/2" }} data-testid="strip-img-5">
            <span className="text-white text-sm">Dummy 1200×700</span>
          </div>
          <div className="h-full flex-shrink-0 bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center" style={{ width: "auto", aspectRatio: "2/3" }} data-testid="strip-img-6">
            <span className="text-white text-sm">Dummy 700×1050</span>
          </div>
          <div className="h-full flex-shrink-0 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center" style={{ width: "auto", aspectRatio: "3/2" }} data-testid="strip-img-7">
            <span className="text-white text-sm">Dummy 1500×1000</span>
          </div>

          {/* Set B - Duplicate for seamless loop */}
          <div className="h-full flex-shrink-0 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center" style={{ width: "auto", aspectRatio: "3/2" }} aria-hidden="true">
            <span className="text-white text-sm">Dummy 1200×800</span>
          </div>
          <div className="h-full flex-shrink-0 bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center" style={{ width: "auto", aspectRatio: "2/3" }} aria-hidden="true">
            <span className="text-white text-sm">Dummy 560×880</span>
          </div>
          <div className="h-full flex-shrink-0 bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center" style={{ width: "auto", aspectRatio: "3/2" }} aria-hidden="true">
            <span className="text-white text-sm">Dummy 1050×700</span>
          </div>
          <div className="h-full flex-shrink-0 bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center" style={{ width: "auto", aspectRatio: "1/1" }} aria-hidden="true">
            <span className="text-white text-sm">Dummy 820×820</span>
          </div>
          <div className="h-full flex-shrink-0 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center" style={{ width: "auto", aspectRatio: "3/2" }} aria-hidden="true">
            <span className="text-white text-sm">Dummy 1200×700</span>
          </div>
          <div className="h-full flex-shrink-0 bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center" style={{ width: "auto", aspectRatio: "2/3" }} aria-hidden="true">
            <span className="text-white text-sm">Dummy 700×1050</span>
          </div>
          <div className="h-full flex-shrink-0 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center" style={{ width: "auto", aspectRatio: "3/2" }} aria-hidden="true">
            <span className="text-white text-sm">Dummy 1500×1000</span>
          </div>

          {/* Set C - Second duplicate for smooth infinite scroll */}
          <div className="h-full flex-shrink-0 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center" style={{ width: "auto", aspectRatio: "3/2" }} aria-hidden="true">
            <span className="text-white text-sm">Dummy 1200×800</span>
          </div>
          <div className="h-full flex-shrink-0 bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center" style={{ width: "auto", aspectRatio: "2/3" }} aria-hidden="true">
            <span className="text-white text-sm">Dummy 560×880</span>
          </div>
          <div className="h-full flex-shrink-0 bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center" style={{ width: "auto", aspectRatio: "3/2" }} aria-hidden="true">
            <span className="text-white text-sm">Dummy 1050×700</span>
          </div>
          <div className="h-full flex-shrink-0 bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center" style={{ width: "auto", aspectRatio: "1/1" }} aria-hidden="true">
            <span className="text-white text-sm">Dummy 820×820</span>
          </div>
          <div className="h-full flex-shrink-0 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center" style={{ width: "auto", aspectRatio: "3/2" }} aria-hidden="true">
            <span className="text-white text-sm">Dummy 1200×700</span>
          </div>
          <div className="h-full flex-shrink-0 bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center" style={{ width: "auto", aspectRatio: "2/3" }} aria-hidden="true">
            <span className="text-white text-sm">Dummy 700×1050</span>
          </div>
          <div className="h-full flex-shrink-0 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center" style={{ width: "auto", aspectRatio: "3/2" }} aria-hidden="true">
            <span className="text-white text-sm">Dummy 1500×1000</span>
          </div>
        </div>
      </div>
      </div>

      {/* Footer - appears after scrolling */}
      <footer className="py-6 border-t border-gray-200 flex-shrink-0">
        <div className="flex justify-center items-center gap-6 px-[5vw] text-xs text-gray-500">
          <Link href="/impressum">
            <span className="hover:underline cursor-pointer" data-testid="link-impressum">
              Impressum
            </span>
          </Link>
          <Link href="/agb">
            <span className="hover:underline cursor-pointer" data-testid="link-agb">
              AGB & Datenschutz
            </span>
          </Link>
          <Link href="/kontakt">
            <span className="hover:underline cursor-pointer" data-testid="link-kontakt">
              Kontakt
            </span>
          </Link>
        </div>
      </footer>

      {/* Hamburger Menu Drawer */}
      {isMenuOpen && (
        <aside
          className="fixed inset-0 z-50"
          aria-hidden={!isMenuOpen}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMenuOpen(false);
          }}
          data-testid="menu-drawer"
        >
          <div className="absolute top-16 right-[5vw] rounded-lg p-6 min-w-[200px]">
            <div className="flex items-center justify-end mb-6">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="hover:opacity-70"
                aria-label="Menü schließen"
                data-testid="button-menu-close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav>
              <ul className="space-y-3">
                <li>
                  <Link href="/gallery">
                    <span
                      className="block text-base font-medium hover:underline cursor-pointer"
                      onClick={() => setIsMenuOpen(false)}
                      data-testid="menu-link-portfolio"
                    >
                      Portfolio
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/preise">
                    <span
                      className="block text-base font-medium hover:underline cursor-pointer"
                      onClick={() => setIsMenuOpen(false)}
                      data-testid="menu-link-preise"
                    >
                      Preise
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/blog">
                    <span
                      className="block text-base font-medium hover:underline cursor-pointer"
                      onClick={() => setIsMenuOpen(false)}
                      data-testid="menu-link-blog"
                    >
                      Blog
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/login">
                    <span
                      className="block text-base font-medium hover:underline cursor-pointer"
                      onClick={() => setIsMenuOpen(false)}
                      data-testid="menu-link-login"
                    >
                      Anmelden
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/impressum">
                    <span
                      className="block text-base font-medium hover:underline cursor-pointer"
                      onClick={() => setIsMenuOpen(false)}
                      data-testid="menu-link-impressum"
                    >
                      Impressum
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/agb">
                    <span
                      className="block text-base font-medium hover:underline cursor-pointer"
                      onClick={() => setIsMenuOpen(false)}
                      data-testid="menu-link-agb"
                    >
                      AGB & Datenschutz
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/kontakt">
                    <span
                      className="block text-base font-medium hover:underline cursor-pointer"
                      onClick={() => setIsMenuOpen(false)}
                      data-testid="menu-link-kontakt"
                    >
                      Kontakt
                    </span>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </aside>
      )}

      {/* CSS Animation for image strip */}
      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-66.667%);
          }
        }
      `}</style>
    </div>
  );
}
