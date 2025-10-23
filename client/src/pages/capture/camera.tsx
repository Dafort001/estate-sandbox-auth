import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Zap, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CameraScreen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null); // Use ref for cleanup
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup: stop all tracks on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      // Stop existing stream before starting new one
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
      setCameraError("Kamera-Zugriff verweigert. Bitte erlaube den Zugriff in den Einstellungen.");
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
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Flash effect
    if (flashEnabled) {
      const flashDiv = document.getElementById("flash-effect");
      if (flashDiv) {
        flashDiv.classList.remove("opacity-0");
        flashDiv.classList.add("opacity-100");
        setTimeout(() => {
          flashDiv.classList.remove("opacity-100");
          flashDiv.classList.add("opacity-0");
        }, 100);
      }
    }

    // Convert to data URL
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    setCapturedPhotos(prev => [...prev, dataUrl]);

    toast({
      title: "Foto aufgenommen",
      description: `${capturedPhotos.length + 1} Foto(s) gespeichert`,
    });
  };

  const flipCamera = () => {
    // useEffect cleanup will handle stopping the old stream
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setLocation("/capture");
  };

  const goToReview = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    // Store photos in sessionStorage
    sessionStorage.setItem("capturedPhotos", JSON.stringify(capturedPhotos));
    setLocation("/capture/review");
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Camera Preview or Error */}
      {cameraError ? (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <Camera className="w-16 h-16 text-destructive mx-auto" />
            <p className="text-white">{cameraError}</p>
            <Button onClick={startCamera} variant="outline">
              Erneut versuchen
            </Button>
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Flash Effect */}
      <div
        id="flash-effect"
        className="absolute inset-0 bg-white opacity-0 transition-opacity duration-100 pointer-events-none"
      />

      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
        <Button
          size="icon"
          variant="ghost"
          className="bg-black/50 text-white hover:bg-black/70"
          onClick={closeCamera}
          data-testid="button-close-camera"
        >
          <X className="w-6 h-6" />
        </Button>

        <div className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
          {capturedPhotos.length} Fotos
        </div>

        <Button
          size="icon"
          variant="ghost"
          className={`${flashEnabled ? "bg-primary text-primary-foreground" : "bg-black/50 text-white"} hover:bg-black/70`}
          onClick={() => setFlashEnabled(!flashEnabled)}
          data-testid="button-toggle-flash"
        >
          <Zap className="w-6 h-6" fill={flashEnabled ? "currentColor" : "none"} />
        </Button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 flex items-center justify-center gap-12 z-10">
        {/* Gallery Preview */}
        {capturedPhotos.length > 0 && (
          <button
            onClick={goToReview}
            className="w-14 h-14 rounded-lg overflow-hidden border-2 border-white"
            data-testid="button-view-gallery"
          >
            <img
              src={capturedPhotos[capturedPhotos.length - 1]}
              alt="Last captured"
              className="w-full h-full object-cover"
            />
            {capturedPhotos.length > 1 && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {capturedPhotos.length}
              </div>
            )}
          </button>
        )}

        {/* Shutter Button */}
        <button
          onClick={capturePhoto}
          className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 hover:scale-105 active:scale-95 transition-transform"
          data-testid="button-capture-photo"
        >
          <div className="w-full h-full rounded-full bg-white border-2 border-black" />
        </button>

        {/* Flip Camera */}
        <Button
          size="icon"
          variant="ghost"
          className="bg-black/50 text-white hover:bg-black/70 w-14 h-14"
          onClick={flipCamera}
          data-testid="button-flip-camera"
        >
          <RefreshCw className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
