import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
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
            <span className="text-sm text-gray-500">Menü</span>
          </button>
        </div>
      </header>

      {/* Generous whitespace */}
      <div className="h-[35vh]" aria-hidden="true" />

      {/* Hero Section */}
      <section className="px-[5vw] mb-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Hero text */}
          <div className="flex flex-col justify-center">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6" data-testid="hero-title">
              PIX.IMMO
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 tracking-wide" data-testid="hero-subtitle">
              Corporate real estate photography
            </p>
          </div>

          {/* Right: Empty (whitespace) */}
          <div aria-hidden="true" />
        </div>
      </section>

      {/* Navigation Links (plain text buttons) */}
      <nav className="flex items-center gap-6 px-[5vw] py-4 mb-8" aria-label="Hauptnavigation">
        <Link href="/gallery">
          <span className="text-sm font-medium hover:underline cursor-pointer" data-testid="link-portfolio">Portfolio</span>
        </Link>
        <a href="#preise" className="text-sm font-medium hover:underline" data-testid="link-preise">
          Preise
        </a>
        <a href="#blog" className="text-sm font-medium hover:underline" data-testid="link-blog">
          Blog
        </a>
        <Link href="/login">
          <span className="text-sm font-medium hover:underline cursor-pointer" data-testid="link-login">Login</span>
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

      {/* Whitespace after strip */}
      <div className="h-[40vh]" aria-hidden="true" />

      {/* Footer */}
      <footer className="py-6 border-t border-gray-200">
        <div className="flex justify-center items-center gap-6 px-[5vw] text-xs text-gray-500">
          <a href="#impressum" className="hover:underline" data-testid="link-impressum">
            Impressum
          </a>
          <a href="#datenschutz" className="hover:underline" data-testid="link-datenschutz">
            Datenschutz
          </a>
          <a href="#kontakt" className="hover:underline" data-testid="link-kontakt">
            Kontakt
          </a>
        </div>
      </footer>

      {/* Hamburger Menu Drawer */}
      {isMenuOpen && (
        <aside
          className="fixed inset-0 z-50 bg-white/98 backdrop-blur-sm"
          aria-hidden={!isMenuOpen}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMenuOpen(false);
          }}
          data-testid="menu-drawer"
        >
          <div className="max-w-2xl mx-auto px-[5vw] py-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-semibold">Menü</h3>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
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
                  <a
                    href="#preise"
                    className="block text-base font-medium hover:underline"
                    onClick={() => setIsMenuOpen(false)}
                    data-testid="menu-link-preise"
                  >
                    Preise
                  </a>
                </li>
                <li>
                  <a
                    href="#blog"
                    className="block text-base font-medium hover:underline"
                    onClick={() => setIsMenuOpen(false)}
                    data-testid="menu-link-blog"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <Link href="/login">
                    <span
                      className="block text-base font-medium hover:underline cursor-pointer"
                      onClick={() => setIsMenuOpen(false)}
                      data-testid="menu-link-login"
                    >
                      Login
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard">
                    <span
                      className="block text-base font-medium hover:underline cursor-pointer"
                      onClick={() => setIsMenuOpen(false)}
                      data-testid="menu-link-dashboard"
                    >
                      Dashboard
                    </span>
                  </Link>
                </li>
                <li>
                  <a
                    href="#impressum"
                    className="block text-base font-medium hover:underline"
                    onClick={() => setIsMenuOpen(false)}
                    data-testid="menu-link-impressum"
                  >
                    Impressum
                  </a>
                </li>
                <li>
                  <a
                    href="#datenschutz"
                    className="block text-base font-medium hover:underline"
                    onClick={() => setIsMenuOpen(false)}
                    data-testid="menu-link-datenschutz"
                  >
                    Datenschutz
                  </a>
                </li>
                <li>
                  <a
                    href="#kontakt"
                    className="block text-base font-medium hover:underline"
                    onClick={() => setIsMenuOpen(false)}
                    data-testid="menu-link-kontakt"
                  >
                    Kontakt
                  </a>
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
