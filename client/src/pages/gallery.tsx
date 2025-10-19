import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Camera, Home, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

// Fixture dataset: ~45 images with proper aspect ratio distribution
const galleryImages = [
  // Landscape images (34 items = 75%)
  { id: 1, caption: "Modern living room with floor-to-ceiling windows", src: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 2, caption: "Luxury kitchen with marble countertops and island", src: "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 3, caption: "Spacious master bedroom with king bed", src: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 4, caption: "Elegant bathroom with modern fixtures and tub", src: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 5, caption: "Beautiful backyard with swimming pool and patio", src: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 6, caption: "Contemporary home exterior with modern architecture", src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 7, caption: "Cozy dining area with pendant lighting", src: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 8, caption: "Home office with natural light and desk setup", src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 9, caption: "Modern apartment building with glass facade", src: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 10, caption: "Luxurious penthouse with city views", src: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 11, caption: "Charming cottage exterior with garden", src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 12, caption: "Renovated loft space with exposed brick", src: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 13, caption: "Open concept kitchen and living area", src: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 14, caption: "Elegant foyer with chandelier", src: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 15, caption: "Sunlit guest bedroom with neutral tones", src: "https://images.unsplash.com/photo-1616137466211-f939a420be84?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 16, caption: "Spa-like bathroom with rainfall shower", src: "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 17, caption: "Balcony terrace with outdoor furniture", src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 18, caption: "Wine cellar with custom storage", src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 19, caption: "Media room with projection screen", src: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 20, caption: "Fitness room with equipment and mirrors", src: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 21, caption: "Library with built-in bookshelves", src: "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 22, caption: "Chef's kitchen with professional appliances", src: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 23, caption: "Walk-in closet with custom cabinetry", src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 24, caption: "Laundry room with washer and dryer", src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 25, caption: "Breakfast nook with bay windows", src: "https://images.unsplash.com/photo-1600210492497-9a3a56c88b24?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 26, caption: "Game room with pool table", src: "https://images.unsplash.com/photo-1600210492497-9a3a56c88b24?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 27, caption: "Mudroom with storage benches", src: "https://images.unsplash.com/photo-1600210492497-9a3a56c88b24?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 28, caption: "Pantry with organized shelving", src: "https://images.unsplash.com/photo-1600210492497-9a3a56c88b24?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 29, caption: "Nursery with crib and changing table", src: "https://images.unsplash.com/photo-1600210492497-9a3a56c88b24?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 30, caption: "Craft room with work surfaces", src: "https://images.unsplash.com/photo-1600210492497-9a3a56c88b24?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 31, caption: "Outdoor kitchen with grill station", src: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 32, caption: "Fire pit seating area", src: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 33, caption: "Garden pathway with landscaping", src: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1500&h=1000&fit=crop", type: "landscape" },
  { id: 34, caption: "Three-car garage with storage", src: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1500&h=1000&fit=crop", type: "landscape" },

  // Portrait images (5 items = 11%)
  { id: 35, caption: "Grand staircase with wrought iron railing", src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1000&h=1500&fit=crop", type: "portrait" },
  { id: 36, caption: "Tall ceiling in great room", src: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1000&h=1500&fit=crop", type: "portrait" },
  { id: 37, caption: "Floor-to-ceiling window wall", src: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1000&h=1500&fit=crop", type: "portrait" },
  { id: 38, caption: "Two-story living room with chandelier", src: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1000&h=1500&fit=crop", type: "portrait" },
  { id: 39, caption: "Vertical garden wall in entryway", src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&h=1500&fit=crop", type: "portrait" },

  // Square images (6 items = 13%)
  { id: 40, caption: "Circular dining table with modern chairs", src: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1000&h=1000&fit=crop", type: "square" },
  { id: 41, caption: "Reading nook with armchair", src: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=1000&h=1000&fit=crop", type: "square" },
  { id: 42, caption: "Powder room with vessel sink", src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1000&h=1000&fit=crop", type: "square" },
  { id: 43, caption: "Built-in window seat with cushions", src: "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=1000&h=1000&fit=crop", type: "square" },
  { id: 44, caption: "Corner fireplace with mantel", src: "https://images.unsplash.com/photo-1600210492497-9a3a56c88b24?w=1000&h=1000&fit=crop", type: "square" },
  { id: 45, caption: "Skylight with natural illumination", src: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1000&h=1000&fit=crop", type: "square" },
];

export default function Gallery() {
  const [lightboxImage, setLightboxImage] = useState<typeof galleryImages[0] | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Calculate row spans based on image heights for true masonry effect
  useEffect(() => {
    const resizeAllGridItems = () => {
      const grid = gridRef.current;
      if (!grid) return;

      const items = grid.querySelectorAll<HTMLElement>('.masonry-grid-item');
      const rowHeight = parseInt(getComputedStyle(grid).getPropertyValue('grid-auto-rows'));
      const rowGap = parseInt(getComputedStyle(grid).getPropertyValue('grid-row-gap'));

      items.forEach((item) => {
        const img = item.querySelector('img');
        if (!img) return;

        const height = img.getBoundingClientRect().height;
        const rowSpan = Math.ceil((height + rowGap) / (rowHeight + rowGap));
        item.style.gridRowEnd = `span ${rowSpan}`;
      });
    };

    // Resize on load and window resize
    const images = gridRef.current?.querySelectorAll('img');
    images?.forEach((img) => {
      if (img.complete) {
        resizeAllGridItems();
      } else {
        img.addEventListener('load', resizeAllGridItems);
      }
    });

    window.addEventListener('resize', resizeAllGridItems);
    return () => window.removeEventListener('resize', resizeAllGridItems);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/">
            <div className="flex items-center gap-2 hover-elevate active-elevate-2 cursor-pointer px-3 py-2 rounded-lg">
              <Camera className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">pix.immo</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" data-testid="button-home">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" data-testid="button-dashboard">
                Dashboard
              </Button>
            </Link>
          </div>
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
              data-caption={image.caption}
              onClick={() => setLightboxImage(image)}
            >
              <img
                src={image.src}
                alt=""
                loading="lazy"
                className="gallery-img"
                data-testid={`img-${image.id}`}
              />
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
