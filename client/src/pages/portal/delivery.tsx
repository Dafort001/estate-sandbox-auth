import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Download, CheckCircle, FileArchive, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";

type DeliveryPackage = {
  id: string;
  type: "gallery" | "captions" | "expose";
  name: string;
  description: string;
  fileCount: number;
  fileSize: number;
  downloadUrl: string;
  available: boolean;
};

export default function Delivery() {
  const { jobId } = useParams<{ jobId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data: packages, isLoading, isError } = useQuery<DeliveryPackage[]>({
    queryKey: ["/api/jobs", jobId, "delivery"],
    enabled: !!jobId,
    // Mock data für Demo
    queryFn: async () => [
      {
        id: "gallery",
        type: "gallery",
        name: "Fertige Bilder",
        description: "Professionell bearbeitete Immobilienfotos",
        fileCount: 25,
        fileSize: 128.5,
        downloadUrl: `/api/jobs/${jobId}/download/gallery.zip`,
        available: true,
      },
      {
        id: "captions",
        type: "captions",
        name: "AI Captions",
        description: "Bildunterschriften für SEO",
        fileCount: 1,
        fileSize: 0.05,
        downloadUrl: `/api/jobs/${jobId}/download/captions.txt`,
        available: true,
      },
      {
        id: "expose",
        type: "expose",
        name: "Exposé",
        description: "Automatisch generiertes Exposé",
        fileCount: 1,
        fileSize: 2.4,
        downloadUrl: `/api/jobs/${jobId}/download/expose.pdf`,
        available: false,
      },
    ],
  });

  const handleDownload = async (pkg: DeliveryPackage) => {
    if (!pkg.available) {
      toast({
        title: "Nicht verfügbar",
        description: "Dieses Paket ist noch nicht fertiggestellt",
        variant: "destructive",
      });
      return;
    }

    setDownloading(pkg.id);
    
    try {
      // In production würde hier der tatsächliche Download starten
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Download gestartet",
        description: `${pkg.name} wird heruntergeladen`,
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Download fehlgeschlagen",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  const formatFileSize = (mb: number) => {
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(mb * 1024).toFixed(0)} KB`;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Download - pix.immo"
        description="Laden Sie Ihre fertigen Bilder herunter"
      />

      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
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
              <h1 className="text-2xl font-bold">Download</h1>
              <p className="text-sm text-muted-foreground">
                Ihre fertigen Bilder sind bereit
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {isLoading ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <h3 className="text-xl font-semibold mb-2 text-destructive" data-testid="text-error-title">
                Fehler beim Laden
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-6" data-testid="text-error-description">
                Die Download-Pakete konnten nicht geladen werden. Bitte versuchen Sie es erneut.
              </p>
              <Button onClick={() => setLocation("/portal/uploads")} data-testid="button-back-to-uploads">
                Zurück zur Übersicht
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Success Message */}
            <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold" data-testid="text-success-title">
                  Auftrag abgeschlossen
                </h3>
                <p className="text-sm text-muted-foreground">
                  Alle Bilder wurden erfolgreich bearbeitet und stehen zum Download bereit
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Download Packages */}
          <div className="space-y-4">
            {packages?.map((pkg) => (
              <Card
                key={pkg.id}
                className={!pkg.available ? "opacity-60" : ""}
                data-testid={`package-${pkg.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {pkg.type === "gallery" && <ImageIcon className="w-5 h-5" />}
                        {pkg.type === "captions" && <FileArchive className="w-5 h-5" />}
                        {pkg.type === "expose" && <FileArchive className="w-5 h-5" />}
                        <span data-testid={`package-name-${pkg.id}`}>{pkg.name}</span>
                      </CardTitle>
                      <CardDescription data-testid={`package-description-${pkg.id}`}>
                        {pkg.description}
                      </CardDescription>
                    </div>
                    {pkg.available ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                        Verfügbar
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        In Arbeit
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      <span data-testid={`package-filecount-${pkg.id}`}>{pkg.fileCount} Datei{pkg.fileCount !== 1 ? 'en' : ''}</span>
                      {" · "}
                      <span data-testid={`package-filesize-${pkg.id}`}>{formatFileSize(pkg.fileSize)}</span>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleDownload(pkg)}
                    disabled={!pkg.available || downloading === pkg.id}
                    data-testid={`button-download-${pkg.id}`}
                  >
                    {downloading === pkg.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Wird geladen...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Herunterladen
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
