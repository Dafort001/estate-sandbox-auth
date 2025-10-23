import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Upload, Calendar, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient } from "@/lib/queryClient";
import { SEOHead } from "@/components/SEOHead";

type Job = {
  id: string;
  jobNumber: string;
  propertyName: string;
  propertyAddress?: string;
  status: string;
  createdAt: number;
  shoots?: Array<{
    id: string;
    shootCode: string;
    status: string;
    _count?: { images: number };
  }>;
};

export default function UploadsOverview() {
  const [, setLocation] = useLocation();

  const { data: jobs, isLoading, isError } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "uploaded": return "bg-blue-500";
      case "processing": return "bg-yellow-500";
      case "captioned": return "bg-purple-500";
      case "expose_ready": return "bg-green-500";
      case "delivered": return "bg-gray-500";
      default: return "bg-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Uploads - pix.immo"
        description="Übersicht Ihrer hochgeladenen Immobilien-Fotoshootings"
      />

      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-2">Uploads</h1>
          <p className="text-muted-foreground">
            Übersicht aller Ihrer Fotoshootings
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <h3 className="text-xl font-semibold mb-2 text-destructive" data-testid="text-error-title">
                Fehler beim Laden
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-6" data-testid="text-error-description">
                Die Aufträge konnten nicht geladen werden. Bitte versuchen Sie es erneut.
              </p>
              <Button onClick={() => queryClient.refetchQueries({ queryKey: ["/api/jobs"] })} data-testid="button-retry">
                Erneut versuchen
              </Button>
            </CardContent>
          </Card>
        ) : !jobs || jobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Upload className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2" data-testid="text-empty-title">
                Keine Uploads
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-6" data-testid="text-empty-description">
                Sie haben noch keine Fotoshootings hochgeladen. Starten Sie Ihr erstes Projekt.
              </p>
              <Button onClick={() => setLocation("/app")} data-testid="button-start-upload">
                Neues Shooting starten
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Card
                key={job.id}
                className="hover-elevate cursor-pointer"
                onClick={() => setLocation(`/portal/job/${job.id}`)}
                data-testid={`job-card-${job.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg" data-testid={`job-title-${job.id}`}>
                        {job.propertyName}
                      </CardTitle>
                      <CardDescription data-testid={`job-number-${job.id}`}>
                        #{job.jobNumber}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(job.status)} data-testid={`job-status-${job.id}`}>
                      {job.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {job.propertyAddress && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{job.propertyAddress}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(job.createdAt).toLocaleDateString("de-DE")}</span>
                  </div>
                  {job.shoots && job.shoots.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Upload className="w-4 h-4" />
                      <span data-testid={`job-photos-${job.id}`}>
                        {job.shoots.reduce((sum, shoot) => sum + (shoot._count?.images || 0), 0)} Fotos
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
