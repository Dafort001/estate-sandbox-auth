import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Check, 
  Loader2, 
  Keyboard, 
  Image as ImageIcon,
  Grid3x3,
  CheckSquare,
  XSquare,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";

interface RoomType {
  id: string;
  label: string;
  category: string;
  description: string;
  examples: string[];
}

interface RoomTypeData {
  roomTypes: string[];
  byCategory: Record<string, string[]>;
  withMeta: RoomType[];
  shortcuts: Record<string, string>;
  categories: Array<{ id: string; label: string; description: string }>;
}

interface Image {
  id: string;
  originalFilename: string;
  roomType: string | null;
  classifiedAt: number | null;
  stackId: string | null;
}

interface Shoot {
  id: string;
  jobId: string;
  capturedAt: number;
  shootCode: string;
}

export default function GalleryClassify() {
  const params = useParams();
  const shootId = params.shootId;
  const { toast } = useToast();
  
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);

  // Fetch room types taxonomy
  const { data: roomTypesData } = useQuery<RoomTypeData>({
    queryKey: ["/api/roomtypes"],
  });

  // Fetch shoot details
  const { data: shoot, isLoading: shootLoading } = useQuery<Shoot>({
    queryKey: [`/api/shoots/${shootId}`],
    enabled: !!shootId,
  });

  // Fetch images for this shoot
  const { data: images, isLoading: imagesLoading } = useQuery<Image[]>({
    queryKey: [`/api/shoots/${shootId}/images`],
    enabled: !!shootId,
  });

  // Single image classification mutation
  const classifyMutation = useMutation({
    mutationFn: async ({ imageId, roomType }: { imageId: string; roomType: string }) => {
      return apiRequest("PATCH", `/api/images/${imageId}/classify`, { roomType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/shoots/${shootId}/images`] });
    },
  });

  // Bulk classification mutation
  const bulkClassifyMutation = useMutation({
    mutationFn: async ({ imageIds, roomType }: { imageIds: string[]; roomType: string }) => {
      const response = await apiRequest("PATCH", `/api/images/classify/bulk`, { imageIds, roomType });
      return response.json();
    },
    onSuccess: (data: { success: boolean; count: number }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/shoots/${shootId}/images`] });
      toast({
        title: "Erfolgreich klassifiziert",
        description: `${data.count} Bilder wurden klassifiziert.`,
      });
      setSelectedImages(new Set());
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Klassifizierung fehlgeschlagen.",
        variant: "destructive",
      });
    },
  });

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!roomTypesData || !hoveredImage) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Check if key is in shortcuts
      const roomTypeId = roomTypesData.shortcuts[e.key];
      
      if (roomTypeId && hoveredImage) {
        e.preventDefault();
        classifyMutation.mutate({ imageId: hoveredImage, roomType: roomTypeId });
        toast({
          title: "Klassifiziert",
          description: `Bild als ${roomTypesData.withMeta.find(r => r.id === roomTypeId)?.label} klassifiziert.`,
        });
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [roomTypesData, hoveredImage, classifyMutation, toast]);

  const handleToggleSelect = (imageId: string) => {
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

  const handleSelectAll = () => {
    if (!images) return;
    setSelectedImages(new Set(images.map(img => img.id)));
  };

  const handleDeselectAll = () => {
    setSelectedImages(new Set());
  };

  const handleBulkClassify = (roomType: string) => {
    if (selectedImages.size === 0) {
      toast({
        title: "Keine Auswahl",
        description: "Bitte wählen Sie zuerst Bilder aus.",
        variant: "destructive",
      });
      return;
    }
    
    bulkClassifyMutation.mutate({
      imageIds: Array.from(selectedImages),
      roomType,
    });
  };

  if (shootLoading || imagesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Lade Bilder...</p>
        </div>
      </div>
    );
  }

  if (!shoot || !images || !roomTypesData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Fehler beim Laden der Daten</p>
        </div>
      </div>
    );
  }

  const classifiedCount = images.filter(img => img.roomType !== null).length;
  const totalCount = images.length;
  const progressPercent = totalCount > 0 ? (classifiedCount / totalCount) * 100 : 0;

  return (
    <>
      <SEOHead
        title={`Bilder klassifizieren - Shoot ${shoot.shootCode} | pix.immo`}
        description="Klassifizieren Sie RAW-Bilder nach Raumtypen mit Keyboard-Shortcuts und Bulk-Operationen."
      />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Bilder klassifizieren
                </h1>
                <p className="text-sm text-muted-foreground">
                  Shoot <code className="font-mono bg-muted px-2 py-0.5 rounded text-xs">{shoot.shootCode}</code>
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium" data-testid="text-classification-progress">
                    {classifiedCount} / {totalCount} klassifiziert
                  </div>
                  <Progress value={progressPercent} className="w-32 h-2" data-testid="progress-classification" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedImages.size > 0 && (
          <div className="border-b bg-muted/50">
            <div className="max-w-7xl mx-auto px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" data-testid="badge-selected-count">
                    {selectedImages.size} ausgewählt
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeselectAll}
                    data-testid="button-deselect-all"
                  >
                    <XSquare className="h-4 w-4 mr-2" />
                    Auswahl aufheben
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground mr-2" data-testid="text-bulk-classify-label">
                    Klassifizieren als:
                  </span>
                  {Object.entries(roomTypesData.shortcuts)
                    .slice(0, 10)
                    .map(([key, roomId]) => {
                      const room = roomTypesData.withMeta.find(r => r.id === roomId);
                      if (!room) return null;
                      
                      return (
                        <Button
                          key={key}
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkClassify(roomId)}
                          disabled={bulkClassifyMutation.isPending}
                          data-testid={`button-bulk-classify-${roomId}`}
                        >
                          <kbd className="mr-2 text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                            {key}
                          </kbd>
                          {room.label}
                        </Button>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Reference */}
        <div className="border-b bg-card/50">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Keyboard className="h-4 w-4" />
              <span className="font-medium" data-testid="text-keyboard-shortcuts-label">Tastatur-Shortcuts:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(roomTypesData.shortcuts)
                  .slice(0, 10)
                  .map(([key, roomId]) => {
                    const room = roomTypesData.withMeta.find(r => r.id === roomId);
                    if (!room) return null;
                    
                    return (
                      <Badge key={key} variant="outline" className="text-xs" data-testid={`badge-shortcut-${key}`}>
                        <kbd className="font-mono">{key}</kbd> = {room.label}
                      </Badge>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* Image Grid */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grid3x3 className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold" data-testid="text-images-header">
                Bilder ({totalCount})
              </h2>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                data-testid="button-select-all"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Alle auswählen
              </Button>
            </div>
          </div>

          {images.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground" data-testid="text-no-images">
                  Keine Bilder in diesem Shoot
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {images.map((image) => {
                const isSelected = selectedImages.has(image.id);
                const isClassified = image.roomType !== null;
                const roomType = isClassified 
                  ? roomTypesData.withMeta.find(r => r.id === image.roomType)
                  : null;
                
                return (
                  <Card
                    key={image.id}
                    className={`relative overflow-hidden cursor-pointer transition-all ${
                      isSelected ? "ring-2 ring-primary" : ""
                    } hover-elevate`}
                    onMouseEnter={() => setHoveredImage(image.id)}
                    onMouseLeave={() => setHoveredImage(null)}
                    onClick={() => handleToggleSelect(image.id)}
                    data-testid={`toggle-image-${image.id}`}
                  >
                    <CardHeader className="p-3 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleSelect(image.id)}
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`checkbox-image-${image.id}`}
                        />
                        
                        {isClassified && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs"
                            data-testid={`badge-room-type-${image.id}`}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            {roomType?.label || image.roomType}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-3 pt-0">
                      <div className="aspect-video bg-muted rounded-md flex items-center justify-center mb-2">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" data-testid={`icon-image-${image.id}`} />
                      </div>
                      
                      <p 
                        className="text-xs text-muted-foreground font-mono truncate"
                        data-testid={`text-filename-${image.id}`}
                      >
                        {image.originalFilename}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
