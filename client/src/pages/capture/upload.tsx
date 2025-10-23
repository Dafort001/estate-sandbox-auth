import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Loader2, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadStatus {
  fileName: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

export default function UploadScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [photos, setPhotos] = useState<string[]>([]);
  const [shootCode, setShootCode] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [allComplete, setAllComplete] = useState(false);

  useEffect(() => {
    // Load photos from sessionStorage
    const stored = sessionStorage.getItem("capturedPhotos");
    if (stored) {
      const loadedPhotos = JSON.parse(stored);
      setPhotos(loadedPhotos);
      
      // Initialize upload statuses
      setUploadStatuses(
        loadedPhotos.map((_: string, index: number) => ({
          fileName: `photo_${index + 1}.jpg`,
          status: "pending",
          progress: 0,
        }))
      );
    } else {
      // No photos, redirect to camera
      setLocation("/capture/camera");
    }

    // Generate default shoot code
    const defaultCode = generateShootCode();
    setShootCode(defaultCode);
  }, []);

  const generateShootCode = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 5);
    return `${timestamp}${random}`.toUpperCase().substring(0, 8);
  };

  const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const uploadPhotos = async () => {
    if (!shootCode.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte gib einen Shoot-Code ein.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // 1. Initialize upload session
      const initResponse = await fetch("/api/ios/upload/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ shootCode }),
      });

      if (!initResponse.ok) {
        throw new Error("Failed to initialize upload session");
      }

      // 2. Upload each photo
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const fileName = `${shootCode}_${String(i + 1).padStart(3, "0")}.jpg`;

        // Update status: uploading
        setUploadStatuses((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: "uploading", progress: 10 };
          return updated;
        });

        try {
          // Get presigned URL
          const presignedResponse = await fetch("/api/ios/upload/presigned", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              fileName,
              contentType: "image/jpeg",
            }),
          });

          if (!presignedResponse.ok) {
            throw new Error("Failed to get presigned URL");
          }

          const { uploadUrl, key } = await presignedResponse.json();

          // Progress: 30%
          setUploadStatuses((prev) => {
            const updated = [...prev];
            updated[i] = { ...updated[i], progress: 30 };
            return updated;
          });

          // Convert dataURL to Blob
          const blob = dataURLtoBlob(photo);

          // Upload to R2
          const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            body: blob,
            headers: { "Content-Type": "image/jpeg" },
          });

          if (!uploadResponse.ok) {
            throw new Error("Failed to upload to R2");
          }

          // Progress: 80%
          setUploadStatuses((prev) => {
            const updated = [...prev];
            updated[i] = { ...updated[i], progress: 80 };
            return updated;
          });

          // Confirm upload
          const confirmResponse = await fetch("/api/ios/upload/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ key, shootCode }),
          });

          if (!confirmResponse.ok) {
            throw new Error("Failed to confirm upload");
          }

          // Success!
          setUploadStatuses((prev) => {
            const updated = [...prev];
            updated[i] = { ...updated[i], status: "success", progress: 100 };
            return updated;
          });
        } catch (error) {
          console.error(`Upload error for photo ${i + 1}:`, error);
          setUploadStatuses((prev) => {
            const updated = [...prev];
            updated[i] = {
              ...updated[i],
              status: "error",
              progress: 0,
              error: error instanceof Error ? error.message : "Upload failed",
            };
            return updated;
          });
        }
      }

      // All uploads complete
      setAllComplete(true);
      
      // Clear sessionStorage
      sessionStorage.removeItem("capturedPhotos");

      toast({
        title: "Upload abgeschlossen!",
        description: `${photos.length} Foto(s) erfolgreich hochgeladen.`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload-Fehler",
        description: error instanceof Error ? error.message : "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const successCount = uploadStatuses.filter((s) => s.status === "success").length;
  const errorCount = uploadStatuses.filter((s) => s.status === "error").length;
  const totalProgress = uploadStatuses.reduce((sum, s) => sum + s.progress, 0) / uploadStatuses.length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4">
        <h1 className="text-xl font-bold">Upload</h1>
        <p className="text-sm text-muted-foreground">
          {photos.length} {photos.length === 1 ? "Foto" : "Fotos"} bereit
        </p>
      </div>

      {/* Form */}
      <div className="p-6 space-y-6">
        {/* Shoot Code Input */}
        <div className="space-y-2">
          <Label htmlFor="shoot-code">Shoot-Code</Label>
          <Input
            id="shoot-code"
            type="text"
            value={shootCode}
            onChange={(e) => setShootCode(e.target.value.toUpperCase())}
            placeholder="z.B. ABC12345"
            disabled={isUploading || allComplete}
            maxLength={8}
            data-testid="input-shoot-code"
          />
          <p className="text-xs text-muted-foreground">
            Eindeutiger Code für dieses Shooting (wird automatisch generiert)
          </p>
        </div>

        {/* Overall Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Gesamtfortschritt</span>
              <span>{Math.round(totalProgress)}%</span>
            </div>
            <Progress value={totalProgress} />
            <p className="text-xs text-muted-foreground">
              {successCount} erfolgreich • {errorCount} Fehler • {photos.length - successCount - errorCount} ausstehend
            </p>
          </div>
        )}

        {/* Upload List */}
        <div className="space-y-2">
          {uploadStatuses.map((status, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg border border-border"
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {status.status === "pending" && (
                  <div className="w-5 h-5 rounded-full border-2 border-muted" />
                )}
                {status.status === "uploading" && (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                )}
                {status.status === "success" && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {status.status === "error" && (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{status.fileName}</p>
                {status.status === "uploading" && (
                  <Progress value={status.progress} className="h-1 mt-1" />
                )}
                {status.status === "error" && (
                  <p className="text-xs text-destructive mt-1">{status.error}</p>
                )}
              </div>

              {/* Progress Percentage */}
              {status.status === "uploading" && (
                <span className="text-sm text-muted-foreground">
                  {status.progress}%
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!allComplete && (
            <Button
              className="w-full"
              onClick={uploadPhotos}
              disabled={isUploading || !shootCode.trim()}
              data-testid="button-start-upload"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird hochgeladen...
                </>
              ) : (
                `${photos.length} ${photos.length === 1 ? "Foto" : "Fotos"} hochladen`
              )}
            </Button>
          )}

          {allComplete && (
            <Button
              className="w-full"
              onClick={() => setLocation("/")}
              data-testid="button-back-home"
            >
              <Home className="w-4 h-4 mr-2" />
              Zurück zur Startseite
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setLocation("/capture/review")}
            disabled={isUploading}
            data-testid="button-back-review"
          >
            Zurück zur Galerie
          </Button>
        </div>
      </div>
    </div>
  );
}
