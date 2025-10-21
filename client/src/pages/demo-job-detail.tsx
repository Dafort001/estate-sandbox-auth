import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Play, Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";

export default function DemoJobDetail() {
  const [, params] = useRoute("/job/:id");
  const jobId = params?.id;
  const { toast } = useToast();

  const { data: job, isLoading } = useQuery<any>({
    queryKey: ["/api/jobs", jobId],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (!response.ok) throw new Error("Job nicht gefunden");
      return response.json();
    },
    enabled: !!jobId,
  });

  const processJobMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/jobs/${jobId}/process`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId] });
      toast({
        title: "Verarbeitung gestartet",
        description: "Der Job wird jetzt verarbeitet. Dies kann einige Sekunden dauern.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Verarbeitung konnte nicht gestartet werden",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Job nicht gefunden</AlertDescription>
        </Alert>
      </div>
    );
  }

  const StatusIcon = 
    job.status === "completed" ? CheckCircle :
    job.status === "processing" ? Loader2 :
    job.status === "failed" ? AlertCircle :
    Clock;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/demo-jobs">
          <Button variant="outline" size="sm" data-testid="button-back">
            ← Zurück
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary" data-testid="icon-job" />
              <div>
                <CardTitle data-testid="text-job-title">
                  Job #{job.jobNumber}
                </CardTitle>
                <CardDescription data-testid="text-customer-name">
                  Kunde: {job.customerName}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant={
                job.status === "completed" ? "default" :
                job.status === "processing" ? "secondary" :
                job.status === "failed" ? "destructive" :
                "outline"
              }
              className="flex items-center gap-1"
              data-testid="badge-status"
            >
              <StatusIcon className={`w-3 h-3 ${job.status === "processing" ? "animate-spin" : ""}`} />
              {job.status === "pending" && "Ausstehend"}
              {job.status === "processing" && "Verarbeitung"}
              {job.status === "completed" && "Abgeschlossen"}
              {job.status === "failed" && "Fehler"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div>
              <h3 className="font-semibold mb-1">Objektname</h3>
              <p className="text-muted-foreground" data-testid="text-property-name">{job.propertyName}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Adresse</h3>
              <p className="text-muted-foreground" data-testid="text-property-address">{job.propertyAddress}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Deliverables</h3>
            <div className="flex flex-wrap gap-2">
              {(job.deliverGallery === "true" || job.deliverGallery === true) && (
                <Badge variant="outline" data-testid="badge-gallery">
                  Bildergalerie
                </Badge>
              )}
              {(job.deliverAlttext === "true" || job.deliverAlttext === true) && (
                <Badge variant="outline" data-testid="badge-alttext">
                  Alt-Texte
                </Badge>
              )}
              {(job.deliverExpose === "true" || job.deliverExpose === true) && (
                <Badge variant="outline" data-testid="badge-expose">
                  Exposé
                </Badge>
              )}
            </div>
          </div>

          {job.status === "pending" && (
            <div>
              <Alert>
                <AlertDescription>
                  Dieser Job wurde noch nicht verarbeitet. Klicken Sie auf "Verarbeiten" um die Demo-Verarbeitung zu starten.
                </AlertDescription>
              </Alert>
              <Button
                className="mt-4 w-full"
                onClick={() => processJobMutation.mutate()}
                disabled={processJobMutation.isPending}
                data-testid="button-process"
              >
                {processJobMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verarbeitung läuft...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Verarbeiten (Demo)
                  </>
                )}
              </Button>
            </div>
          )}

          {job.status === "processing" && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Der Job wird gerade verarbeitet. Bitte warten Sie einen Moment.
              </AlertDescription>
            </Alert>
          )}

          {job.status === "completed" && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Der Job wurde erfolgreich verarbeitet!
              </AlertDescription>
            </Alert>
          )}

          {job.status === "failed" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Bei der Verarbeitung ist ein Fehler aufgetreten.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
