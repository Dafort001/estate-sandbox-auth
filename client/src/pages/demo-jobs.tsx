import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Briefcase } from "lucide-react";

export default function DemoJobs() {
  const { data: jobs, isLoading } = useQuery<any[]>({
    queryKey: ["/api/jobs"],
  });

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-primary" data-testid="icon-jobs" />
          <h1 className="text-2xl font-bold">Demo Jobs</h1>
        </div>
        <Link href="/demo-upload">
          <Button data-testid="button-new-job">
            <Plus className="w-4 h-4 mr-2" />
            Neuer Job
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : jobs && jobs.length > 0 ? (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Link key={job.id} href={`/job/${job.id}`}>
              <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid={`card-job-${job.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg" data-testid={`text-job-number-${job.id}`}>
                        #{job.jobNumber} - {job.propertyName}
                      </CardTitle>
                      <CardDescription className="mt-1" data-testid={`text-property-address-${job.id}`}>
                        {job.propertyAddress}
                      </CardDescription>
                      <div className="mt-2 text-sm text-muted-foreground" data-testid={`text-customer-${job.id}`}>
                        Kunde: {job.customerName}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant={
                          job.status === "completed" ? "default" :
                          job.status === "processing" ? "secondary" :
                          job.status === "failed" ? "destructive" :
                          "outline"
                        }
                        data-testid={`badge-status-${job.id}`}
                      >
                        {job.status === "pending" && "Ausstehend"}
                        {job.status === "processing" && "Verarbeitung"}
                        {job.status === "completed" && "Abgeschlossen"}
                        {job.status === "failed" && "Fehler"}
                      </Badge>
                      {(job.deliverAlttext === "true" || job.deliverAlttext === true) && (
                        <Badge variant="outline" className="text-xs" data-testid={`badge-alttext-${job.id}`}>
                          Alt-Texte
                        </Badge>
                      )}
                      {(job.deliverExpose === "true" || job.deliverExpose === true) && (
                        <Badge variant="outline" className="text-xs" data-testid={`badge-expose-${job.id}`}>
                          Exposé
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4" data-testid="text-no-jobs">
              Noch keine Jobs vorhanden
            </p>
            <Link href="/demo-upload">
              <Button data-testid="button-create-first-job">
                <Plus className="w-4 h-4 mr-2" />
                Ersten Job erstellen
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
