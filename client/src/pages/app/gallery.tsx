import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HapticButton } from "@/components/mobile/HapticButton";
import { StatusBar } from "@/components/mobile/StatusBar";
import { BottomNav } from "@/components/mobile/BottomNav";
import { useToast } from "@/hooks/use-toast";

export default function GalleryScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    // Load photos from sessionStorage
    const storedPhotos = JSON.parse(sessionStorage.getItem("appPhotos") || "[]");
    setPhotos(storedPhotos);
  }, []);

  const deletePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    sessionStorage.setItem("appPhotos", JSON.stringify(newPhotos));
    setSelectedPhoto(null);
    toast({
      title: "Foto gelöscht",
      description: `${newPhotos.length} Foto(s) verbleibend`,
    });
  };

  const uploadPhotos = () => {
    if (photos.length === 0) {
      toast({
        title: "Keine Fotos",
        description: "Nimm zuerst Fotos auf!",
        variant: "destructive",
      });
      return;
    }
    setLocation("/app/upload");
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Status Bar */}
      <StatusBar showNotch={false} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <HapticButton
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/app")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </HapticButton>
        <h1 className="text-lg font-semibold">Galerie</h1>
        {photos.length > 0 && (
          <span className="text-sm text-muted-foreground" data-testid="text-total-photos">{photos.length}</span>
        )}
        {photos.length === 0 && <div className="w-10" />}
      </div>

      {/* Photo Grid or Empty State */}
      <div className="flex-1 overflow-y-auto pb-24">
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <Upload className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2" data-testid="text-empty-state-title">Keine Fotos</h2>
            <p className="text-muted-foreground mb-6" data-testid="text-empty-state-description">
              Öffne die Kamera und nimm dein erstes Foto auf
            </p>
            <Button onClick={() => setLocation("/app/camera")} data-testid="button-open-camera">
              Kamera öffnen
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 p-1">
            {photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => setSelectedPhoto(photo)}
                className="aspect-square relative overflow-hidden rounded-lg hover-elevate"
                data-testid={`photo-${index}`}
              >
                <img
                  src={photo}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Upload Button (Floating) */}
      {photos.length > 0 && (
        <div className="absolute bottom-24 right-6 z-30">
          <HapticButton
            size="lg"
            onClick={uploadPhotos}
            hapticStyle="heavy"
            className="rounded-full shadow-lg h-14 px-6"
            data-testid="button-upload-photos"
          >
            <Upload className="w-5 h-5 mr-2" />
            <span data-testid="text-upload-count">{photos.length} Foto{photos.length !== 1 ? 's' : ''} hochladen</span>
          </HapticButton>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col" onClick={() => setSelectedPhoto(null)} data-testid="photo-detail-overlay">
          <div className="flex items-center justify-between p-4 text-white">
            <HapticButton
              variant="ghost"
              size="icon"
              onClick={() => setSelectedPhoto(null)}
              className="text-white hover:bg-white/20"
              data-testid="button-close-detail"
            >
              <ArrowLeft className="w-6 h-6" />
            </HapticButton>
            <span className="text-sm" data-testid="text-photo-count-detail">{photos.length} Foto{photos.length !== 1 ? 's' : ''}</span>
            <HapticButton
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                const index = photos.indexOf(selectedPhoto);
                deletePhoto(index);
              }}
              className="text-white hover:bg-white/20"
              data-testid="button-delete-photo"
            >
              <Trash2 className="w-6 h-6" />
            </HapticButton>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={selectedPhoto}
              alt="Foto Detail"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
              data-testid="img-photo-detail"
            />
          </div>
        </div>
      )}
    </div>
  );
}
