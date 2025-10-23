import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, CreditCard, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SEOHead } from "@/components/SEOHead";

type Job = {
  id: string;
  jobNumber: string;
  propertyName: string;
  status: string;
};

type PricingItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export default function Payment() {
  const { jobId } = useParams<{ jobId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: job, isLoading, isError } = useQuery<Job>({
    queryKey: ["/api/jobs", jobId],
    enabled: !!jobId,
  });

  // Mock pricing - in production würde das vom Backend kommen
  const pricingItems: PricingItem[] = [
    { name: "Bildbearbeitung (Professional)", quantity: 25, unitPrice: 2.50, total: 62.50 },
    { name: "AI Captions", quantity: 25, unitPrice: 0.50, total: 12.50 },
  ];

  const subtotal = pricingItems.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.19; // 19% MwSt
  const total = subtotal + tax;

  const paymentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/jobs/${jobId}/create-checkout`);
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
      }
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Zahlung konnte nicht gestartet werden",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Zahlung - pix.immo"
        description="Bezahlen Sie Ihr Fotoshooting"
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
            <div>
              <h1 className="text-2xl font-bold">Zahlung</h1>
              {job && (
                <p className="text-sm text-muted-foreground">
                  {job.propertyName} - #{job.jobNumber}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {isLoading ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-10 w-2/3" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <h3 className="text-xl font-semibold mb-2 text-destructive" data-testid="text-error-title">
                Fehler beim Laden
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-6" data-testid="text-error-description">
                Der Auftrag konnte nicht geladen werden. Bitte versuchen Sie es erneut.
              </p>
              <Button onClick={() => setLocation("/portal/uploads")} data-testid="button-back-to-uploads">
                Zurück zur Übersicht
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Pricing Breakdown */}
            <Card>
            <CardHeader>
              <CardTitle>Kostenaufstellung</CardTitle>
              <CardDescription>Übersicht Ihrer Bestellung</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pricingItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" data-testid={`item-name-${index}`}>{item.name}</p>
                    <p className="text-sm text-muted-foreground" data-testid={`item-quantity-${index}`}>
                      {item.quantity} × €{item.unitPrice.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold" data-testid={`item-total-${index}`}>
                    €{item.total.toFixed(2)}
                  </p>
                </div>
              ))}

              <Separator />

              <div className="flex items-center justify-between text-sm">
                <p>Zwischensumme</p>
                <p data-testid="text-subtotal">€{subtotal.toFixed(2)}</p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <p>MwSt. (19%)</p>
                <p data-testid="text-tax">€{tax.toFixed(2)}</p>
              </div>

              <Separator />

              <div className="flex items-center justify-between text-lg font-bold">
                <p>Gesamt</p>
                <p data-testid="text-total">€{total.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Button */}
          <Card>
            <CardHeader>
              <CardTitle>Zahlungsmethode</CardTitle>
              <CardDescription>
                Sichere Bezahlung über Stripe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="lg"
                className="w-full"
                onClick={() => paymentMutation.mutate()}
                disabled={paymentMutation.isPending}
                data-testid="button-checkout"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                {paymentMutation.isPending ? "Wird geladen..." : "Zur Kasse"}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Ihre Zahlung wird sicher über Stripe verarbeitet
              </p>
            </CardContent>
          </Card>
          </div>
        )}
      </div>
    </div>
  );
}
