import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, FolderOpen, Calendar, MapPin, Image } from "lucide-react";
import { Link } from "wouter";
import type { Job, Shoot } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Job card component with shoots
function JobCard({ job }: { job: Job }) {
  const { data: shoots = [] } = useQuery<Shoot[]>({
    queryKey: ["/api/jobs", job.id, "shoots"],
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      created: { label: "Erstellt", variant: "outline" },
      in_progress: { label: "In Bearbeitung", variant: "default" },
      edited_returned: { label: "Editor fertig", variant: "secondary" },
      completed: { label: "Abgeschlossen", variant: "secondary" },
    };
    const config = variants[status] || variants.created;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="p-6" data-testid={`job-card-${job.id}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-medium mb-1">{job.propertyName}</h3>
          <p className="text-xs text-muted-foreground font-mono">
            {job.jobNumber}
          </p>
        </div>
        {getStatusBadge(job.status)}
      </div>

      {job.propertyAddress && (
        <div className="flex items-start gap-2 mb-3 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{job.propertyAddress}</span>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <Calendar className="w-3 h-3" />
        <span>{formatDate(job.createdAt)}</span>
      </div>

      {/* Shoots list */}
      {shoots.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Shoots:</p>
          {shoots.map((shoot) => (
            <div key={shoot.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="font-mono text-xs">{shoot.shootCode}</span>
              <Link href={`/review/${job.id}/${shoot.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid={`button-review-${shoot.id}`}
                >
                  <Image className="w-3 h-3 mr-1" />
                  Review
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          data-testid={`button-view-job-${job.id}`}
        >
          Details anzeigen
        </Button>
      </div>
    </Card>
  );
}

export default function Jobs() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [propertyName, setPropertyName] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");

  // Fetch all jobs
  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (data: { propertyName: string; propertyAddress?: string }) => {
      const res = await apiRequest("POST", "/api/jobs", data);
      return await res.json();
    },
    onSuccess: (data: Job) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setIsCreateDialogOpen(false);
      setPropertyName("");
      setPropertyAddress("");
      toast({
        title: "Job erstellt",
        description: `Job-Nummer: ${data.jobNumber}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Job konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (propertyName.trim()) {
      createJobMutation.mutate({
        propertyName: propertyName.trim(),
        propertyAddress: propertyAddress.trim() || undefined,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light mb-1">Workflow Jobs</h1>
            <p className="text-muted-foreground">
              Verwalten Sie Ihre Fotografie-Projekte
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-job">
                <Plus className="w-4 h-4 mr-2" />
                Neuer Job
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neuen Job erstellen</DialogTitle>
                <DialogDescription>
                  Erstellen Sie einen neuen Job für ein Fotografie-Projekt
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateJob} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="propertyName">Objektname*</Label>
                  <Input
                    id="propertyName"
                    data-testid="input-property-name"
                    placeholder="z.B. Villa am See"
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="propertyAddress">Adresse (optional)</Label>
                  <Input
                    id="propertyAddress"
                    data-testid="input-property-address"
                    placeholder="z.B. Seestraße 123, 12345 Berlin"
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    type="submit"
                    data-testid="button-submit-job"
                    disabled={!propertyName.trim() || createJobMutation.isPending}
                  >
                    {createJobMutation.isPending ? "Erstelle..." : "Job erstellen"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Jobs List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Lädt Jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <Card className="p-12 text-center">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Keine Jobs vorhanden</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Erstellen Sie Ihren ersten Job, um zu beginnen
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-job">
              <Plus className="w-4 h-4 mr-2" />
              Neuer Job
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
