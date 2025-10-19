import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Sparkles, Zap, Image as ImageIcon } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Camera className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">pix.immo</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" data-testid="button-login">Login</Button>
            </Link>
            <Link href="/register">
              <Button data-testid="button-register">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/5">
        <div className="container relative z-10 mx-auto px-6 text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl">
            Professional Property
            <br />
            <span className="text-primary">Photography & AI Captions</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Transform your real estate listings with stunning photography and AI-powered image descriptions. 
            Fast, professional, and effortless.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-base" data-testid="button-hero-start">
                Start Your First Order
              </Button>
            </Link>
            <Link href="/gallery">
              <Button size="lg" variant="outline" className="text-base backdrop-blur-md" data-testid="button-hero-gallery">
                View Gallery
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Why Choose pix.immo?</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Everything you need to showcase properties at their best
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <Card data-testid="card-feature-ai">
              <CardHeader>
                <Sparkles className="mb-4 h-12 w-12 text-primary" />
                <CardTitle>AI-Powered Captions</CardTitle>
                <CardDescription>
                  Automatically generate compelling, SEO-friendly descriptions for every image
                </CardDescription>
              </CardHeader>
            </Card>
            <Card data-testid="card-feature-quality">
              <CardHeader>
                <Camera className="mb-4 h-12 w-12 text-primary" />
                <CardTitle>Professional Quality</CardTitle>
                <CardDescription>
                  Expert photographers capture your properties in the best light
                </CardDescription>
              </CardHeader>
            </Card>
            <Card data-testid="card-feature-fast">
              <CardHeader>
                <Zap className="mb-4 h-12 w-12 text-primary" />
                <CardTitle>Fast Turnaround</CardTitle>
                <CardDescription>
                  Get your photos and captions delivered within 48 hours
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">How It Works</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Three simple steps to amazing property listings
            </p>
          </div>
          <div className="grid gap-12 md:grid-cols-3">
            <div className="text-center" data-testid="step-order">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="mb-3 text-xl font-semibold">Place Your Order</h3>
              <p className="text-muted-foreground">
                Submit property details and schedule a photography session
              </p>
            </div>
            <div className="text-center" data-testid="step-shoot">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="mb-3 text-xl font-semibold">Professional Shoot</h3>
              <p className="text-muted-foreground">
                Our photographers capture stunning images of your property
              </p>
            </div>
            <div className="text-center" data-testid="step-deliver">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="mb-3 text-xl font-semibold">AI Processing & Delivery</h3>
              <p className="text-muted-foreground">
                Receive high-quality images with AI-generated captions
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-6 text-center">
          <ImageIcon className="mx-auto mb-6 h-16 w-16 text-primary" />
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Ready to Get Started?</h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            Join hundreds of real estate professionals using pix.immo to elevate their listings
          </p>
          <Link href="/register">
            <Button size="lg" className="text-base" data-testid="button-cta-start">
              Create Your First Order
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t py-12">
        <div className="container mx-auto px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                <span className="font-bold">pix.immo</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Professional property photography with AI-powered captions
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/gallery">Gallery</Link></li>
                <li><Link href="/dashboard">Dashboard</Link></li>
                <li><Link href="/order">Order Now</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Help Center</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
            © 2025 pix.immo. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
