import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";
import type { Service } from "@shared/schema";

const categoryLabels: Record<string, string> = {
  photography: "Immobilienfotografie",
  drone: "Drohnenaufnahmen",
  video: "Videoaufnahmen",
  "360tour": "Virtuelle Rundgänge / 360°",
  staging: "Virtuelles Staging",
  optimization: "Bildoptimierung und KI-Retusche",
  travel: "Anfahrt und Service"
};

const categoryOrder = [
  "photography",
  "drone",
  "video",
  "360tour",
  "staging",
  "optimization",
  "travel"
];

function formatPrice(priceInCents: number | null, priceNote?: string | null): string {
  if (priceNote) return priceNote;
  if (priceInCents === null) return "auf Anfrage";
  const euros = priceInCents / 100;
  return `€${euros.toFixed(2).replace(".", ",")}`;
}

export default function Preisliste() {
  const [, setLocation] = useLocation();
  
  const { data: services, isLoading, error } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    queryFn: getQueryFn<Service[]>({ on401: "returnNull" }),
  });

  // Redirect to login if not authenticated
  if (!services && !isLoading && !error) {
    setLocation("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="container max-w-5xl py-8">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl">Interne Preisliste</h1>
          <p className="text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-5xl py-8">
        <Alert variant="destructive" data-testid="alert-error">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler beim Laden</AlertTitle>
          <AlertDescription>
            Die Preisliste konnte nicht geladen werden. Bitte versuchen Sie es später erneut.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!services || services.length === 0) {
    return (
      <div className="container max-w-5xl py-8">
        <Alert data-testid="alert-empty">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Keine Dienste verfügbar</AlertTitle>
          <AlertDescription>
            Die Preisliste ist derzeit leer. Bitte kontaktieren Sie uns für aktuelle Preise.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const servicesByCategory = services?.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>) || {};

  return (
    <div className="container max-w-5xl py-8" data-testid="page-preisliste">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl" data-testid="heading-preisliste">Interne Preisliste</h1>
        <p className="text-muted-foreground">
          Alle Preise netto. Für individuelle Pakete und Projektanfragen sprechen Sie uns gerne an.
        </p>
      </div>

      <div className="space-y-8">
        {categoryOrder.map((categoryKey) => {
          const categoryServices = servicesByCategory[categoryKey];
          if (!categoryServices || categoryServices.length === 0) return null;

          return (
            <div key={categoryKey} data-testid={`category-${categoryKey}`}>
              <h2 className="text-2xl mb-4">{categoryLabels[categoryKey]}</h2>
              
              <div className="space-y-4">
                {categoryServices.map((service) => (
                  <Card key={service.id} data-testid={`service-${service.serviceCode}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" data-testid={`code-${service.serviceCode}`}>
                              {service.serviceCode}
                            </Badge>
                            <CardTitle className="text-lg">{service.name}</CardTitle>
                          </div>
                          {service.description && (
                            <CardDescription>{service.description}</CardDescription>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-lg" data-testid={`price-${service.serviceCode}`}>
                            {formatPrice(service.netPrice, service.priceNote)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    {service.notes && (
                      <>
                        <Separator />
                        <CardContent className="pt-4">
                          <p className="text-sm text-muted-foreground">{service.notes}</p>
                        </CardContent>
                      </>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 p-6 bg-muted rounded-lg">
        <h3 className="text-lg mb-2">Hinweise</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Alle Preise verstehen sich netto, zzgl. 19% MwSt.</li>
          <li>• Reisekosten: Hamburg bis 30 km und Berlin innerhalb S-Bahn-Ring inklusive</li>
          <li>• Drohnenaufnahmen wetterabhängig, ggf. separate Genehmigung erforderlich</li>
          <li>• Pakete können individuell angepasst werden</li>
        </ul>
      </div>
    </div>
  );
}
