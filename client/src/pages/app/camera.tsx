import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { X, RotateCcw, Zap, ZapOff } from "lucide-react";
import { StatusBar } from "@/components/mobile/StatusBar";
import { HapticButton } from "@/components/mobile/HapticButton";
import { useToast } from "@/hooks/use-toast";

export default function CameraScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 4032 },
          height: { ideal: 3024 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Camera access error:", error);
      setCameraError("Kamera-Zugriff verweigert");
      toast({
        title: "Kamera-Fehler",
        description: "Zugriff auf die Kamera wurde verweigert.",
        variant: "destructive",
      });
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    const photoData = canvas.toDataURL("image/jpeg", 0.95);

    // Store in sessionStorage
    const photos = JSON.parse(sessionStorage.getItem("appPhotos") || "[]");
    photos.push(photoData);
    sessionStorage.setItem("appPhotos", JSON.stringify(photos));

    setPhotoCount(photos.length);
    toast({
      title: "Foto aufgenommen",
      description: `${photos.length} Foto(s) gespeichert`,
    });
  };

  const flipCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setLocation("/app");
  };

  const goToGallery = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setLocation("/app/gallery");
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 text-white">
        <StatusBar />
      </div>

      {/* Camera Preview or Error */}
      {cameraError ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-white p-8">
            <p className="text-lg mb-4" data-testid="text-camera-error">{cameraError}</p>
            <HapticButton
              variant="outline"
              onClick={startCamera}
              className="text-white border-white hover:bg-white/10"
              data-testid="button-retry-camera"
            >
              Erneut versuchen
            </HapticButton>
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          data-testid="video-camera-preview"
        />
      )}

      {/* Top Controls */}
      <div className="absolute top-16 left-0 right-0 z-40 flex items-center justify-between px-6">
        <HapticButton
          size="icon"
          variant="ghost"
          onClick={closeCamera}
          className="text-white hover:bg-white/20 rounded-full w-12 h-12"
          data-testid="button-close-camera"
        >
          <X className="w-6 h-6" />
        </HapticButton>

        <HapticButton
          size="icon"
          variant="ghost"
          onClick={flipCamera}
          className="text-white hover:bg-white/20 rounded-full w-12 h-12"
          data-testid="button-flip-camera"
        >
          <RotateCcw className="w-6 h-6" />
        </HapticButton>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-40 pb-8 safe-area-bottom">
        <div className="flex items-center justify-center gap-8 px-6">
          {/* Flash Toggle */}
          <HapticButton
            size="icon"
            variant="ghost"
            onClick={() => setFlashEnabled(!flashEnabled)}
            className="text-white hover:bg-white/20 rounded-full w-12 h-12"
            data-testid="button-toggle-flash"
          >
            {flashEnabled ? (
              <Zap className="w-6 h-6 fill-yellow-400 text-yellow-400" />
            ) : (
              <ZapOff className="w-6 h-6" />
            )}
          </HapticButton>

          {/* Capture Button */}
          <HapticButton
            size="icon"
            onClick={capturePhoto}
            hapticStyle="heavy"
            className="w-20 h-20 rounded-full border-4 border-white bg-white/20 hover:bg-white/30 active:scale-90"
            data-testid="button-capture-photo"
          >
            <div className="w-16 h-16 rounded-full bg-white" />
          </HapticButton>

          {/* Gallery Button (with count) */}
          <HapticButton
            size="icon"
            variant="ghost"
            onClick={goToGallery}
            className="relative text-white hover:bg-white/20 rounded-full w-12 h-12"
            data-testid="button-goto-gallery"
          >
            <div className="w-10 h-10 rounded-lg border-2 border-white flex items-center justify-center">
              {photoCount > 0 && (
                <span className="text-sm font-bold" data-testid="text-photo-count">{photoCount}</span>
              )}
            </div>
          </HapticButton>
        </div>
      </div>
    </div>
  );
}
