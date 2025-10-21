import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Camera, ArrowLeft } from "lucide-react";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";

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

const orderSchema = z.object({
  propertyName: z.string().min(1, "Name der Immobilie erforderlich"),
  contactName: z.string().min(2, "Kontaktname muss mindestens 2 Zeichen lang sein"),
  contactEmail: z.string().email("Ungültige E-Mail-Adresse"),
  contactPhone: z.string()
    .min(1, "Telefonnummer erforderlich")
    .refine(isValidGermanPhone, "Ungültige Telefonnummer (z.B. +49 170 1234567 oder 0170 1234567)"),
  propertyAddress: z.string()
    .min(10, "Adresse muss mindestens 10 Zeichen lang sein")
    .refine(
      (addr) => germanPostalCodeRegex.test(addr),
      { message: "Adresse muss eine gültige deutsche Postleitzahl (5 Ziffern) enthalten" }
    ),
  preferredDate: z.string().min(1, "Bevorzugtes Datum erforderlich"),
  notes: z.string().optional(),
});

type OrderData = z.infer<typeof orderSchema>;

type User = {
  id: string;
  email: string;
  role: "client" | "admin";
  createdAt: number;
};

export default function OrderForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["/api/me"],
    queryFn: getQueryFn<{ user: User }>({ on401: "returnNull" }),
  });

  const form = useForm<OrderData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      propertyName: "",
      contactName: "",
      contactEmail: userData?.user?.email || "",
      contactPhone: "",
      propertyAddress: "",
      preferredDate: "",
      notes: "",
    },
  });

  if (!userData && !userLoading) {
    setLocation("/login");
    return null;
  }

  const orderMutation = useMutation({
    mutationFn: async (data: OrderData) => {
      setIsLoading(true);
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Auftrag erstellt",
        description: "Ihr Fotoauftrag wurde erfolgreich übermittelt!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Auftrag fehlgeschlagen",
        description: error.message,
      });
      setIsLoading(false);
    },
  });

  const onSubmit = (data: OrderData) => {
    orderMutation.mutate(data);
  };

  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Camera className="mx-auto mb-4 h-12 w-12 animate-pulse text-primary" />
          <p className="text-muted-foreground">Lädt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center px-6">
          <Link href="/dashboard">
            <Button variant="ghost" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zum Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">Neuer Fotoauftrag</h1>
          <p className="text-muted-foreground">
            Geben Sie die Immobiliendetails ein und wir planen eine professionelle Fotosession
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Immobilieninformationen</CardTitle>
            <CardDescription>
              Bitte geben Sie genaue Details für den besten Service an
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="propertyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name der Immobilie</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="z.B. Luxusvilla Innenstadt"
                          data-testid="input-property-name"
                          {...field}
                        />
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
                      <FormLabel>Adresse der Immobilie</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Musterstraße 123, 12345 Stadt"
                          data-testid="input-property-address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kontaktname</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ihr Name"
                            data-testid="input-contact-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefonnummer</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+49 (123) 456-7890"
                            data-testid="input-contact-phone"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-Mail-Adresse</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="ihre@email.de"
                          data-testid="input-contact-email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bevorzugtes Datum</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          data-testid="input-preferred-date"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Wann möchten Sie die Fotosession?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zusätzliche Notizen (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Besondere Anforderungen oder Details, die wir wissen sollten..."
                          className="min-h-32 resize-none"
                          data-testid="input-notes"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        z.B. bestimmte Räume zu fotografieren, Zugangshinweise, usw.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Link href="/dashboard" className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      data-testid="button-cancel"
                    >
                      Abbrechen
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isLoading}
                    data-testid="button-submit"
                  >
                    {isLoading ? "Wird übermittelt..." : "Auftrag übermitteln"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
