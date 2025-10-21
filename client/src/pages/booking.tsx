import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Check, AlertCircle } from "lucide-react";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import type { AddressValidationResult } from "@/components/AddressAutocomplete";
import { StaticMapThumbnail } from "@/components/StaticMapThumbnail";

// Service types matching JSON structure
interface ServiceData {
  code: string;
  category: string;
  title: string;
  description: string;
  price_net: number | null;
  unit: "flat" | "per_item" | "per_km" | "range" | "from";
  price_range?: string;
  price_from?: string;
  notes: string;
}

interface ServiceCatalog {
  services: ServiceData[];
  meta: {
    currency: string;
    vat_rate: number;
    last_updated: string;
  };
}

// Validation patterns
const germanPostalCodeRegex = /\b\d{5}\b/;

// Phone validation: extract digits and check if valid German number
function isValidGermanPhone(phone: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('49')) {
    return digits.length >= 11 && digits.length <= 15;
  }
  if (digits.startsWith('0')) {
    return digits.length >= 10 && digits.length <= 14;
  }
  return false;
}

const bookingSchema = z.object({
  region: z.enum(["HH", "B", "EXT"], { required_error: "Region erforderlich" }),
  kilometers: z.number().int().min(0).optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email("Ungültige E-Mail").optional().or(z.literal("")),
  contactMobile: z.string()
    .min(1, "Mobilnummer erforderlich")
    .refine(isValidGermanPhone, "Ungültige Mobilnummer (z.B. +49 170 1234567 oder 0170 1234567)"),
  propertyName: z.string().min(1, "Objektbezeichnung erforderlich"),
  propertyAddress: z.string()
    .optional()
    .refine(
      (addr) => !addr || addr.length === 0 || addr.length >= 10,
      { message: "Adresse muss mindestens 10 Zeichen lang sein" }
    )
    .refine(
      (addr) => !addr || addr.length === 0 || germanPostalCodeRegex.test(addr),
      { message: "Adresse muss eine gültige Postleitzahl (5 Ziffern) enthalten" }
    ),
  // Google Maps verified address data (hidden fields)
  addressLat: z.string().optional(),
  addressLng: z.string().optional(),
  addressPlaceId: z.string().optional(),
  addressFormatted: z.string().optional(),
  propertyType: z.string().optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  specialRequirements: z.string().optional(),
  agbAccepted: z.boolean().refine((val) => val === true, {
    message: "AGB müssen akzeptiert werden",
  }),
  serviceSelections: z.record(z.number().min(0)),
}).refine((data) => {
  // If region is EXT, kilometers must be provided and > 0
  if (data.region === "EXT") {
    return data.kilometers !== undefined && data.kilometers > 0;
  }
  return true;
}, {
  message: "Kilometer erforderlich für erweiterte Anfahrt (EXT)",
  path: ["kilometers"],
}).refine((data) => {
  // At least one service must be selected with quantity > 0
  return Object.values(data.serviceSelections).some(qty => qty > 0);
}, {
  message: "Mindestens ein Service muss ausgewählt werden",
  path: ["serviceSelections"],
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

const regionLabels: Record<string, string> = {
  HH: "Hamburg (bis 30 km)",
  B: "Berlin (S-Bahn-Ring)",
  EXT: "Erweiterte Anfahrt"
};

function formatPrice(priceNet: number | null, unit: string, priceRange?: string, priceFrom?: string): string {
  if (priceRange) return priceRange;
  if (priceFrom) return priceFrom;
  if (priceNet === null) return "auf Anfrage";
  
  if (unit === "per_km") {
    return `€${priceNet.toFixed(2).replace(".", ",")}/km`;
  }
  if (unit === "per_item") {
    return `€${priceNet.toFixed(2).replace(".", ",")}/Stück`;
  }
  
  return `€${priceNet.toFixed(2).replace(".", ",")}`;
}

export default function Booking() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});
  const [services, setServices] = useState<ServiceCatalog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load services from API
  useEffect(() => {
    fetch("/api/services")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data: ServiceCatalog) => {
        setServices(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load services:", error);
        toast({
          variant: "destructive",
          title: "Fehler",
          description: "Preisliste konnte nicht geladen werden",
        });
        setIsLoading(false);
      });
  }, [toast]);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      region: undefined,
      kilometers: undefined,
      contactName: "",
      contactEmail: "",
      contactMobile: "",
      propertyName: "",
      propertyAddress: "",
      addressLat: "",
      addressLng: "",
      addressPlaceId: "",
      addressFormatted: "",
      propertyType: "",
      preferredDate: "",
      preferredTime: "",
      specialRequirements: "",
      agbAccepted: false,
      serviceSelections: {},
    },
  });

  const watchRegion = form.watch("region");
  const watchKilometers = form.watch("kilometers");

  const createOrderMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      // Prepare order payload matching requirements
      const items = Object.entries(selectedServices)
        .filter(([, qty]) => qty > 0)
        .map(([code, qty]) => {
          const service = services?.services.find(s => s.code === code);
          return {
            code,
            unit: service?.unit || "flat",
            qty,
          };
        });

      const orderPayload = {
        region: data.region,
        kilometers: data.region === "EXT" ? data.kilometers : undefined,
        contact: {
          name: data.contactName || undefined,
          email: data.contactEmail || undefined,
          mobile: data.contactMobile,
        },
        propertyName: data.propertyName,
        propertyAddress: data.propertyAddress,
        // Google Maps verified address data
        addressLat: data.addressLat,
        addressLng: data.addressLng,
        addressPlaceId: data.addressPlaceId,
        addressFormatted: data.addressFormatted,
        propertyType: data.propertyType,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        specialRequirements: data.specialRequirements,
        agbAccepted: data.agbAccepted,
        items,
      };

      const response = await apiRequest("POST", "/api/orders", orderPayload);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      sessionStorage.setItem("lastOrder", JSON.stringify(data));
      toast({
        title: "Bestellung erfolgreich",
        description: "Ihre Bestellung wurde übermittelt. Sie erhalten in Kürze eine SMS-Bestätigung.",
      });
      setLocation("/booking-confirmation");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: error.message || "Bestellung konnte nicht erstellt werden",
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

  if (!services || !services.services || !Array.isArray(services.services)) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <p className="text-muted-foreground">Preisliste konnte nicht geladen werden</p>
          <Button onClick={() => setLocation("/dashboard")} className="mt-4">
            Zurück zum Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const servicesByCategory = services.services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, ServiceData[]>);

  const calculateTotal = () => {
    let total = 0;
    Object.entries(selectedServices).forEach(([code, quantity]) => {
      if (quantity > 0) {
        const service = services.services.find(s => s.code === code);
        if (service && service.price_net !== null) {
          if (service.unit === "per_km") {
            // For AEX: km × 2 (round trip) × price
            const km = watchKilometers || 0;
            total += km * 2 * service.price_net;
          } else if (service.unit === "per_item") {
            total += service.price_net * quantity;
          } else {
            // flat
            total += service.price_net;
          }
        }
      }
    });
    return total;
  };

  const totalNet = calculateTotal();
  const vatAmount = totalNet * 0.19;
  const totalGross = totalNet + vatAmount;

  const handleServiceToggle = (code: string, quantity: number) => {
    setSelectedServices(prev => {
      const updated = {
        ...prev,
        [code]: quantity,
      };
      // Sync to form state for validation
      form.setValue("serviceSelections", updated, { shouldValidate: true });
      return updated;
    });
  };

  const onSubmit = (data: BookingFormData) => {
    createOrderMutation.mutate(data);
  };

  const selectedCount = Object.values(selectedServices).filter(q => q > 0).length;

  // Filter out AEX for HH/B regions
  const isAEXHidden = watchRegion === "HH" || watchRegion === "B";

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b">
        <div className="container max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => step === 1 ? setLocation("/dashboard") : setStep(step - 1)}
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {step === 1 ? "Dashboard" : "Zurück"}
            </Button>
            <h1 className="text-xl font-semibold" data-testid="heading-booking">Neue Bestellung</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={step === 1 ? "default" : "outline"} 
              data-testid="badge-step-1"
              className={step > 1 ? "cursor-pointer hover-elevate" : ""}
              onClick={() => step > 1 && setStep(1)}
            >
              1. Leistungen
            </Badge>
            <Badge 
              variant={step === 2 ? "default" : "outline"} 
              data-testid="badge-step-2"
              className={step !== 2 ? "cursor-pointer hover-elevate" : ""}
              onClick={() => {
                // Can only go to step 2 if step 1 is valid
                if (step === 1 && selectedCount > 0 && watchRegion) {
                  setStep(2);
                } else if (step > 2) {
                  setStep(2);
                }
              }}
            >
              2. Details
            </Badge>
            <Badge 
              variant={step === 3 ? "default" : "outline"} 
              data-testid="badge-step-3"
              className={step !== 3 ? "cursor-not-allowed opacity-50" : ""}
            >
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
                  Wählen Sie zunächst Ihre Region, dann die gewünschten Leistungen
                </p>
              </div>
              {selectedCount > 0 && (
                <Badge variant="secondary" data-testid="badge-selected-count">
                  {selectedCount} {selectedCount === 1 ? "Leistung" : "Leistungen"} ausgewählt
                </Badge>
              )}
            </div>

            {/* Region Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Region auswählen *</CardTitle>
                <CardDescription>
                  Die Region bestimmt die Anfahrtskosten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  {(["HH", "B", "EXT"] as const).map((region) => (
                    <Card
                      key={region}
                      className={`cursor-pointer hover-elevate active-elevate-2 ${
                        watchRegion === region ? "border-primary" : ""
                      }`}
                      onClick={() => {
                        form.setValue("region", region);
                        // Clear AEX selection if switching away from EXT
                        if (region !== "EXT" && selectedServices["AEX"]) {
                          const newSelections = { ...selectedServices };
                          delete newSelections["AEX"];
                          setSelectedServices(newSelections);
                          form.setValue("kilometers", undefined);
                        }
                      }}
                      data-testid={`card-region-${region}`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 h-4 w-4 rounded-full border-2 ${
                            watchRegion === region 
                              ? "border-primary bg-primary" 
                              : "border-muted-foreground"
                          }`} />
                          <div className="flex-1">
                            <p className="font-medium">{regionLabels[region]}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {region === "HH" && "Anfahrt inkl. bis 30 km"}
                              {region === "B" && "Anfahrt inkl. innerhalb S-Bahn-Ring"}
                              {region === "EXT" && "€0.80/km (Hin- und Rückweg)"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Kilometer input for EXT region */}
                {watchRegion === "EXT" && (
                  <div className="mt-4">
                    <Label htmlFor="kilometers">Kilometer (einfache Strecke) *</Label>
                    <Input
                      id="kilometers"
                      type="number"
                      min="0"
                      placeholder="z.B. 42"
                      value={watchKilometers || ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        form.setValue("kilometers", val);
                      }}
                      className="mt-2"
                      data-testid="input-kilometers"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Hin- und Rückweg werden automatisch berechnet (× 2)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Selection */}
            {watchRegion && categoryOrder.map((categoryKey) => {
              const categoryServices = servicesByCategory[categoryKey];
              if (!categoryServices || categoryServices.length === 0) return null;

              return (
                <div key={categoryKey} data-testid={`category-${categoryKey}`}>
                  <h3 className="text-xl mb-4">{categoryLabels[categoryKey]}</h3>
                  
                  <div className="space-y-3">
                    {categoryServices.map((service) => {
                      // Hide AEX for HH/B regions
                      if (service.code === "AEX" && isAEXHidden) {
                        return null;
                      }

                      const isDisabled = service.price_net === null && service.unit !== "per_km";
                      const quantity = selectedServices[service.code] || 0;
                      
                      return (
                        <Card key={service.code} data-testid={`service-${service.code}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="secondary" data-testid={`code-${service.code}`}>
                                    {service.code}
                                  </Badge>
                                  <CardTitle className="text-base">{service.title}</CardTitle>
                                </div>
                                {service.description && (
                                  <CardDescription className="text-sm">{service.description}</CardDescription>
                                )}
                              </div>
                              <div className="shrink-0 text-right">
                                <div className="text-base font-medium" data-testid={`price-${service.code}`}>
                                  {formatPrice(service.price_net, service.unit, service.price_range, service.price_from)}
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
                                  handleServiceToggle(service.code, checked ? 1 : 0);
                                }}
                                data-testid={`checkbox-${service.code}`}
                              />
                              {service.unit === "per_km" ? (
                                // Special handling for AEX (auto-calculate based on km)
                                <div className="text-sm text-muted-foreground">
                                  {watchKilometers 
                                    ? `${watchKilometers} km × 2 (Hin/Rück) = ${watchKilometers * 2} km × €${service.price_net?.toFixed(2)} = €${((watchKilometers || 0) * 2 * (service.price_net || 0)).toFixed(2)}`
                                    : "Bitte Kilometer oben eingeben"
                                  }
                                </div>
                              ) : (
                                <>
                                  {!isDisabled && service.unit !== "flat" && (
                                    <div className="flex items-center gap-2">
                                      <label className="text-sm text-muted-foreground">Anzahl:</label>
                                      <Input
                                        type="number"
                                        min="0"
                                        value={quantity || ""}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value) || 0;
                                          handleServiceToggle(service.code, val);
                                        }}
                                        className="w-20"
                                        disabled={isDisabled}
                                        data-testid={`input-quantity-${service.code}`}
                                      />
                                    </div>
                                  )}
                                  {isDisabled && (
                                    <span className="text-sm text-muted-foreground">
                                      Preis auf Anfrage - bitte im nächsten Schritt beschreiben
                                    </span>
                                  )}
                                </>
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
                  €{totalNet.toFixed(2).replace(".", ",")}
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => {
                  if (!watchRegion) {
                    toast({
                      variant: "destructive",
                      title: "Region erforderlich",
                      description: "Bitte wählen Sie zunächst eine Region aus",
                    });
                    return;
                  }
                  if (watchRegion === "EXT" && !watchKilometers) {
                    toast({
                      variant: "destructive",
                      title: "Kilometer erforderlich",
                      description: "Bitte geben Sie die Kilometer ein",
                    });
                    return;
                  }
                  setStep(2);
                }}
                disabled={selectedCount === 0 || !watchRegion}
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
            <h2 className="text-2xl font-semibold mb-6">Kontakt & Objektdetails</h2>
            
            <Form {...form}>
              <form className="space-y-6">
                {/* Contact Fields */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Kontaktdaten</h3>
                  
                  <FormField
                    control={form.control}
                    name="contactMobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobilnummer *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+49 170 1234567" 
                            {...field} 
                            data-testid="input-contact-mobile" 
                          />
                        </FormControl>
                        <FormDescription>
                          Sie erhalten eine SMS-Bestätigung
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Max Mustermann (optional)" 
                            {...field} 
                            data-testid="input-contact-name" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-Mail</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="max@example.com (optional)" 
                            {...field} 
                            data-testid="input-contact-email" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Property Fields */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Objektinformationen</h3>

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
                        <FormControl>
                          <AddressAutocomplete
                            value={field.value || ""}
                            onChange={field.onChange}
                            onValidated={(result: AddressValidationResult) => {
                              // Store validated address data in hidden fields
                              form.setValue("addressLat", result.lat || "", { shouldValidate: true, shouldDirty: true });
                              form.setValue("addressLng", result.lng || "", { shouldValidate: true, shouldDirty: true });
                              form.setValue("addressPlaceId", result.placeId || "", { shouldValidate: true, shouldDirty: true });
                              form.setValue("addressFormatted", result.formattedAddress || "", { shouldValidate: true, shouldDirty: true });
                            }}
                            label="Adresse (optional)"
                            placeholder="Straße, Hausnummer, PLZ, Stadt"
                            testId="input-property-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Hidden fields for Google Maps data */}
                  <FormField control={form.control} name="addressLat" render={({ field }) => <input type="hidden" {...field} />} />
                  <FormField control={form.control} name="addressLng" render={({ field }) => <input type="hidden" {...field} />} />
                  <FormField control={form.control} name="addressPlaceId" render={({ field }) => <input type="hidden" {...field} />} />
                  <FormField control={form.control} name="addressFormatted" render={({ field }) => <input type="hidden" {...field} />} />

                  {/* Static Map Preview - shown when address is validated */}
                  {form.watch("addressLat") && form.watch("addressLng") && (
                    <StaticMapThumbnail
                      lat={form.watch("addressLat") || ""}
                      lng={form.watch("addressLng") || ""}
                      address={form.watch("addressFormatted") || form.watch("propertyAddress") || ""}
                      showAddress={true}
                      className="mt-2"
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Objekttyp</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-property-type">
                              <SelectValue placeholder="Bitte wählen (optional)" />
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
                </div>

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
                      form.trigger(["contactMobile", "propertyName"]).then((isValid) => {
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
            <h2 className="text-2xl font-semibold mb-6">Bestellung prüfen</h2>
            
            <Form {...form}>
              <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Kontaktinformationen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Mobilnummer:</span>
                    <p className="font-medium" data-testid="text-review-mobile">{form.getValues("contactMobile")}</p>
                  </div>
                  {form.getValues("contactName") && (
                    <div>
                      <span className="text-sm text-muted-foreground">Name:</span>
                      <p className="font-medium">{form.getValues("contactName")}</p>
                    </div>
                  )}
                  {form.getValues("contactEmail") && (
                    <div>
                      <span className="text-sm text-muted-foreground">E-Mail:</span>
                      <p className="font-medium">{form.getValues("contactEmail")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Objektinformationen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Region:</span>
                    <p className="font-medium" data-testid="text-review-region">
                      {regionLabels[watchRegion as keyof typeof regionLabels]}
                      {watchRegion === "EXT" && watchKilometers && ` (${watchKilometers} km einfache Strecke)`}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Objektbezeichnung:</span>
                    <p className="font-medium" data-testid="text-review-property-name">{form.getValues("propertyName")}</p>
                  </div>
                  {form.getValues("propertyAddress") && (
                    <div>
                      <span className="text-sm text-muted-foreground">Adresse:</span>
                      <p className="font-medium" data-testid="text-review-property-address">{form.getValues("propertyAddress")}</p>
                    </div>
                  )}
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
                      .map(([code, quantity]) => {
                        const service = services.services.find(s => s.code === code);
                        if (!service) return null;
                        
                        let subtotal = 0;
                        if (service.price_net) {
                          if (service.unit === "per_km") {
                            const km = watchKilometers || 0;
                            subtotal = km * 2 * service.price_net;
                          } else if (service.unit === "per_item") {
                            subtotal = service.price_net * quantity;
                          } else {
                            subtotal = service.price_net;
                          }
                        }
                        
                        return (
                          <div key={code} className="flex items-center justify-between" data-testid={`review-service-${service.code}`}>
                            <div className="flex-1">
                              <p className="font-medium">{service.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {service.unit === "per_km" 
                                  ? `${watchKilometers} km × 2 (Hin/Rück) × ${formatPrice(service.price_net, service.unit)}`
                                  : `${quantity}x ${formatPrice(service.price_net, service.unit, service.price_range, service.price_from)}`
                                }
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
                      <span data-testid="text-review-subtotal">€{totalNet.toFixed(2).replace(".", ",")}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">MwSt. (19%)</span>
                      <span data-testid="text-review-tax">€{vatAmount.toFixed(2).replace(".", ",")}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-lg font-semibold">
                      <span>Gesamtpreis (brutto)</span>
                      <span data-testid="text-review-total">€{totalGross.toFixed(2).replace(".", ",")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AGB Checkbox */}
              <Card>
                <CardContent className="pt-6">
                  <FormField
                    control={form.control}
                    name="agbAccepted"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-agb"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Ich akzeptiere die AGB und Datenschutzbestimmungen *
                          </FormLabel>
                          <FormDescription>
                            <a href="/agb" target="_blank" className="underline hover:text-primary">
                              AGB lesen
                            </a>
                            {" · "}
                            <a href="/impressum" target="_blank" className="underline hover:text-primary">
                              Datenschutz
                            </a>
                          </FormDescription>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
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
                    form.handleSubmit(
                      (data) => {
                        onSubmit(data);
                      },
                      (errors) => {
                        console.error("Form validation failed:", errors);
                        toast({
                          variant: "destructive",
                          title: "Formularfehler",
                          description: "Bitte überprüfen Sie Ihre Eingaben. Es gibt Validierungsfehler.",
                        });
                      }
                    )();
                  }}
                  disabled={createOrderMutation.isPending || !form.getValues("agbAccepted")}
                  data-testid="button-submit-order"
                >
                  {createOrderMutation.isPending ? "Wird gesendet..." : "Bestellung absenden"}
                  <Check className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}
