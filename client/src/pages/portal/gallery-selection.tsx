import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Check, Download, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SEOHead } from "@/components/SEOHead";

type Image = {
  id: string;
  originalFilename: string;
  previewPath?: string;
  filePath: string;
};

export default function GallerySelection() {
  const { jobId } = useParams<{ jobId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  const { data: images, isLoading, isError } = useQuery<Image[]>({
    queryKey: ["/api/jobs", jobId, "images"],
    enabled: !!jobId,
  });

  const selectMutation = useMutation({
    mutationFn: async (imageIds: string[]) => {
      const response = await apiRequest("POST", `/api/jobs/${jobId}/select-images`, { imageIds });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Auswahl gespeichert",
        description: `${selectedImages.size} Bilder ausgewählt`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId] });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Auswahl konnte nicht gespeichert werden",
        variant: "destructive",
      });
    },
  });

  const toggleImage = (imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const handleSaveSelection = () => {
    selectMutation.mutate(Array.from(selectedImages));
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Bildauswahl - pix.immo"
        description="Wählen Sie die Bilder für die Bearbeitung aus"
      />

      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/portal/uploads")}
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Bildauswahl</h1>
                <p className="text-sm text-muted-foreground" data-testid="text-selected-count">
                  {selectedImages.size} von {images?.length || 0} ausgewählt
                </p>
              </div>
            </div>
            <Button
              onClick={handleSaveSelection}
              disabled={selectedImages.size === 0 || selectMutation.isPending}
              data-testid="button-save-selection"
            >
              <Check className="w-4 h-4 mr-2" />
              Auswahl speichern
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <h3 className="text-xl font-semibold mb-2 text-destructive" data-testid="text-error-title">
                Fehler beim Laden
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-6" data-testid="text-error-description">
                Die Bilder konnten nicht geladen werden. Bitte versuchen Sie es erneut.
              </p>
              <Button onClick={() => setLocation("/portal/uploads")} data-testid="button-back-to-uploads">
                Zurück zur Übersicht
              </Button>
            </CardContent>
          </Card>
        ) : !images || images.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <h3 className="text-xl font-semibold mb-2" data-testid="text-no-images">
                Keine Bilder gefunden
              </h3>
              <p className="text-muted-foreground">
                Für diesen Auftrag wurden noch keine Bilder hochgeladen.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative group cursor-pointer"
                onClick={() => toggleImage(image.id)}
                data-testid={`image-${image.id}`}
              >
                <div className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImages.has(image.id)
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent hover:border-muted-foreground/20"
                }`}>
                  <img
                    src={image.previewPath || image.filePath}
                    alt={image.originalFilename}
                    className="w-full h-full object-cover"
                  />
                </div>
                {selectedImages.has(image.id) && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1.5">
                    <Check className="w-4 h-4" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {image.originalFilename}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
