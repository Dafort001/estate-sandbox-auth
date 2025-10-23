import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Camera, Image, Upload } from "lucide-react";

export default function SplashScreen() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-background p-8">
      {/* Logo/Brand */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto bg-primary rounded-3xl flex items-center justify-center">
            <Camera className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold">pix.immo</h1>
          <p className="text-muted-foreground text-lg">
            Professional Real Estate Photography
          </p>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="w-full max-w-md space-y-4 mb-8">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-card border">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Camera className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Professionelle Kamera</h3>
            <p className="text-sm text-muted-foreground">HDR & RAW Support</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl bg-card border">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Image className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Galerie-Verwaltung</h3>
            <p className="text-sm text-muted-foreground">Organisiere deine Fotos</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl bg-card border">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Automatischer Upload</h3>
            <p className="text-sm text-muted-foreground">Direkt zur Cloud</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-md space-y-3">
        <Button
          className="w-full h-14 text-lg"
          onClick={() => setLocation("/app/camera")}
          data-testid="button-start-camera"
        >
          <Camera className="w-5 h-5 mr-2" />
          Kamera öffnen
        </Button>
        
        <Button
          variant="outline"
          className="w-full h-14 text-lg"
          onClick={() => setLocation("/app/gallery")}
          data-testid="button-open-gallery"
        >
          <Image className="w-5 h-5 mr-2" />
          Galerie ansehen
        </Button>

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setLocation("/")}
          data-testid="link-back-home"
        >
          Zurück zur Website
        </Button>
      </div>
    </div>
  );
}
