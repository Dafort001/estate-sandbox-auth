import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, XCircle, Upload as UploadIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HapticButton } from "@/components/mobile/HapticButton";
import { StatusBar } from "@/components/mobile/StatusBar";
import { BottomNav } from "@/components/mobile/BottomNav";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function UploadScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [redirectCountdown, setRedirectCountdown] = useState(0);

  useEffect(() => {
    const storedPhotos = JSON.parse(sessionStorage.getItem("appPhotos") || "[]");
    setPhotos(storedPhotos);
  }, []);

  const startUpload = async () => {
    if (photos.length === 0) {
      toast({
        title: "Keine Fotos",
        description: "Keine Fotos zum Hochladen vorhanden",
        variant: "destructive",
      });
      return;
    }

    setUploadStatus("uploading");
    setProgress(0);
    setUploadedCount(0);

    try {
      // Simulate upload progress
      for (let i = 0; i < photos.length; i++) {
        // In production: upload to backend API
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setUploadedCount(i + 1);
        setProgress(((i + 1) / photos.length) * 100);
      }

      setUploadStatus("success");
      toast({
        title: "Upload erfolgreich",
        description: `${photos.length} Foto(s) hochgeladen`,
      });

      // Clear photos after successful upload with countdown
      setRedirectCountdown(3);
      const interval = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            sessionStorage.removeItem("appPhotos");
            setLocation("/app");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      toast({
        title: "Upload fehlgeschlagen",
        description: "Bitte versuche es erneut",
        variant: "destructive",
      });
    }
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
          onClick={() => setLocation("/app/gallery")}
          disabled={uploadStatus === "uploading"}
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </HapticButton>
        <h1 className="text-lg font-semibold">Upload</h1>
        <div className="w-10" />
      </div>

      {/* Upload Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 pb-24">
        {uploadStatus === "idle" && (
          <div className="text-center space-y-6 w-full max-w-md">
            <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <UploadIcon className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2" data-testid="text-upload-title">Bereit zum Hochladen</h2>
              <p className="text-muted-foreground" data-testid="text-upload-description">
                {photos.length} Foto{photos.length !== 1 ? 's' : ''} werden hochgeladen
              </p>
            </div>
            <HapticButton
              size="lg"
              onClick={startUpload}
              hapticStyle="heavy"
              className="w-full h-14"
              data-testid="button-start-upload"
            >
              <UploadIcon className="w-5 h-5 mr-2" />
              Jetzt hochladen
            </HapticButton>
          </div>
        )}

        {uploadStatus === "uploading" && (
          <div className="text-center space-y-6 w-full max-w-md">
            <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <UploadIcon className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2" data-testid="text-uploading-title">Upload läuft...</h2>
              <p className="text-muted-foreground mb-4" data-testid="text-uploading-progress">
                {uploadedCount} von {photos.length} Foto{photos.length !== 1 ? 's' : ''}
              </p>
              <Progress value={progress} className="h-2" data-testid="progress-upload" />
              <p className="text-sm text-muted-foreground mt-2" data-testid="text-upload-percentage">{Math.round(progress)}%</p>
            </div>
          </div>
        )}

        {uploadStatus === "success" && (
          <div className="text-center space-y-6 w-full max-w-md">
            <div className="w-24 h-24 mx-auto rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2" data-testid="text-success-title">Upload erfolgreich!</h2>
              <p className="text-muted-foreground" data-testid="text-success-description">
                {photos.length} Foto{photos.length !== 1 ? 's' : ''} hochgeladen
              </p>
              {redirectCountdown > 0 && (
                <p className="text-sm text-muted-foreground mt-4" data-testid="text-redirect-countdown">
                  Weiterleitung in {redirectCountdown}s...
                </p>
              )}
            </div>
          </div>
        )}

        {uploadStatus === "error" && (
          <div className="text-center space-y-6 w-full max-w-md">
            <div className="w-24 h-24 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-destructive" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2" data-testid="text-error-title">Upload fehlgeschlagen</h2>
              <p className="text-muted-foreground mb-6" data-testid="text-error-description">
                Bitte überprüfe deine Internetverbindung
              </p>
              <Button
                onClick={startUpload}
                variant="outline"
                className="w-full"
                data-testid="button-retry-upload"
              >
                Erneut versuchen
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
