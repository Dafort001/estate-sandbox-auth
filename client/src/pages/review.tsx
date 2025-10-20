import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useState, useEffect } from "react";
import { Check, X, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface EditedImage {
  id: string;
  shootId: string;
  stackId: string | null;
  filename: string;
  filePath: string;
  fileSize?: number;
  version: number;
  roomType?: string;
  sequenceIndex?: number;
  clientApprovalStatus: string;
  createdAt: number;
  stack?: {
    id: string;
    stackNumber: string;
    frameCount: number;
    roomType: string;
    images: Array<{
      id: string;
      filePath: string;
      originalFilename: string;
    }>;
  };
}

interface ReviewData {
  job: {
    id: string;
    jobNumber: string;
    propertyName: string;
  };
  shoot: {
    id: string;
    shootCode: string;
    status: string;
  };
  editedImages: Record<number, Record<string, EditedImage[]>>;
  totalImages: number;
}

export default function Review() {
  const params = useParams<{ jobId: string; shootId: string }>();
  const { jobId, shootId } = params;
  const { toast } = useToast();
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState<Record<string, boolean>>({});

  const { data, isLoading, error } = useQuery<ReviewData>({
    queryKey: ['/api/projects', jobId, 'shoots', shootId, 'edited-images'],
  });

  // Auto-select latest version when data loads
  useEffect(() => {
    if (data && data.editedImages) {
      const versions = Object.keys(data.editedImages).map(Number).sort((a, b) => b - a);
      if (versions.length > 0 && selectedVersion === null) {
        setSelectedVersion(versions[0]); // Select latest version
      }
    }
  }, [data, selectedVersion]);

  const approveMutation = useMutation({
    mutationFn: async (imageId: string) => {
      return await apiRequest('PUT', `/api/edited-images/${imageId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/projects', jobId, 'shoots', shootId, 'edited-images'],
      });
      toast({
        title: "Bild genehmigt",
        description: "Das Bild wurde erfolgreich genehmigt.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Das Bild konnte nicht genehmigt werden.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (imageId: string) => {
      return await apiRequest('PUT', `/api/edited-images/${imageId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/projects', jobId, 'shoots', shootId, 'edited-images'],
      });
      toast({
        title: "Bild abgelehnt",
        description: "Das Bild wurde abgelehnt.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Das Bild konnte nicht abgelehnt werden.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Lade Bilder...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
            <div>
              <p className="font-medium mb-2">Fehler beim Laden</p>
              <p className="text-sm text-muted-foreground">
                Die Bilder konnten nicht geladen werden. Bitte versuchen Sie es später erneut.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Keine Daten gefunden</p>
      </div>
    );
  }

  const versions = Object.keys(data.editedImages).map(Number).sort((a, b) => b - a);
  const currentVersionImages = selectedVersion !== null ? (data.editedImages[selectedVersion] || {}) : {};
  const roomTypes = Object.keys(currentVersionImages).sort();

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-600">Genehmigt</Badge>;
      case 'rejected':
        return <Badge className="bg-red-600">Abgelehnt</Badge>;
      default:
        return <Badge variant="secondary">Ausstehend</Badge>;
    }
  };

  const toggleComparison = (imageId: string) => {
    setShowComparison(prev => ({ ...prev, [imageId]: !prev[imageId] }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-normal mb-2" data-testid="text-page-title">
            {data.job.propertyName}
          </h1>
          <p className="text-muted-foreground">
            Job: {data.job.jobNumber} • Shoot: {data.shoot.shootCode}
          </p>
        </div>

        {versions.length > 1 && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-2">Version auswählen:</p>
            <div className="flex gap-2">
              {versions.map((version) => (
                <Button
                  key={version}
                  variant={selectedVersion === version ? "default" : "outline"}
                  onClick={() => setSelectedVersion(version)}
                  data-testid={`button-version-${version}`}
                >
                  v{version}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue={roomTypes[0]} className="w-full">
          <TabsList className="mb-6">
            {roomTypes.map((roomType) => (
              <TabsTrigger key={roomType} value={roomType} data-testid={`tab-${roomType}`}>
                {roomType} ({currentVersionImages[roomType]?.length || 0})
              </TabsTrigger>
            ))}
          </TabsList>

          {roomTypes.map((roomType) => (
            <TabsContent key={roomType} value={roomType}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {currentVersionImages[roomType]?.map((image: EditedImage) => (
                  <Card key={image.id} data-testid={`card-image-${image.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-normal">
                          {image.filename}
                        </CardTitle>
                        {getApprovalBadge(image.clientApprovalStatus)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                        {showComparison[image.id] && image.stack?.images?.[0] ? (
                          <img
                            src={image.stack.images[0].filePath}
                            alt="Original"
                            className="w-full h-full object-cover"
                            data-testid={`img-original-${image.id}`}
                          />
                        ) : (
                          <img
                            src={image.filePath}
                            alt={image.filename}
                            className="w-full h-full object-cover"
                            data-testid={`img-edited-${image.id}`}
                          />
                        )}
                      </div>

                      {image.stack && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => toggleComparison(image.id)}
                          data-testid={`button-compare-${image.id}`}
                        >
                          {showComparison[image.id] ? (
                            <>
                              <ChevronRight className="w-4 h-4 mr-2" />
                              Bearbeitetes Bild zeigen
                            </>
                          ) : (
                            <>
                              <ChevronLeft className="w-4 h-4 mr-2" />
                              Original zeigen
                            </>
                          )}
                        </Button>
                      )}

                      {image.clientApprovalStatus === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            variant="default"
                            onClick={() => approveMutation.mutate(image.id)}
                            disabled={approveMutation.isPending}
                            data-testid={`button-approve-${image.id}`}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Genehmigen
                          </Button>
                          <Button
                            className="flex-1"
                            variant="outline"
                            onClick={() => rejectMutation.mutate(image.id)}
                            disabled={rejectMutation.isPending}
                            data-testid={`button-reject-${image.id}`}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Ablehnen
                          </Button>
                        </div>
                      )}

                      {image.clientApprovalStatus === 'approved' && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => rejectMutation.mutate(image.id)}
                          disabled={rejectMutation.isPending}
                          data-testid={`button-change-to-reject-${image.id}`}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Doch ablehnen
                        </Button>
                      )}

                      {image.clientApprovalStatus === 'rejected' && (
                        <Button
                          variant="default"
                          className="w-full"
                          onClick={() => approveMutation.mutate(image.id)}
                          disabled={approveMutation.isPending}
                          data-testid={`button-change-to-approve-${image.id}`}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Doch genehmigen
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {data.totalImages === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Noch keine bearbeiteten Bilder verfügbar.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
