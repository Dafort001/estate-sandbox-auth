import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, FileImage, CheckCircle2, AlertCircle } from "lucide-react";

interface UploadFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "completed" | "error";
  progress: number;
  error?: string;
  uploadId?: string;
  etags?: string[];
}

interface Shoot {
  id: string;
  shootCode: string;
  jobId: string;
}

export default function UploadRawPage() {
  const { toast } = useToast();
  const [selectedShootId, setSelectedShootId] = useState<string>("");
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const { data: shoots } = useQuery<Shoot[]>({
    queryKey: ["/api/shoots"],
  });

  const initUploadMutation = useMutation({
    mutationFn: async (params: { shootId: string; filename: string; filesize: number; mimetype: string }) => {
      const res = await apiRequest("POST", "/api/uploads/init", params);
      return await res.json();
    },
  });

  const uploadPartMutation = useMutation({
    mutationFn: async ({ url, chunk }: { url: string; chunk: Blob }) => {
      const res = await fetch(url, {
        method: "PUT",
        body: chunk,
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });
      return res.headers.get("ETag") || "";
    },
  });

  const completeUploadMutation = useMutation({
    mutationFn: async (params: { uploadId: string; etags: string[] }) => {
      const res = await apiRequest("POST", "/api/uploads/complete", params);
      return await res.json();
    },
  });

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      addFiles(files);
    }
  }, []);

  const addFiles = (files: File[]) => {
    const validExtensions = [
      ".cr2", ".cr3", ".crm", ".crw", ".nef", ".nrw", ".arw", ".sr2", ".srf", ".raf",
      ".rw2", ".rwl", ".dng", ".orf", ".pef", ".braw", ".r3d", ".ari", ".mxf",
      ".cdng", ".iiq", ".3fr", ".fff", ".x3f", ".erf", ".srw", ".mef", ".mos",
      ".cap", ".kdc", ".tiff", ".tif", ".jpg", ".jpeg"
    ];
    const newFiles = files
      .filter((file) => {
        const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
        if (!validExtensions.includes(ext)) {
          toast({
            title: "Ungültiges Dateiformat",
            description: `${file.name} wird nicht unterstützt. Erlaubte Formate: RAW (CR2/CR3/NEF/ARW/DNG etc.), Video-RAW (BRAW/R3D/MXF), TIFF, JPG`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      })
      .map((file) => ({
        file,
        id: `${Date.now()}-${file.name}`,
        status: "pending" as const,
        progress: 0,
      }));

    setUploadFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadFile = async (uploadFile: UploadFile) => {
    if (!selectedShootId) {
      toast({
        title: "Fehler",
        description: "Bitte wähle zuerst einen Shoot aus",
        variant: "destructive",
      });
      return;
    }

    setUploadFiles((prev) =>
      prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "uploading" as const } : f))
    );

    try {
      const initResponse = await initUploadMutation.mutateAsync({
        shootId: selectedShootId,
        filename: uploadFile.file.name,
        filesize: uploadFile.file.size,
        mimetype: uploadFile.file.type || "application/octet-stream",
      });

      const { uploadId, presignedUrls, partCount } = initResponse;
      const chunkSize = 10 * 1024 * 1024; // 10MB chunks
      const etags: string[] = [];

      for (let i = 0; i < partCount; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, uploadFile.file.size);
        const chunk = uploadFile.file.slice(start, end);

        const etag = await uploadPartMutation.mutateAsync({
          url: presignedUrls[i],
          chunk,
        });

        etags.push(etag);

        const progress = Math.round(((i + 1) / partCount) * 100);
        setUploadFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f))
        );
      }

      await completeUploadMutation.mutateAsync({
        uploadId,
        etags,
      });

      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: "completed" as const, progress: 100 } : f
        )
      );

      toast({
        title: "Upload erfolgreich",
        description: `${uploadFile.file.name} wurde hochgeladen`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/shoots", selectedShootId] });
    } catch (error) {
      console.error("Upload error:", error);
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: "error" as const, error: "Upload fehlgeschlagen" }
            : f
        )
      );

      toast({
        title: "Upload fehlgeschlagen",
        description: `Fehler beim Hochladen von ${uploadFile.file.name}`,
        variant: "destructive",
      });
    }
  };

  const startUpload = async () => {
    const pendingFiles = uploadFiles.filter((f) => f.status === "pending");

    for (const file of pendingFiles) {
      await uploadFile(file);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2" data-testid="text-page-title">
          RAW-Dateien hochladen
        </h1>
        <p className="text-secondary" data-testid="text-page-description">
          Lade professionelle RAW-Dateien für deine Immobilien-Shoots hoch
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Shoot auswählen</CardTitle>
          <CardDescription>Wähle den Shoot aus, zu dem die Dateien gehören</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            className="w-full rounded-lg border px-4 py-3"
            value={selectedShootId}
            onChange={(e) => setSelectedShootId(e.target.value)}
            data-testid="select-shoot"
          >
            <option value="">Bitte wählen...</option>
            {shoots?.map((shoot) => (
              <option key={shoot.id} value={shoot.id}>
                {shoot.shootCode}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Dateien hochladen</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-2xl min-h-64 flex flex-col items-center justify-center
              transition-colors cursor-pointer
              ${isDragActive ? "border-primary bg-primary/5" : "border-border"}
            `}
            data-testid="dropzone-upload"
          >
            <input
              type="file"
              multiple
              accept=".cr2,.cr3,.crm,.crw,.nef,.nrw,.arw,.sr2,.srf,.raf,.rw2,.rwl,.dng,.orf,.pef,.braw,.r3d,.ari,.mxf,.cdng,.iiq,.3fr,.fff,.x3f,.erf,.srw,.mef,.mos,.cap,.kdc,.tiff,.tif,.jpg,.jpeg"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
              data-testid="input-file"
            />
            <label
              htmlFor="file-input"
              className="flex flex-col items-center justify-center cursor-pointer w-full h-full p-8"
            >
              <Upload className="w-16 h-16 text-secondary mb-4" />
              <p className="text-lg font-medium mb-2">
                Dateien hierher ziehen oder klicken zum Auswählen
              </p>
              <p className="text-sm text-secondary">
                RAW, Video-RAW, TIFF, JPG (alle gängigen Kamera-Formate)
              </p>
            </label>
          </div>

          {uploadFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              {uploadFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-4 border rounded-lg"
                  data-testid={`upload-file-${file.id}`}
                >
                  <FileImage className="w-8 h-8 text-secondary flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.file.name}</p>
                    <p className="text-sm text-secondary">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>

                    {file.status === "uploading" && (
                      <Progress value={file.progress} className="mt-2" />
                    )}

                    {file.status === "error" && (
                      <p className="text-sm text-destructive mt-1">{file.error}</p>
                    )}
                  </div>

                  {file.status === "completed" && (
                    <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
                  )}

                  {file.status === "error" && (
                    <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" />
                  )}

                  {file.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(file.id)}
                      data-testid={`button-remove-${file.id}`}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {uploadFiles.length > 0 && (
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setUploadFiles([])}
                data-testid="button-clear-all"
              >
                Alle entfernen
              </Button>
              <Button
                onClick={startUpload}
                disabled={
                  !selectedShootId ||
                  uploadFiles.filter((f) => f.status === "pending").length === 0
                }
                data-testid="button-start-upload"
              >
                Upload starten ({uploadFiles.filter((f) => f.status === "pending").length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
