import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Home } from "lucide-react";

const placeholderImages = [
  { id: 1, alt: "Modern living room with large windows" },
  { id: 2, alt: "Luxury kitchen with marble countertops" },
  { id: 3, alt: "Spacious master bedroom" },
  { id: 4, alt: "Elegant bathroom with modern fixtures" },
  { id: 5, alt: "Beautiful backyard with pool" },
  { id: 6, alt: "Contemporary home exterior" },
  { id: 7, alt: "Cozy dining area" },
  { id: 8, alt: "Home office with natural light" },
  { id: 9, alt: "Modern apartment building" },
  { id: 10, alt: "Luxurious penthouse view" },
  { id: 11, alt: "Charming cottage exterior" },
  { id: 12, alt: "Renovated loft space" },
];

export default function Gallery() {
  return (
    <div className="min-h-screen">
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
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Property Gallery</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Explore our portfolio of professional property photography with AI-generated captions
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {placeholderImages.map((image) => (
            <Card
              key={image.id}
              className="group overflow-hidden transition-all hover:shadow-lg hover-elevate"
              data-testid={`card-image-${image.id}`}
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-muted via-muted/50 to-background relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="h-16 w-16 text-muted-foreground/30" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-sm font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  {image.alt}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="mb-6 text-muted-foreground">
            Ready to showcase your properties with stunning photography?
          </p>
          <Link href="/order">
            <Button size="lg" data-testid="button-order">
              Order Photography Session
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
