import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, Plus, LogOut, Image as ImageIcon, ListOrdered } from "lucide-react";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: string;
  email: string;
  role: "client" | "admin";
  createdAt: number;
};

type Order = {
  id: string;
  userId: string;
  propertyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  propertyAddress: string;
  preferredDate: string;
  notes: string | null;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: number;
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["/api/me"],
    queryFn: getQueryFn<{ user: User }>({ on401: "returnNull" }),
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: getQueryFn<{ orders: Order[] }>({ on401: "returnNull" }),
    enabled: !!userData,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "See you next time!",
      });
      setLocation("/");
    },
  });

  if (!userData && !userLoading) {
    setLocation("/login");
    return null;
  }

  if (userLoading || !userData) {
    return (
      <div className="min-h-screen bg-muted/30">
        <header className="border-b bg-background">
          <div className="container mx-auto flex h-16 items-center justify-between px-6">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
        </header>
        <div className="container mx-auto px-6 py-12">
          <Skeleton className="mb-8 h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  const user = userData.user;
  const orders = ordersData?.orders || [];

  const getStatusBadgeVariant = (status: Order["status"]) => {
    switch (status) {
      case "completed":
        return "default";
      case "confirmed":
        return "secondary";
      case "pending":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/">
            <div className="flex items-center gap-2 hover-elevate active-elevate-2 cursor-pointer px-3 py-2 rounded-lg">
              <Camera className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">pix.immo</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/gallery">
              <Button variant="ghost" data-testid="button-gallery">
                <ImageIcon className="mr-2 h-4 w-4" />
                Gallery
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={() => logoutMutation.mutate()}
              data-testid="button-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="mb-2 text-3xl font-bold" data-testid="text-welcome">
              Welcome back, {user.email}
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">Your Dashboard</p>
              <Badge variant="outline" data-testid="badge-role">
                {user.role === "admin" ? "Admin" : "Client"}
              </Badge>
            </div>
          </div>
          <Link href="/order">
            <Button size="lg" data-testid="button-new-order">
              <Plus className="mr-2 h-5 w-5" />
              New Order
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <ListOrdered className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold">
              {user.role === "admin" ? "All Orders" : "Your Orders"}
            </h2>
          </div>

          {ordersLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ListOrdered className="mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-semibold">No orders yet</h3>
                <p className="mb-6 text-center text-muted-foreground">
                  Start by creating your first property photography order
                </p>
                <Link href="/order">
                  <Button data-testid="button-create-first-order">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Order
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {orders.map((order) => (
                <Card key={order.id} data-testid={`card-order-${order.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate">{order.propertyName}</CardTitle>
                        <CardDescription className="truncate">
                          {order.propertyAddress}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={getStatusBadgeVariant(order.status)}
                        data-testid={`badge-status-${order.id}`}
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Contact: </span>
                        <span>{order.contactName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone: </span>
                        <span>{order.contactPhone}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date: </span>
                        <span>{order.preferredDate}</span>
                      </div>
                      {order.notes && (
                        <div className="pt-2 border-t">
                          <span className="text-muted-foreground">Notes: </span>
                          <p className="mt-1 text-xs line-clamp-2">{order.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
