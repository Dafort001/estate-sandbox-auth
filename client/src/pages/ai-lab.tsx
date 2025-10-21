import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Wand2, Image as ImageIcon, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface AITool {
  id: string;
  name: string;
  description: string;
  estimatedTimeSeconds: number;
  costPerImage: number;
  creditsPerImage: number;
  category: string;
}

interface AIJob {
  id: string;
  shootId: string;
  tool: string;
  sourceImageKey: string;
  outputImageKey: string | null;
  status: string;
  cost: number | null;
  credits: number | null;
  errorMessage: string | null;
  createdAt: number;
}

interface Shoot {
  id: string;
  shootCode: string;
  jobId: string;
}

interface Image {
  id: string;
  shootId: string;
  originalFilename: string;
  filePath: string;
}

export default function AILabPage() {
  const { toast } = useToast();
  const [selectedShootId, setSelectedShootId] = useState<string>("");
  const [selectedImageKey, setSelectedImageKey] = useState<string>("");
  const [selectedToolId, setSelectedToolId] = useState<string>("");
  const [previewMode, setPreviewMode] = useState<"original" | "processed">("original");

  const { data: shoots } = useQuery<Shoot[]>({
    queryKey: ["/api/shoots"],
  });

  const { data: tools } = useQuery<AITool[]>({
    queryKey: ["/api/ai/tools"],
  });

  const { data: images } = useQuery<Image[]>({
    queryKey: ["/api/shoots", selectedShootId, "images"],
    enabled: !!selectedShootId,
  });

  const { data: jobs, refetch: refetchJobs } = useQuery<AIJob[]>({
    queryKey: ["/api/ai/jobs", selectedShootId],
    enabled: !!selectedShootId,
    refetchInterval: 5000, // Poll every 5 seconds for job updates
  });

  const { data: credits } = useQuery<{ credits: number }>({
    queryKey: ["/api/credits/balance"],
  });

  const runAIMutation = useMutation({
    mutationFn: async (params: {
      shootId: string;
      toolId: string;
      sourceImageKey: string;
    }) => {
      const res = await apiRequest("POST", "/api/ai/run", params);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "AI-Job gestartet",
        description: "Dein Bild wird verarbeitet. Das kann einige Minuten dauern.",
      });
      refetchJobs();
      queryClient.invalidateQueries({ queryKey: ["/api/credits/balance"] });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "AI-Job konnte nicht gestartet werden",
        variant: "destructive",
      });
    },
  });

  const handleProcessImage = async () => {
    if (!selectedShootId || !selectedImageKey || !selectedToolId) {
      toast({
        title: "Unvollständige Auswahl",
        description: "Bitte wähle Shoot, Bild und Tool aus",
        variant: "destructive",
      });
      return;
    }

    const tool = tools?.find((t) => t.id === selectedToolId);
    if (!tool) return;

    if (credits && credits.credits < tool.creditsPerImage) {
      toast({
        title: "Nicht genug Credits",
        description: `Du benötigst ${tool.creditsPerImage} Credits. Aktuell: ${credits.credits}`,
        variant: "destructive",
      });
      return;
    }

    await runAIMutation.mutateAsync({
      shootId: selectedShootId,
      toolId: selectedToolId,
      sourceImageKey: selectedImageKey,
    });
  };

  const selectedJob = jobs?.find(
    (j) => j.sourceImageKey === selectedImageKey && j.tool === selectedToolId
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-success/20 text-success" data-testid="badge-status-completed">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Abgeschlossen
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-destructive/20 text-destructive" data-testid="badge-status-failed">
            <XCircle className="w-3 h-3 mr-1" />
            Fehlgeschlagen
          </Badge>
        );
      case "pending":
      case "processing":
        return (
          <Badge className="bg-primary/20 text-primary animate-pulse" data-testid="badge-status-processing">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Wird verarbeitet
          </Badge>
        );
      default:
        return <Badge data-testid="badge-status-unknown">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2" data-testid="text-page-title">
          AI Lab
        </h1>
        <p className="text-secondary" data-testid="text-page-description">
          Verbessere deine Bilder mit KI-gestützten Tools
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Selection */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary" data-testid="text-credits-balance">
                {credits?.credits || 0}
              </div>
              <p className="text-sm text-secondary mt-1">Verfügbare Credits</p>
              <Button variant="outline" className="w-full mt-4" data-testid="button-buy-credits">
                Credits kaufen
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shoot auswählen</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                className="w-full rounded-lg border px-4 py-3"
                value={selectedShootId}
                onChange={(e) => {
                  setSelectedShootId(e.target.value);
                  setSelectedImageKey("");
                }}
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

          {selectedShootId && images && images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Bild auswählen</CardTitle>
                <CardDescription>{images.length} Bilder verfügbar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {images.map((image) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImageKey(image.filePath)}
                      className={`
                        relative aspect-video rounded-lg overflow-hidden border-2 transition-all
                        ${selectedImageKey === image.filePath ? "border-primary" : "border-transparent"}
                      `}
                      data-testid={`button-select-image-${image.id}`}
                    >
                      <div className="absolute inset-0 bg-card flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-secondary" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                        <p className="text-xs text-white truncate">{image.originalFilename}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>AI-Tool auswählen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tools?.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setSelectedToolId(tool.id)}
                  className={`
                    w-full p-4 rounded-lg border-2 text-left transition-all hover-elevate
                    ${selectedToolId === tool.id ? "border-primary bg-primary/5" : "border-border"}
                  `}
                  data-testid={`button-select-tool-${tool.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{tool.name}</h4>
                      <p className="text-sm text-secondary mt-1">{tool.description}</p>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {tool.creditsPerImage} Credits
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-2 text-xs text-secondary">
                    <span>~{tool.estimatedTimeSeconds}s</span>
                    <span>•</span>
                    <span>€{tool.costPerImage.toFixed(2)}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Button
            onClick={handleProcessImage}
            disabled={!selectedShootId || !selectedImageKey || !selectedToolId || runAIMutation.isPending}
            className="w-full"
            data-testid="button-process-image"
          >
            {runAIMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starte Verarbeitung...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Bild verarbeiten
              </>
            )}
          </Button>
        </div>

        {/* Right Panel: Preview & Jobs */}
        <div className="lg:col-span-2 space-y-6">
          {selectedImageKey && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Vorschau</CardTitle>
                  {selectedJob && (
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedJob.status)}
                    </div>
                  )}
                </div>
                <CardDescription>
                  Vergleiche Original und verarbeitetes Bild
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={previewMode === "original" ? "default" : "outline"}
                    onClick={() => setPreviewMode("original")}
                    size="sm"
                    data-testid="button-preview-original"
                  >
                    Original
                  </Button>
                  <Button
                    variant={previewMode === "processed" ? "default" : "outline"}
                    onClick={() => setPreviewMode("processed")}
                    size="sm"
                    disabled={!selectedJob || selectedJob.status !== "completed"}
                    data-testid="button-preview-processed"
                  >
                    Verarbeitet
                  </Button>
                </div>

                <div className="aspect-video bg-card rounded-lg border flex items-center justify-center">
                  {previewMode === "original" ? (
                    <div className="text-center">
                      <ImageIcon className="w-16 h-16 text-secondary mx-auto mb-2" />
                      <p className="text-sm text-secondary">Original-Bild</p>
                    </div>
                  ) : selectedJob?.status === "completed" ? (
                    <div className="text-center">
                      <ImageIcon className="w-16 h-16 text-primary mx-auto mb-2" />
                      <p className="text-sm text-secondary">Verarbeitetes Bild</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Loader2 className="w-16 h-16 text-secondary mx-auto mb-2 animate-spin" />
                      <p className="text-sm text-secondary">Wird verarbeitet...</p>
                    </div>
                  )}
                </div>

                {selectedJob?.status === "processing" && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-secondary mb-2">
                      <span>Verarbeitung läuft...</span>
                      <span>Geschätzte Zeit: {tools?.find((t) => t.id === selectedToolId)?.estimatedTimeSeconds}s</span>
                    </div>
                    <Progress value={undefined} className="animate-pulse" />
                  </div>
                )}

                {selectedJob?.errorMessage && (
                  <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">{selectedJob.errorMessage}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {jobs && jobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Job-Verlauf</CardTitle>
                <CardDescription>{jobs.length} Jobs für diesen Shoot</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-4 border rounded-lg"
                      data-testid={`job-${job.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">
                              {tools?.find((t) => t.id === job.tool)?.name || job.tool}
                            </h4>
                            {getStatusBadge(job.status)}
                          </div>
                          <p className="text-sm text-secondary mt-1">
                            {new Date(job.createdAt).toLocaleString("de-DE")}
                          </p>
                          {job.credits && (
                            <p className="text-sm text-secondary">
                              {job.credits} Credits • €{job.cost?.toFixed(2) || "0.00"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
