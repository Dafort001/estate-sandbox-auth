import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";

const jobFormSchema = z.object({
  customerName: z.string().min(1, "Kundenname erforderlich"),
  propertyName: z.string().min(1, "Objektname erforderlich"),
  propertyAddress: z.string().min(1, "Objektadresse erforderlich"),
  deliverGallery: z.boolean().default(true),
  deliverAlttext: z.boolean().default(true),
  deliverExpose: z.boolean().default(true),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

export default function DemoUpload() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      customerName: "",
      propertyName: "",
      propertyAddress: "",
      deliverGallery: true,
      deliverAlttext: true,
      deliverExpose: true,
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: JobFormValues) => {
      const response = await apiRequest("POST", "/api/jobs", data);
      return response.json();
    },
    onSuccess: (job: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Job erstellt",
        description: `Job #${job.jobNumber} erfolgreich erstellt.`,
      });
      // Redirect to job detail page
      setLocation(`/job/${job.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Job konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: JobFormValues) => {
    createJobMutation.mutate(data);
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="w-6 h-6 text-primary" data-testid="icon-upload" />
            <CardTitle>Neuer Job - Demo Modus</CardTitle>
          </div>
          <CardDescription>
            Erstellen Sie einen Demo-Job. Das System generiert automatisch Beispielbilder, Captions und Exposé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kundenname</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="z.B. Immobilien Schmidt GmbH"
                        data-testid="input-customer-name"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Name des auftraggebenden Kunden
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="propertyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objektname</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="z.B. Penthouse Stadtpark"
                        data-testid="input-property-name"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Bezeichnung der Immobilie
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="propertyAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objektadresse</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="z.B. Musterstraße 123, 10115 Berlin"
                        data-testid="input-property-address"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Vollständige Adresse der Immobilie
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel>Deliverables</FormLabel>
                <FormField
                  control={form.control}
                  name="deliverGallery"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-gallery"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Bildergalerie</FormLabel>
                        <FormDescription>
                          Optimierte Bilder für Web-Galerie
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliverAlttext"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-alttext"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Alt-Texte (Captions)</FormLabel>
                        <FormDescription>
                          KI-generierte Bildbeschreibungen in Deutsch
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliverExpose"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-expose"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Exposé</FormLabel>
                        <FormDescription>
                          KI-generierte Objektbeschreibung mit Highlights
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createJobMutation.isPending}
                data-testid="button-create-job"
              >
                {createJobMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Job wird erstellt...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Demo-Job erstellen
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
