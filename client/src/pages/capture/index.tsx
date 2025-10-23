import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Info } from "lucide-react";

export default function CaptureIndex() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Status Bar (iOS-style) */}
      <div className="h-12 bg-background border-b border-border flex items-center justify-between px-4">
        <span className="text-sm text-muted-foreground">9:41</span>
        <span className="text-sm text-muted-foreground">pix.immo</span>
        <div className="flex gap-1">
          <div className="w-6 h-3 border border-muted-foreground rounded-sm" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          {/* Logo/Icon */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="w-12 h-12 text-primary" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">pix.immo Camera</h1>
            <p className="text-muted-foreground">
              Professionelle Immobilienfotografie direkt vom Smartphone
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <Camera className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">High-Quality Capture</h3>
                <p className="text-sm text-muted-foreground">
                  12MP+ Auflösung für gestochen scharfe Aufnahmen
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Upload className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Direkter Upload</h3>
                <p className="text-sm text-muted-foreground">
                  Automatische Synchronisation zu Cloudflare R2
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Offline-Modus</h3>
                <p className="text-sm text-muted-foreground">
                  Fotos werden lokal gespeichert und später hochgeladen
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <Button
              size="lg"
              className="w-full"
              onClick={() => setLocation("/capture/camera")}
              data-testid="button-start-camera"
            >
              <Camera className="w-5 h-5 mr-2" />
              Kamera starten
            </Button>
          </div>

          {/* Alternative Action */}
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            data-testid="button-back-portal"
          >
            Zurück zum Portal
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center text-sm text-muted-foreground border-t border-border">
        <p>Progressive Web App • Installierbar auf Homescreen</p>
      </div>
    </div>
  );
}
