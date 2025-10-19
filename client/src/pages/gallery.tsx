import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

// Fixture dataset: ~45 images with mixed aspect ratios throughout
const galleryImages = [
  // Mix landscape, portrait, and square throughout the grid
  { id: 1, caption: "Modern living room with floor-to-ceiling windows", src: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 2, caption: "Luxury kitchen with marble countertops and island", src: "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 3, caption: "Grand staircase with wrought iron railing", src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1000&h=1500&fit=crop", type: "portrait" },
  { id: 4, caption: "Spacious master bedroom with king bed", src: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 5, caption: "Elegant bathroom with modern fixtures and tub", src: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 6, caption: "Beautiful backyard with swimming pool and patio", src: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 7, caption: "Tall ceiling in great room", src: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1000&h=1500&fit=crop", type: "portrait" },
  { id: 8, caption: "Contemporary home exterior with modern architecture", src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 9, caption: "Cozy dining area with pendant lighting", src: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 10, caption: "Circular dining table with modern chairs", src: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1000&h=1000&fit=crop", type: "square" },
  { id: 11, caption: "Modern apartment building with glass facade", src: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 12, caption: "Luxurious penthouse with city views", src: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 13, caption: "Floor-to-ceiling window wall", src: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1000&h=1500&fit=crop", type: "portrait" },
  { id: 14, caption: "Charming cottage exterior with garden", src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 15, caption: "Renovated loft space with exposed brick", src: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 16, caption: "Open concept kitchen and living area", src: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 17, caption: "Reading nook with armchair", src: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=1000&h=1000&fit=crop", type: "square" },
  { id: 18, caption: "Sunlit guest bedroom with neutral tones", src: "https://images.unsplash.com/photo-1616137466211-f939a420be84?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 19, caption: "Two-story living room with chandelier", src: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1000&h=1500&fit=crop", type: "portrait" },
  { id: 20, caption: "Spa-like bathroom with rainfall shower", src: "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 21, caption: "Balcony terrace with outdoor furniture", src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 22, caption: "Powder room with vessel sink", src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1000&h=1000&fit=crop", type: "square" },
  { id: 23, caption: "Wine cellar with custom storage", src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 24, caption: "Vertical garden wall in entryway", src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&h=1500&fit=crop", type: "portrait" },
  { id: 25, caption: "Media room with projection screen", src: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 26, caption: "Fitness room with equipment and mirrors", src: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 27, caption: "Library with built-in bookshelves", src: "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 28, caption: "Built-in window seat with cushions", src: "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=1000&h=1000&fit=crop", type: "square" },
  { id: 29, caption: "Chef's kitchen with professional appliances", src: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 30, caption: "Walk-in closet with custom cabinetry", src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 31, caption: "Laundry room with washer and dryer", src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 32, caption: "Breakfast nook with bay windows", src: "https://images.unsplash.com/photo-1600210492497-9a3a56c88b24?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 33, caption: "Corner fireplace with mantel", src: "https://images.unsplash.com/photo-1600210492497-9a3a56c88b24?w=1000&h=1000&fit=crop", type: "square" },
  { id: 34, caption: "Game room with pool table", src: "https://images.unsplash.com/photo-1600210492497-9a3a56c88b24?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 35, caption: "Mudroom with storage benches", src: "https://images.unsplash.com/photo-1600210492497-9a3a56c88b24?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 36, caption: "Pantry with organized shelving", src: "https://images.unsplash.com/photo-1600210492497-9a3a56c88b24?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 37, caption: "Nursery with crib and changing table", src: "https://images.unsplash.com/photo-1600210492497-9a3a56c88b24?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 38, caption: "Craft room with work surfaces", src: "https://images.unsplash.com/photo-1600210492497-9a3a56c88b24?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 39, caption: "Outdoor kitchen with grill station", src: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 40, caption: "Fire pit seating area", src: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 41, caption: "Garden pathway with landscaping", src: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 42, caption: "Three-car garage with storage", src: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 43, caption: "Home office with natural light and desk setup", src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 44, caption: "Elegant foyer with chandelier", src: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 45, caption: "Skylight with natural illumination", src: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1000&h=1000&fit=crop", type: "square" },
];

export default function Gallery() {
  const [lightboxImage, setLightboxImage] = useState<typeof galleryImages[0] | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // JS-driven masonry layout with exact 11px gaps
  useEffect(() => {
    let layoutTimeout: NodeJS.Timeout | null = null;

    const performLayout = () => {
      const container = gridRef.current;
      if (!container) return;

      const items = Array.from(container.querySelectorAll<HTMLElement>('.gallery-item-hover'));
      const gap = 11; // Exact 11px gaps
      
      // Determine number of columns based on viewport width
      const containerWidth = container.offsetWidth;
      let numColumns = 1;
      if (containerWidth >= 1200) numColumns = 4;
      else if (containerWidth >= 900) numColumns = 3;
      else if (containerWidth >= 600) numColumns = 2;

      // Calculate column width
      const totalGaps = (numColumns - 1) * gap;
      const columnWidth = (containerWidth - totalGaps) / numColumns;

      // Track column heights
      const columnHeights = new Array(numColumns).fill(0);

      // Position each item
      items.forEach((item) => {
        const img = item.querySelector('img');
        if (!img) return;

        // Get image height - skip if not loaded
        const imgHeight = img.getBoundingClientRect().height;
        if (imgHeight === 0) return; // Skip unloaded images

        // Find shortest column
        const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
        
        // Calculate position
        const x = shortestColumn * (columnWidth + gap);
        const y = columnHeights[shortestColumn];

        // Position item
        item.style.position = 'absolute';
        item.style.width = `${columnWidth}px`;
        item.style.transform = `translate(${x}px, ${y}px)`;

        // Update column height
        columnHeights[shortestColumn] += imgHeight + gap;
      });

      // Set container height (tallest column minus trailing gap)
      const maxHeight = Math.max(...columnHeights) - gap;
      container.style.height = `${Math.max(0, maxHeight)}px`;
    };

    // Debounced layout to handle progressive image loading
    const scheduleLayout = () => {
      if (layoutTimeout) clearTimeout(layoutTimeout);
      layoutTimeout = setTimeout(performLayout, 100);
    };

    // Set up image load listeners
    const images = gridRef.current?.querySelectorAll('img');
    images?.forEach((img) => {
      img.addEventListener('load', scheduleLayout);
      img.addEventListener('error', scheduleLayout); // Also layout on error
    });

    // Initial layout
    scheduleLayout();

    // Force layout after 2 seconds (fallback for any lazy/slow loading images)
    const fallbackTimeout = setTimeout(() => {
      performLayout();
      // Then retry every second for up to 5 more times
      let retries = 0;
      const retryInterval = setInterval(() => {
        performLayout();
        retries++;
        if (retries >= 5) clearInterval(retryInterval);
      }, 1000);
    }, 2000);

    // Relayout on window resize
    window.addEventListener('resize', scheduleLayout);

    return () => {
      if (layoutTimeout) clearTimeout(layoutTimeout);
      clearTimeout(fallbackTimeout);
      window.removeEventListener('resize', scheduleLayout);
      images?.forEach((img) => {
        img.removeEventListener('load', scheduleLayout);
        img.removeEventListener('error', scheduleLayout);
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-[5vw] py-4">
          <Link href="/">
            <div className="text-base font-semibold tracking-wide cursor-pointer" data-testid="brand-logo">
              PIX.IMMO
            </div>
          </Link>
          <button
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            aria-label="Menü öffnen"
            data-testid="button-menu-open"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        {/* Masonry Grid */}
        <div ref={gridRef} className="masonry-grid">
          {galleryImages.map((image) => (
            <div
              key={image.id}
              className="gallery-item-hover"
              data-testid={`image-${image.id}`}
            >
              <div 
                className="gallery-img-wrapper"
                data-caption={image.caption}
                onClick={() => setLightboxImage(image)}
              >
                <img
                  src={image.src}
                  alt=""
                  className="gallery-img"
                  data-testid={`img-${image.id}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setLightboxImage(null)}
          data-testid="lightbox"
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-6 right-6 h-10 w-10"
            onClick={() => setLightboxImage(null)}
            data-testid="button-close-lightbox"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </Button>
          <div className="max-w-6xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage.src}
              alt={lightboxImage.caption}
              className="w-full h-auto"
              data-testid="lightbox-image"
            />
            <p className="mt-6 text-center text-base text-muted-foreground">
              {lightboxImage.caption}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
