import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Trash2, X, Upload, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ReviewScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    // Load photos from sessionStorage
    const stored = sessionStorage.getItem("capturedPhotos");
    if (stored) {
      setPhotos(JSON.parse(stored));
    } else {
      // No photos, redirect back to camera
      setLocation("/capture/camera");
    }
  }, []);

  const deletePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    sessionStorage.setItem("capturedPhotos", JSON.stringify(newPhotos));
    setSelectedIndex(null);

    toast({
      title: "Foto gelöscht",
      description: `${newPhotos.length} Foto(s) verbleibend`,
    });

    if (newPhotos.length === 0) {
      setLocation("/capture/camera");
    }
  };

  const proceedToUpload = () => {
    if (photos.length === 0) {
      toast({
        title: "Keine Fotos",
        description: "Bitte nehmen Sie mindestens ein Foto auf.",
        variant: "destructive",
      });
      return;
    }
    setLocation("/capture/upload");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4 flex items-center justify-between">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setLocation("/capture/camera")}
          data-testid="button-back-camera"
        >
          <X className="w-5 h-5" />
        </Button>

        <h1 className="text-lg font-semibold">
          {photos.length} {photos.length === 1 ? "Foto" : "Fotos"}
        </h1>

        <Button
          onClick={proceedToUpload}
          disabled={photos.length === 0}
          data-testid="button-proceed-upload"
        >
          <Upload className="w-4 h-4 mr-2" />
          Weiter
        </Button>
      </div>

      {/* Gallery Grid */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="relative aspect-square group cursor-pointer"
              onClick={() => setSelectedIndex(index)}
            >
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
              
              {/* Delete Button */}
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  deletePhoto(index);
                }}
                data-testid={`button-delete-photo-${index}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>

              {/* Photo Number */}
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {photos.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Camera className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Keine Fotos vorhanden</p>
            <Button onClick={() => setLocation("/capture/camera")}>
              <Camera className="w-4 h-4 mr-2" />
              Kamera öffnen
            </Button>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedIndex(null)}
        >
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 text-white"
            onClick={() => setSelectedIndex(null)}
            data-testid="button-close-lightbox"
          >
            <X className="w-6 h-6" />
          </Button>

          <img
            src={photos[selectedIndex]}
            alt={`Photo ${selectedIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <Button
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                deletePhoto(selectedIndex);
              }}
              data-testid="button-delete-current"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Löschen
            </Button>
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 bg-background border-t border-border p-4 flex gap-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setLocation("/capture/camera")}
          data-testid="button-take-more"
        >
          <Camera className="w-4 h-4 mr-2" />
          Mehr aufnehmen
        </Button>
        <Button
          className="flex-1"
          onClick={proceedToUpload}
          disabled={photos.length === 0}
          data-testid="button-upload-photos"
        >
          <Upload className="w-4 h-4 mr-2" />
          Hochladen ({photos.length})
        </Button>
      </div>
    </div>
  );
}
