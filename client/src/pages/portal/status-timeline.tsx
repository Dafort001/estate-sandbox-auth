import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, CheckCircle, Clock, Upload as UploadIcon, Sparkles, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SEOHead } from "@/components/SEOHead";

type Job = {
  id: string;
  jobNumber: string;
  propertyName: string;
  status: string;
  createdAt: number;
};

type TimelineEvent = {
  id: string;
  status: "completed" | "in_progress" | "pending";
  title: string;
  description: string;
  timestamp?: number;
  icon: any;
};

export default function StatusTimeline() {
  const { jobId } = useParams<{ jobId: string }>();
  const [, setLocation] = useLocation();

  const { data: job } = useQuery<Job>({
    queryKey: ["/api/jobs", jobId],
    enabled: !!jobId,
  });

  // Timeline basierend auf job.status
  const getTimeline = (currentStatus: string): TimelineEvent[] => {
    const statuses = ["created", "uploaded", "processing", "captioned", "expose_ready", "delivered"];
    const currentIndex = statuses.indexOf(currentStatus);

    return [
      {
        id: "upload",
        status: currentIndex >= 1 ? "completed" : currentIndex === 0 ? "in_progress" : "pending",
        title: "Fotos hochgeladen",
        description: "Ihre Fotos wurden erfolgreich hochgeladen",
        timestamp: currentIndex >= 1 ? Date.now() - 86400000 : undefined,
        icon: UploadIcon,
      },
      {
        id: "processing",
        status: currentIndex >= 2 ? "completed" : currentIndex === 1 ? "in_progress" : "pending",
        title: "Bildbearbeitung",
        description: "Professionelle Bearbeitung Ihrer Fotos",
        timestamp: currentIndex >= 2 ? Date.now() - 43200000 : undefined,
        icon: Sparkles,
      },
      {
        id: "captions",
        status: currentIndex >= 3 ? "completed" : currentIndex === 2 ? "in_progress" : "pending",
        title: "AI Captions",
        description: "Automatische Bildunterschriften werden generiert",
        timestamp: currentIndex >= 3 ? Date.now() - 21600000 : undefined,
        icon: Sparkles,
      },
      {
        id: "ready",
        status: currentIndex >= 4 ? "completed" : currentIndex === 3 ? "in_progress" : "pending",
        title: "Qualitätskontrolle",
        description: "Finale Überprüfung aller Bilder",
        timestamp: currentIndex >= 4 ? Date.now() - 10800000 : undefined,
        icon: CheckCircle,
      },
      {
        id: "delivery",
        status: currentIndex >= 5 ? "completed" : currentIndex === 4 ? "in_progress" : "pending",
        title: "Auslieferung",
        description: "Ihre fertigen Bilder werden bereitgestellt",
        timestamp: currentIndex >= 5 ? Date.now() : undefined,
        icon: Package,
      },
    ];
  };

  const timeline = job ? getTimeline(job.status) : [];
  const completedCount = timeline.filter(e => e.status === "completed").length;
  const progress = (completedCount / timeline.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Status - pix.immo"
        description="Verfolgen Sie den Fortschritt Ihres Fotoshootings"
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
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Status</h1>
              {job && (
                <p className="text-sm text-muted-foreground">
                  {job.propertyName} - #{job.jobNumber}
                </p>
              )}
            </div>
            {job && (
              <Badge data-testid="job-status">
                {job.status}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Fortschritt</CardTitle>
              <CardDescription>
                {completedCount} von {timeline.length} Schritten abgeschlossen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="h-2" data-testid="progress-overall" />
              <p className="text-sm text-muted-foreground mt-2" data-testid="text-progress-percentage">
                {Math.round(progress)}% abgeschlossen
              </p>
            </CardContent>
          </Card>

          {/* Timeline */}
          <div className="space-y-4">
            {timeline.map((event, index) => {
              const Icon = event.icon;
              return (
                <div
                  key={event.id}
                  className="relative"
                  data-testid={`timeline-event-${event.id}`}
                >
                  {index < timeline.length - 1 && (
                    <div className={`absolute left-5 top-12 w-0.5 h-12 ${
                      event.status === "completed" ? "bg-primary" : "bg-muted"
                    }`} />
                  )}
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      event.status === "completed" ? "bg-primary text-primary-foreground" :
                      event.status === "in_progress" ? "bg-primary/20 text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {event.status === "completed" ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : event.status === "in_progress" ? (
                        <Clock className="w-5 h-5 animate-pulse" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold" data-testid={`event-title-${event.id}`}>
                          {event.title}
                        </h3>
                        {event.timestamp && (
                          <span className="text-sm text-muted-foreground">
                            {new Date(event.timestamp).toLocaleDateString("de-DE")}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground" data-testid={`event-description-${event.id}`}>
                        {event.description}
                      </p>
                      {event.status === "in_progress" && (
                        <Badge variant="outline" className="mt-2">
                          In Bearbeitung
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          {job && job.status === "delivered" && (
            <Card>
              <CardContent className="pt-6">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => setLocation(`/portal/delivery/${jobId}`)}
                  data-testid="button-view-delivery"
                >
                  <Package className="w-5 h-5 mr-2" />
                  Bilder herunterladen
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
