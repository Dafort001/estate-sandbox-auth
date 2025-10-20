import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Check, ShoppingCart } from "lucide-react";
import type { Service } from "@shared/schema";

const bookingSchema = z.object({
  propertyName: z.string().min(1, "Objektbezeichnung erforderlich"),
  propertyAddress: z.string().min(1, "Adresse erforderlich"),
  propertyType: z.string().optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  specialRequirements: z.string().optional(),
  serviceSelections: z.record(z.number().min(0)),
});

type BookingFormData = z.infer<typeof bookingSchema>;

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

export default function Booking() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    queryFn: getQueryFn<Service[]>({ on401: "returnNull" }),
  });

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      propertyName: "",
      propertyAddress: "",
      propertyType: "",
      preferredDate: "",
      preferredTime: "",
      specialRequirements: "",
      serviceSelections: {},
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const response = await apiRequest("POST", "/api/bookings", data);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Buchung erfolgreich",
        description: "Ihre Buchung wurde erstellt. Wir kontaktieren Sie in Kürze.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: error.message || "Buchung konnte nicht erstellt werden",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    );
  }

  if (!services) {
    setLocation("/login");
    return null;
  }

  const servicesByCategory = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const calculateTotal = () => {
    let total = 0;
    Object.entries(selectedServices).forEach(([serviceId, quantity]) => {
      if (quantity > 0) {
        const service = services.find(s => s.id === serviceId);
        if (service && service.netPrice) {
          total += service.netPrice * quantity;
        }
      }
    });
    return total;
  };

  const totalCents = calculateTotal();
  const totalEuros = totalCents / 100;
  const totalWithTax = totalEuros * 1.19;

  const handleServiceToggle = (serviceId: string, quantity: number) => {
    setSelectedServices(prev => ({
      ...prev,
      [serviceId]: quantity,
    }));
  };

  const onSubmit = (data: BookingFormData) => {
    const bookingData = {
      ...data,
      serviceSelections: selectedServices,
    };
    createBookingMutation.mutate(bookingData);
  };

  const selectedCount = Object.values(selectedServices).filter(q => q > 0).length;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b">
        <div className="container max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => step === 1 ? setLocation("/dashboard") : setStep(1)}
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {step === 1 ? "Dashboard" : "Zurück"}
            </Button>
            <h1 className="text-xl font-semibold" data-testid="heading-booking">Neue Buchung</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={step === 1 ? "default" : "outline"} data-testid="badge-step-1">
              1. Leistungen
            </Badge>
            <Badge variant={step === 2 ? "default" : "outline"} data-testid="badge-step-2">
              2. Details
            </Badge>
            <Badge variant={step === 3 ? "default" : "outline"} data-testid="badge-step-3">
              3. Prüfen
            </Badge>
          </div>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto px-6 py-8">
        {step === 1 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Leistungen auswählen</h2>
                <p className="text-muted-foreground">
                  Wählen Sie die gewünschten Leistungen aus und geben Sie die Anzahl an
                </p>
              </div>
              {selectedCount > 0 && (
                <Badge variant="secondary" data-testid="badge-selected-count">
                  {selectedCount} {selectedCount === 1 ? "Leistung" : "Leistungen"} ausgewählt
                </Badge>
              )}
            </div>

            {categoryOrder.map((categoryKey) => {
              const categoryServices = servicesByCategory[categoryKey];
              if (!categoryServices || categoryServices.length === 0) return null;

              return (
                <div key={categoryKey} data-testid={`category-${categoryKey}`}>
                  <h3 className="text-xl mb-4">{categoryLabels[categoryKey]}</h3>
                  
                  <div className="space-y-3">
                    {categoryServices.map((service) => {
                      const isDisabled = !service.netPrice;
                      const quantity = selectedServices[service.id] || 0;
                      
                      return (
                        <Card key={service.id} data-testid={`service-${service.serviceCode}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="secondary" data-testid={`code-${service.serviceCode}`}>
                                    {service.serviceCode}
                                  </Badge>
                                  <CardTitle className="text-base">{service.name}</CardTitle>
                                </div>
                                {service.description && (
                                  <CardDescription className="text-sm">{service.description}</CardDescription>
                                )}
                              </div>
                              <div className="shrink-0 text-right">
                                <div className="text-base font-medium" data-testid={`price-${service.serviceCode}`}>
                                  {formatPrice(service.netPrice, service.priceNote)}
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={quantity > 0}
                                disabled={isDisabled}
                                onCheckedChange={(checked) => {
                                  handleServiceToggle(service.id, checked ? 1 : 0);
                                }}
                                data-testid={`checkbox-${service.serviceCode}`}
                              />
                              {!isDisabled && (
                                <div className="flex items-center gap-2">
                                  <label className="text-sm text-muted-foreground">Anzahl:</label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={quantity || ""}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      handleServiceToggle(service.id, val);
                                    }}
                                    className="w-20"
                                    disabled={isDisabled}
                                    data-testid={`input-quantity-${service.serviceCode}`}
                                  />
                                </div>
                              )}
                              {isDisabled && (
                                <span className="text-sm text-muted-foreground">
                                  Preis auf Anfrage - bitte im nächsten Schritt beschreiben
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between pt-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Zwischensumme (netto)</p>
                <p className="text-2xl font-semibold" data-testid="text-subtotal">
                  €{totalEuros.toFixed(2).replace(".", ",")}
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => setStep(2)}
                disabled={selectedCount === 0}
                data-testid="button-continue-step1"
              >
                Weiter
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6">Objektdetails</h2>
            
            <Form {...form}>
              <form className="space-y-6">
                <FormField
                  control={form.control}
                  name="propertyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objektbezeichnung *</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. Musterwohnung Berlin-Mitte" {...field} data-testid="input-property-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="propertyAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Musterstraße 123, 10115 Berlin" 
                          {...field} 
                          data-testid="input-property-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objekttyp</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-property-type">
                            <SelectValue placeholder="Bitte wählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Wohnung">Wohnung</SelectItem>
                          <SelectItem value="Haus">Haus</SelectItem>
                          <SelectItem value="Gewerbe">Gewerbe</SelectItem>
                          <SelectItem value="Grundstück">Grundstück</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="preferredDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wunschtermin</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-preferred-date" />
                        </FormControl>
                        <FormDescription>Optional</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferredTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Uhrzeit</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} data-testid="input-preferred-time" />
                        </FormControl>
                        <FormDescription>Optional</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="specialRequirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Besondere Anforderungen</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Besondere Wünsche, Zugangsinformationen, etc." 
                          rows={4}
                          {...field} 
                          data-testid="input-special-requirements"
                        />
                      </FormControl>
                      <FormDescription>
                        Optional: Beschreiben Sie hier spezielle Anforderungen oder Leistungen "auf Anfrage"
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    data-testid="button-back-step2"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Zurück
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      form.trigger().then((isValid) => {
                        if (isValid) {
                          setStep(3);
                        }
                      });
                    }}
                    data-testid="button-continue-step2"
                  >
                    Weiter zur Prüfung
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6">Buchung prüfen</h2>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Objektinformationen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Objektbezeichnung:</span>
                    <p className="font-medium" data-testid="text-review-property-name">{form.getValues("propertyName")}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Adresse:</span>
                    <p className="font-medium" data-testid="text-review-property-address">{form.getValues("propertyAddress")}</p>
                  </div>
                  {form.getValues("propertyType") && (
                    <div>
                      <span className="text-sm text-muted-foreground">Objekttyp:</span>
                      <p className="font-medium">{form.getValues("propertyType")}</p>
                    </div>
                  )}
                  {form.getValues("preferredDate") && (
                    <div>
                      <span className="text-sm text-muted-foreground">Wunschtermin:</span>
                      <p className="font-medium">
                        {form.getValues("preferredDate")}
                        {form.getValues("preferredTime") && ` um ${form.getValues("preferredTime")}`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ausgewählte Leistungen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(selectedServices)
                      .filter(([, quantity]) => quantity > 0)
                      .map(([serviceId, quantity]) => {
                        const service = services.find(s => s.id === serviceId);
                        if (!service) return null;
                        
                        const subtotal = service.netPrice ? (service.netPrice * quantity) / 100 : 0;
                        
                        return (
                          <div key={serviceId} className="flex items-center justify-between" data-testid={`review-service-${service.serviceCode}`}>
                            <div className="flex-1">
                              <p className="font-medium">{service.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {quantity}x {formatPrice(service.netPrice, service.priceNote)}
                              </p>
                            </div>
                            <p className="font-medium">
                              {subtotal > 0 ? `€${subtotal.toFixed(2).replace(".", ",")}` : "auf Anfrage"}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Zwischensumme (netto)</span>
                      <span data-testid="text-review-subtotal">€{totalEuros.toFixed(2).replace(".", ",")}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">MwSt. (19%)</span>
                      <span data-testid="text-review-tax">€{(totalWithTax - totalEuros).toFixed(2).replace(".", ",")}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-lg font-semibold">
                      <span>Gesamtpreis (brutto)</span>
                      <span data-testid="text-review-total">€{totalWithTax.toFixed(2).replace(".", ",")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  data-testid="button-back-step3"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Zurück
                </Button>
                <Button
                  size="lg"
                  onClick={() => {
                    const formData = form.getValues();
                    formData.serviceSelections = selectedServices;
                    onSubmit(formData);
                  }}
                  disabled={createBookingMutation.isPending}
                  data-testid="button-submit-booking"
                >
                  {createBookingMutation.isPending ? "Wird gesendet..." : "Buchung absenden"}
                  <Check className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
