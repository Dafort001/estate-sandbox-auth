import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FolderOpen, CheckCircle2, Image as ImageIcon } from "lucide-react";
import type { InitUploadResponse, Stack, Image as ImageType, RoomType } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: "living_room", label: "Wohnzimmer" },
  { value: "kitchen", label: "Küche" },
  { value: "bathroom", label: "Badezimmer" },
  { value: "bedroom", label: "Schlafzimmer" },
  { value: "dining_room", label: "Esszimmer" },
  { value: "hallway", label: "Flur" },
  { value: "office", label: "Büro" },
  { value: "exterior", label: "Außenbereich" },
  { value: "undefined_space", label: "Nicht zugeordnet" },
];

interface FileWithPreview extends File {
  preview?: string;
}

export default function Intake() {
  const { toast } = useToast();
  const [jobNumber, setJobNumber] = useState("");
  const [shootData, setShootData] = useState<InitUploadResponse | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Initialize upload session
  const initMutation = useMutation({
    mutationFn: async (jobNumber: string) => {
      const res = await apiRequest("POST", "/api/uploads/init", { jobNumber });
      return await res.json();
    },
    onSuccess: (data: InitUploadResponse) => {
      setShootData(data);
      toast({
        title: "Upload initialisiert",
        description: `Shoot-Code: ${data.shootCode}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Job-Nummer nicht gefunden",
        variant: "destructive",
      });
    },
  });

  // Get stacks for current shoot
  const { data: stacks = [] } = useQuery<Stack[]>({
    queryKey: ["/api/shoots", shootData?.shootId, "stacks"],
    enabled: !!shootData?.shootId,
  });

  // Get images for current shoot
  const { data: images = [] } = useQuery<ImageType[]>({
    queryKey: ["/api/shoots", shootData?.shootId, "images"],
    enabled: !!shootData?.shootId,
  });

  // Update room type mutation
  const updateRoomTypeMutation = useMutation({
    mutationFn: async ({ stackId, roomType }: { stackId: string; roomType: RoomType }) => {
      const res = await apiRequest("PUT", `/api/stacks/${stackId}/room-type`, { roomType });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shoots", shootData?.shootId, "stacks"] });
      toast({
        title: "Raumtyp aktualisiert",
        description: "Die Änderung wurde gespeichert.",
      });
    },
  });

  const handleInitialize = (e: React.FormEvent) => {
    e.preventDefault();
    if (jobNumber.trim()) {
      initMutation.mutate(jobNumber.trim());
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const items = Array.from(e.dataTransfer.items);
    const files: File[] = [];

    items.forEach((item) => {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file && file.type.startsWith("image/")) {
          files.push(file);
        }
      }
    });

    if (files.length > 0) {
      setUploadedFiles((prev) => [...prev, ...files]);
      toast({
        title: "Dateien hinzugefügt",
        description: `${files.length} Datei(en) ausgewählt`,
      });
    }
  }, [toast]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadedFiles((prev) => [...prev, ...files]);
      toast({
        title: "Dateien hinzugefügt",
        description: `${files.length} Datei(en) ausgewählt`,
      });
    }
  };

  // Upload files mutation
  const uploadFilesMutation = useMutation({
    mutationFn: async () => {
      if (!shootData || uploadedFiles.length === 0) {
        throw new Error("No files to upload");
      }

      const formData = new FormData();
      uploadedFiles.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("frameCount", "5"); // Default to 5-frame stacks

      const response = await fetch(`/api/shoots/${shootData.shootId}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shoots", shootData?.shootId, "stacks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shoots", shootData?.shootId, "images"] });
      setUploadedFiles([]);
      toast({
        title: "Upload erfolgreich",
        description: `${data.imageCount} Bilder in ${data.stackCount} Stack(s) hochgeladen`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload fehlgeschlagen",
        description: error.message || "Ein Fehler ist aufgetreten",
        variant: "destructive",
      });
    },
  });

  // Auto-stack files by exposure (simplified - will be enhanced with backend logic)
  const stackedFiles = uploadedFiles.reduce((acc, file, index) => {
    const stackIndex = Math.floor(index / 5);
    if (!acc[stackIndex]) {
      acc[stackIndex] = [];
    }
    acc[stackIndex].push(file);
    return acc;
  }, [] as FileWithPreview[][]);

  if (!shootData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 max-w-md">
          <Card className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-light mb-2">Photographer Intake</h1>
              <p className="text-muted-foreground">
                Geben Sie Ihre Job-Nummer ein, um zu beginnen
              </p>
            </div>

            <form onSubmit={handleInitialize} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="jobNumber">Job-Nummer</Label>
                <Input
                  id="jobNumber"
                  data-testid="input-job-number"
                  placeholder="PIX-1234567890-ABCDE"
                  value={jobNumber}
                  onChange={(e) => setJobNumber(e.target.value)}
                  disabled={initMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Format: PIX-XXXXXXXXXX-XXXXX
                </p>
              </div>

              <Button
                type="submit"
                data-testid="button-initialize"
                className="w-full"
                disabled={initMutation.isPending || !jobNumber.trim()}
              >
                {initMutation.isPending ? "Initialisiere..." : "Upload starten"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-light mb-1">Photo Upload</h1>
              <p className="text-muted-foreground">
                Job: {jobNumber} · Shoot-Code: {shootData.shootCode}
              </p>
            </div>
            <Badge variant="outline" className="h-8">
              {uploadedFiles.length} Datei(en)
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Area */}
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-lg font-medium mb-4">Dateien hochladen</h2>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  border-2 border-dashed rounded-md p-12 text-center transition-colors
                  ${isDragging ? "border-primary bg-primary/5" : "border-border"}
                `}
                data-testid="dropzone-upload"
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Dateien hierher ziehen oder
                </p>
                <label htmlFor="file-input">
                  <Button
                    type="button"
                    variant="outline"
                    data-testid="button-browse-files"
                    onClick={() => document.getElementById("file-input")?.click()}
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Durchsuchen
                  </Button>
                </label>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Ausgewählte Dateien: {uploadedFiles.length}
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {uploadedFiles.slice(0, 10).map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        <span className="truncate">{file.name}</span>
                      </div>
                    ))}
                    {uploadedFiles.length > 10 && (
                      <p className="text-xs text-muted-foreground">
                        ... und {uploadedFiles.length - 10} weitere
                      </p>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {uploadedFiles.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-medium mb-4">Auto-Stacking Vorschau</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Bilder werden automatisch in {stackedFiles.length} Stack(s) gruppiert
                </p>
                <div className="space-y-2">
                  {stackedFiles.slice(0, 5).map((stack, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                      data-testid={`stack-preview-${i}`}
                    >
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        Stack {i + 1}: {stack.length} Bild(er)
                      </span>
                    </div>
                  ))}
                  {stackedFiles.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      ... und {stackedFiles.length - 5} weitere Stacks
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Stack Management */}
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-lg font-medium mb-4">Raumtyp-Zuordnung</h2>

              {stacks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    Keine Stacks vorhanden. Laden Sie Bilder hoch, um zu beginnen.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stacks.map((stack) => (
                    <div
                      key={stack.id}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-md"
                      data-testid={`stack-${stack.id}`}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Stack {stack.stackNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {stack.frameCount} Bilder
                        </p>
                      </div>
                      <Select
                        value={stack.roomType}
                        onValueChange={(value) =>
                          updateRoomTypeMutation.mutate({
                            stackId: stack.id,
                            roomType: value as RoomType,
                          })
                        }
                      >
                        <SelectTrigger
                          className="w-48"
                          data-testid={`select-room-type-${stack.id}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROOM_TYPES.map((room) => (
                            <SelectItem key={room.value} value={room.value}>
                              {room.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-medium mb-4">Upload-Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Bilder hochgeladen</span>
                  <span className="font-medium">{images.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Stacks erstellt</span>
                  <span className="font-medium">{stacks.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Zugeordnet</span>
                  <span className="font-medium">
                    {stacks.filter((s) => s.roomType !== "undefined_space").length} /{" "}
                    {stacks.length}
                  </span>
                </div>
              </div>

              <Button
                className="w-full mt-4"
                data-testid="button-upload-files"
                onClick={() => uploadFilesMutation.mutate()}
                disabled={uploadedFiles.length === 0 || uploadFilesMutation.isPending}
              >
                {uploadFilesMutation.isPending ? "Lädt hoch..." : "Bilder hochladen"}
              </Button>

              {stacks.length > 0 && (
                <Button
                  className="w-full mt-2"
                  variant="outline"
                  data-testid="button-complete-upload"
                >
                  Upload abschließen
                </Button>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
