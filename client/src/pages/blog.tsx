import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";

// Mock blog data - 9 portrait images with titles
const blogPosts = [
  {
    id: 1,
    slug: "fruehlingsduft",
    title: "Es fliegt, es fliegt ...der warme Frühlingsduft",
    thumbnail: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=600&h=900&fit=crop",
  },
  {
    id: 2,
    slug: "kaffee-moment",
    title: "Der perfekte Kaffee-Moment",
    thumbnail: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=900&fit=crop",
  },
  {
    id: 3,
    slug: "urban-leben",
    title: "Urbanes Leben in der Moderne",
    thumbnail: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=900&fit=crop",
  },
  {
    id: 4,
    slug: "kulinarik",
    title: "Kulinarische Entdeckungen",
    thumbnail: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=900&fit=crop",
  },
  {
    id: 5,
    slug: "natur-pur",
    title: "Natur Pur",
    thumbnail: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=900&fit=crop",
  },
  {
    id: 6,
    slug: "architektur",
    title: "Architektonische Meisterwerke",
    thumbnail: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=900&fit=crop",
  },
  {
    id: 7,
    slug: "lichtspiel",
    title: "Das Spiel mit dem Licht",
    thumbnail: "https://images.unsplash.com/photo-1477346611705-65d1883cee1e?w=600&h=900&fit=crop",
  },
  {
    id: 8,
    slug: "minimalism",
    title: "Minimalismus im Alltag",
    thumbnail: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=600&h=900&fit=crop",
  },
  {
    id: 9,
    slug: "zeitlos",
    title: "Zeitlose Eleganz",
    thumbnail: "https://images.unsplash.com/photo-1464550838636-1a3496df938b?w=600&h=900&fit=crop",
  },
];

export default function Blog() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

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
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-[5vw] py-4">
          <Link href="/">
            <div className="text-base font-semibold tracking-wide cursor-pointer" data-testid="brand-logo">
              PIX.IMMO
            </div>
          </Link>
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

      {/* Blog Grid */}
      <main className="px-[5vw] py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-12 tracking-wide" data-testid="page-title">
          Blog
        </h1>

        {/* 3-column grid for portrait images */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[11px]">
          {blogPosts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <div
                className="relative aspect-[2/3] overflow-hidden bg-gray-100 cursor-pointer group"
                onMouseEnter={() => setHoveredId(post.id)}
                onMouseLeave={() => setHoveredId(null)}
                data-testid={`blog-card-${post.slug}`}
              >
                <img
                  src={post.thumbnail}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Dark overlay with title on hover */}
                <div
                  className={`absolute inset-0 bg-black/60 flex items-center justify-center p-6 transition-opacity duration-300 ${
                    hoveredId === post.id ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <h2 className="text-white text-lg md:text-xl font-semibold text-center leading-tight">
                    {post.title}
                  </h2>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Hamburger Menu Drawer */}
      {isMenuOpen && (
        <aside
          className="fixed inset-0 z-50 bg-white/98"
          aria-hidden={!isMenuOpen}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMenuOpen(false);
          }}
          data-testid="menu-drawer"
        >
          <div className="absolute top-16 right-[5vw] bg-white shadow-lg rounded-lg p-6 min-w-[200px]">
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
              </ul>
            </nav>
          </div>
        </aside>
      )}
    </div>
  );
}
