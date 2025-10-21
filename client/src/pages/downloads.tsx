import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Home, Download, Package, FileArchive, Image as ImageIcon, CheckCircle } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";
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

export default function Downloads() {
  const [, setLocation] = useLocation();
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { data: galleryData, isLoading } = useQuery<GalleryData>({
    queryKey: ["/api/client/gallery"],
    queryFn: getQueryFn<GalleryData>({ on401: "returnNull" }),
  });

  useEffect(() => {
    if (!galleryData && !isLoading) {
      setLocation("/login");
    }
  }, [galleryData, isLoading, setLocation]);

  const handleDownloadImage = (image: EditedImage) => {
    // Direct download link - backend serves static files
    const link = document.createElement('a');
    link.href = `/api/download/image/${image.id}`;
    link.download = image.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b">
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
  const completedJobs = jobs.filter(job => 
    job.status === "completed" || job.status === "delivered"
  );

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => {
      const next = new Set(prev);
      if (next.has(imageId)) {
        next.delete(imageId);
      } else {
        next.add(imageId);
      }
      return next;
    });
  };

  const toggleAllImagesForJob = (job: Job) => {
    const jobImageIds = job.shoots.flatMap(shoot => shoot.images.map(img => img.id));
    const allSelected = jobImageIds.every(id => selectedImages.has(id));

    setSelectedImages(prev => {
      const next = new Set(prev);
      if (allSelected) {
        jobImageIds.forEach(id => next.delete(id));
      } else {
        jobImageIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleDownloadSelected = () => {
    if (selectedImages.size === 0) {
      toast({
        title: "Keine Bilder ausgewählt",
        description: "Bitte wählen Sie mindestens ein Bild aus.",
        variant: "destructive",
      });
      return;
    }
    
    // Download selected images individually
    selectedImages.forEach(imageId => {
      const image = jobs
        .flatMap(job => job.shoots)
        .flatMap(shoot => shoot.images)
        .find(img => img.id === imageId);
      
      if (image) {
        handleDownloadImage(image);
      }
    });
    
    toast({
      title: "Downloads gestartet",
      description: `${selectedImages.size} ${selectedImages.size === 1 ? 'Bild wird' : 'Bilder werden'} heruntergeladen.`,
    });
    
    setSelectedImages(new Set());
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <SEOHead
        title="Downloads"
        description="Laden Sie Ihre fertigen Immobilienfotos herunter. Einzelne Bilder oder komplette Projekte als ZIP-Archiv."
        path="/galerie"
      />

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b">
        <div className="flex items-center justify-between px-[5vw] py-4">
          <div className="text-base font-semibold tracking-wide" data-testid="brand-logo">
            PIX.IMMO
          </div>
          <div className="flex items-center gap-3">
            {selectedImages.size > 0 && (
              <Button
                onClick={handleDownloadSelected}
                data-testid="button-download-selected"
              >
                <Download className="h-4 w-4 mr-2" />
                {selectedImages.size} {selectedImages.size === 1 ? "Bild" : "Bilder"} herunterladen
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setLocation("/dashboard")}
              data-testid="button-home"
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="page-title">
            Downloads
          </h1>
          <p className="text-muted-foreground" data-testid="page-description">
            Laden Sie Ihre fertigen Bilder herunter. Einzelne Auswahl oder komplette Projekte.
          </p>
        </div>

        {completedJobs.length === 0 ? (
          <Card data-testid="empty-state">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Keine abgeschlossenen Projekte</p>
              <p className="text-muted-foreground text-center max-w-md">
                Sobald Ihre Aufträge abgeschlossen sind, finden Sie hier alle Bilder zum Download.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {completedJobs.map(job => {
              const totalImages = job.shoots.reduce((acc, shoot) => acc + shoot.images.length, 0);
              const selectedCount = job.shoots
                .flatMap(shoot => shoot.images)
                .filter(img => selectedImages.has(img.id))
                .length;
              const allSelected = selectedCount === totalImages && totalImages > 0;

              return (
                <Card key={job.id} data-testid={`job-card-${job.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle data-testid={`job-title-${job.id}`}>
                            {job.propertyName}
                          </CardTitle>
                          <Badge variant="outline" data-testid={`job-status-${job.id}`}>
                            {job.status === "completed" ? "Abgeschlossen" : "Geliefert"}
                          </Badge>
                        </div>
                        <CardDescription>
                          {job.propertyAddress && <span className="block">{job.propertyAddress}</span>}
                          <span className="block mt-1">
                            Auftrag #{job.jobNumber} • {totalImages} {totalImages === 1 ? "Bild" : "Bilder"}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAllImagesForJob(job)}
                          data-testid={`button-select-all-${job.id}`}
                        >
                          <Checkbox
                            checked={allSelected}
                            className="mr-2"
                            data-testid={`checkbox-select-all-${job.id}`}
                          />
                          {allSelected ? "Alle abwählen" : "Alle auswählen"}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-6">
                      {job.shoots.map(shoot => (
                        <div key={shoot.id} data-testid={`shoot-${shoot.id}`}>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="secondary" data-testid={`shoot-code-${shoot.id}`}>
                              {shoot.shootCode}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {shoot.images.length} {shoot.images.length === 1 ? "Bild" : "Bilder"}
                            </span>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {shoot.images.map(image => (
                              <div
                                key={image.id}
                                className={`group relative rounded-lg overflow-hidden border-2 transition-all ${
                                  selectedImages.has(image.id)
                                    ? "border-primary"
                                    : "border-transparent hover:border-muted"
                                }`}
                                onClick={() => toggleImageSelection(image.id)}
                                data-testid={`image-card-${image.id}`}
                              >
                                <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                                </div>
                                
                                <div className="absolute top-2 left-2">
                                  <Checkbox
                                    checked={selectedImages.has(image.id)}
                                    className="bg-white"
                                    data-testid={`checkbox-image-${image.id}`}
                                    aria-label={`Bild ${image.filename} auswählen`}
                                  />
                                </div>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadImage(image);
                                  }}
                                  data-testid={`button-download-image-${image.id}`}
                                  aria-label={`Bild ${image.filename} herunterladen`}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>

                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                                  {selectedImages.has(image.id) && (
                                    <CheckCircle className="h-8 w-8 text-white" />
                                  )}
                                </div>

                                <div className="p-2 bg-white">
                                  <p className="text-xs font-medium truncate" data-testid={`filename-${image.id}`}>
                                    {image.filename}
                                  </p>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-muted-foreground">
                                      {formatFileSize(image.fileSize)}
                                    </span>
                                    {image.clientApprovalStatus === "approved" && (
                                      <Badge variant="outline" className="text-xs">
                                        Freigegeben
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
