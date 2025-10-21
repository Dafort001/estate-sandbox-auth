import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Home, Download, X, ChevronLeft, ChevronRight, Image as ImageIcon, Heart, MessageCircle, Send, Package } from "lucide-react";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";

type EditedImage = {
  id: string;
  shootId: string;
  filename: string;
  filePath: string;
  fileSize: number | null;
  version: number;
  roomType: string | null;
  sequenceIndex: number | null;
  clientApprovalStatus: string;
  aiCaption: string | null;
  createdAt: number;
  approvedAt: number | null;
};

type Shoot = {
  id: string;
  shootCode: string;
  jobId: string;
  status: string;
  createdAt: number;
  images: EditedImage[];
};

type Job = {
  id: string;
  jobNumber: string;
  userId: string;
  propertyName: string;
  propertyAddress: string | null;
  status: string;
  createdAt: number;
  shoots: Shoot[];
};

type GalleryData = {
  jobs: Job[];
};

type Comment = {
  id: string;
  comment: string;
  altText: string | null;
  createdAt: number;
  userId: string;
  userEmail: string;
};

export default function Galerie() {
  const [, setLocation] = useLocation();
  const [selectedImage, setSelectedImage] = useState<EditedImage | null>(null);
  const [lightboxImages, setLightboxImages] = useState<EditedImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [newAltText, setNewAltText] = useState("");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const { toast } = useToast();

  const { data: galleryData, isLoading } = useQuery<GalleryData>({
    queryKey: ["/api/client/gallery"],
    queryFn: getQueryFn<GalleryData>({ on401: "returnNull" }),
  });

  const { data: favoritesData } = useQuery<{ favorites: string[] }>({
    queryKey: ["/api/favorites"],
    queryFn: getQueryFn<{ favorites: string[] }>({ on401: "returnNull" }),
  });

  const { data: commentsData } = useQuery<{ comments: Comment[] }>({
    queryKey: ["/api/image", selectedImage?.id, "comments"],
    queryFn: getQueryFn<{ comments: Comment[] }>({ on401: "returnNull" }),
    enabled: !!selectedImage,
  });

  const favorites = favoritesData?.favorites || [];

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      return await apiRequest("POST", `/api/image/${imageId}/favorite`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: "Favorit aktualisiert",
        description: "Ihre Auswahl wurde gespeichert.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Favorit konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ imageId, comment, altText }: { imageId: string; comment: string; altText?: string }) => {
      return await apiRequest("POST", `/api/image/${imageId}/comment`, { comment, altText });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/image", variables.imageId, "comments"] });
      setNewComment("");
      setNewAltText("");
      toast({
        title: "Kommentar hinzugefügt",
        description: "Ihr Kommentar wurde gespeichert.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Kommentar konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!galleryData && !isLoading) {
      setLocation("/login");
    }
  }, [galleryData, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md">
          <div className="flex items-center justify-between px-[5vw] py-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </header>
        <div className="container mx-auto px-6 py-12">
          <Skeleton className="mb-8 h-12 w-64" />
          <div className="space-y-8">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!galleryData) {
    return null;
  }

  const jobs = galleryData.jobs || [];

  // Filter images based on favorites filter
  const filteredJobs = showOnlyFavorites
    ? jobs.map(job => ({
        ...job,
        shoots: job.shoots.map(shoot => ({
          ...shoot,
          images: shoot.images.filter(img => favorites.includes(img.id)),
        })).filter(shoot => shoot.images.length > 0),
      })).filter(job => job.shoots.length > 0)
    : jobs;

  const totalFavorites = jobs.reduce((acc, job) => 
    acc + job.shoots.reduce((shootAcc, shoot) => 
      shootAcc + shoot.images.filter(img => favorites.includes(img.id)).length, 0), 0);

  const openLightbox = (image: EditedImage, allImages: EditedImage[]) => {
    setLightboxImages(allImages);
    setCurrentImageIndex(allImages.findIndex(img => img.id === image.id));
    setSelectedImage(image);
  };

  const handleToggleFavorite = (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation();
    toggleFavoriteMutation.mutate(imageId);
  };

  const handleAddComment = () => {
    if (newComment.trim() && selectedImage) {
      addCommentMutation.mutate({
        imageId: selectedImage.id,
        comment: newComment.trim(),
        altText: newAltText.trim() || undefined,
      });
    }
  };

  const handleDownloadAllFavorites = () => {
    if (totalFavorites > 0) {
      window.open("/api/download/favorites", "_blank");
    }
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    setLightboxImages([]);
    setCurrentImageIndex(0);
  };

  const goToPrevious = () => {
    if (lightboxImages.length > 0) {
      const newIndex = (currentImageIndex - 1 + lightboxImages.length) % lightboxImages.length;
      setCurrentImageIndex(newIndex);
      setSelectedImage(lightboxImages[newIndex]);
    }
  };

  const goToNext = () => {
    if (lightboxImages.length > 0) {
      const newIndex = (currentImageIndex + 1) % lightboxImages.length;
      setCurrentImageIndex(newIndex);
      setSelectedImage(lightboxImages[newIndex]);
    }
  };

  const handleDownload = (image: EditedImage) => {
    // Download image
    window.open(`/api/download/image/${image.id}`, '_blank');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRoomTypeLabel = (roomType: string | null) => {
    if (!roomType) return "Allgemein";
    
    const labels: Record<string, string> = {
      living_room: "Wohnzimmer",
      bedroom: "Schlafzimmer",
      kitchen: "Küche",
      bathroom: "Badezimmer",
      exterior: "Außenansicht",
      balcony: "Balkon",
      undefined_space: "Weitere Räume",
    };
    
    return labels[roomType] || roomType;
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <SEOHead
        title="Galerie"
        description="Ihre persönliche Bildergalerie. Sehen Sie alle freigegebenen Bilder, markieren Sie Favoriten und geben Sie Feedback."
        path="/galerie"
      />
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-[5vw] py-4">
          <Link href="/">
            <div className="text-base font-semibold tracking-wide cursor-pointer" data-testid="brand-logo">
              PIX.IMMO
            </div>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" data-testid="button-dashboard">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="mb-2 text-3xl font-bold" data-testid="heading-gallery">
                Ihre Galerie
              </h1>
              <p className="text-muted-foreground">
                Alle freigegebenen Bilder Ihrer Projekte
              </p>
            </div>
            {totalFavorites > 0 && (
              <div className="flex gap-2">
                <Button
                  variant={showOnlyFavorites ? "default" : "outline"}
                  onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                  data-testid="button-filter-favorites"
                >
                  <Heart className={`mr-2 h-4 w-4 ${showOnlyFavorites ? "fill-current" : ""}`} />
                  Nur Favoriten ({totalFavorites})
                </Button>
                <Button
                  variant="default"
                  onClick={handleDownloadAllFavorites}
                  data-testid="button-download-all-favorites"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Alle Favoriten herunterladen
                </Button>
              </div>
            )}
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {showOnlyFavorites ? "Keine Favoriten" : "Noch keine Bilder"}
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                {showOnlyFavorites
                  ? "Markieren Sie Bilder als Favoriten, um sie hier zu sehen."
                  : "Sobald Ihre Projekte fotografiert und bearbeitet wurden, erscheinen die Bilder hier."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {filteredJobs.map((job) => (
              <Card key={job.id} data-testid={`job-${job.jobNumber}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{job.propertyName}</CardTitle>
                      <CardDescription>
                        {job.propertyAddress && <span>{job.propertyAddress} • </span>}
                        Job {job.jobNumber} • {formatDate(job.createdAt)}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" data-testid={`badge-${job.jobNumber}`}>
                      {job.shoots.reduce((acc, shoot) => acc + shoot.images.length, 0)} Bilder
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {job.shoots.map((shoot) => {
                    const allImages = shoot.images;
                    
                    return (
                      <div key={shoot.id} data-testid={`shoot-${shoot.shootCode}`}>
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Fotoshooting {shoot.shootCode} • {allImages.length} Bilder
                          </h3>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {allImages.map((image) => {
                            const isFavorited = favorites.includes(image.id);
                            return (
                              <div
                                key={image.id}
                                className="group relative aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer hover-elevate active-elevate-2"
                                onClick={() => openLightbox(image, allImages)}
                                data-testid={`image-${image.filename}`}
                              >
                                <img
                                  src={`/api/image/${image.id}`}
                                  alt={image.aiCaption || image.filename}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ImageIcon className="h-8 w-8 text-white" />
                                  </div>
                                </div>
                                
                                {/* Favorite button */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                                  onClick={(e) => handleToggleFavorite(e, image.id)}
                                  data-testid={`button-favorite-${image.id}`}
                                >
                                  <Heart className={`h-4 w-4 ${isFavorited ? "fill-current text-red-500" : ""}`} />
                                </Button>

                                {image.roomType && (
                                  <div className="absolute bottom-2 left-2 right-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {getRoomTypeLabel(image.roomType)}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={selectedImage !== null} onOpenChange={(open) => !open && closeLightbox()}>
        <DialogContent className="max-w-screen-xl p-0 h-[90vh] flex flex-col overflow-hidden">
          <DialogTitle className="sr-only">Bilddetails</DialogTitle>
          <div className="flex flex-1 overflow-hidden">
            {/* Image Section */}
            <div className="relative bg-black flex-1 flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
                onClick={closeLightbox}
                data-testid="button-close-lightbox"
              >
                <X className="h-4 w-4" />
              </Button>

              {lightboxImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                    onClick={goToPrevious}
                    data-testid="button-previous-image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                    onClick={goToNext}
                    data-testid="button-next-image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}

              {selectedImage && (
                <div className="relative w-full h-full flex flex-col">
                  <img
                    src={`/api/image/${selectedImage.id}`}
                    alt={selectedImage.aiCaption || selectedImage.filename}
                    className="w-full h-full object-contain"
                    data-testid="lightbox-image"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        {selectedImage.roomType && (
                          <p className="text-sm font-medium mb-1">
                            {getRoomTypeLabel(selectedImage.roomType)}
                          </p>
                        )}
                        {selectedImage.aiCaption && (
                          <p className="text-sm text-white/80">{selectedImage.aiCaption}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="bg-black/50 hover:bg-black/70 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteMutation.mutate(selectedImage.id);
                          }}
                          data-testid="button-favorite-lightbox"
                        >
                          <Heart className={`mr-2 h-4 w-4 ${favorites.includes(selectedImage.id) ? "fill-current text-red-500" : ""}`} />
                          Favorit
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDownload(selectedImage)}
                          data-testid="button-download-image"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Herunterladen
                        </Button>
                      </div>
                    </div>
                    {lightboxImages.length > 1 && (
                      <p className="text-xs text-white/60 mt-2">
                        Bild {currentImageIndex + 1} von {lightboxImages.length}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Comments Sidebar */}
            <div className="w-96 bg-white flex flex-col overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Kommentare
                </h3>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {commentsData?.comments && commentsData.comments.length > 0 ? (
                  commentsData.comments.map((comment) => (
                    <div key={comment.id} className="space-y-1" data-testid={`comment-${comment.id}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{comment.userEmail}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString("de-DE", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.comment}</p>
                      {comment.altText && (
                        <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                          <p className="font-medium text-muted-foreground mb-1">Alt-Text:</p>
                          <p className="text-muted-foreground">{comment.altText}</p>
                        </div>
                      )}
                      <Separator className="mt-2" />
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Noch keine Kommentare
                    </p>
                  </div>
                )}
              </div>

              {/* Add Comment */}
              <div className="p-4 border-t">
                <div className="space-y-2">
                  <div>
                    <label htmlFor="alt-text-input" className="text-xs text-muted-foreground mb-1 block">
                      Alt-Text (.txt)
                    </label>
                    <Textarea
                      id="alt-text-input"
                      placeholder="Alt-Text für SEO und Barrierefreiheit..."
                      value={newAltText}
                      onChange={(e) => setNewAltText(e.target.value)}
                      className="resize-none"
                      rows={2}
                      data-testid="input-alt-text"
                    />
                  </div>
                  <Textarea
                    placeholder="Kommentar hinzufügen..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="resize-none"
                    rows={3}
                    data-testid="input-comment"
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                    className="w-full"
                    data-testid="button-add-comment"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {addCommentMutation.isPending ? "Wird gesendet..." : "Kommentar senden"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
