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

const orderSchema = z.object({
  propertyName: z.string().min(1, "Property name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().min(1, "Contact phone is required"),
  propertyAddress: z.string().min(1, "Property address is required"),
  preferredDate: z.string().min(1, "Preferred date is required"),
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
        title: "Order created",
        description: "Your photography order has been submitted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Order failed",
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
          <p className="text-muted-foreground">Loading...</p>
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
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">New Photography Order</h1>
          <p className="text-muted-foreground">
            Fill in the property details and we'll schedule a professional photography session
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Property Information</CardTitle>
            <CardDescription>
              Please provide accurate details for the best service
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
                      <FormLabel>Property Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Luxury Villa Downtown"
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
                      <FormLabel>Property Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123 Main Street, City, State, ZIP"
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
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your name"
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
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+1 (555) 123-4567"
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
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
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
                      <FormLabel>Preferred Session Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          data-testid="input-preferred-date"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        When would you like the photography session?
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
                      <FormLabel>Additional Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any special requirements or details we should know..."
                          className="min-h-32 resize-none"
                          data-testid="input-notes"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        E.g., specific rooms to photograph, access instructions, etc.
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
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isLoading}
                    data-testid="button-submit"
                  >
                    {isLoading ? "Submitting..." : "Submit Order"}
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
