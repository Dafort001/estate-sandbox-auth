import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Home, Calendar } from "lucide-react";

export default function BookingConfirmation() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const bookingData = sessionStorage.getItem("lastBooking");
    if (!bookingData) {
      setLocation("/dashboard");
    }
  }, [setLocation]);

  const bookingDataStr = sessionStorage.getItem("lastBooking");
  if (!bookingDataStr) {
    return null;
  }

  let bookingData;
  try {
    bookingData = JSON.parse(bookingDataStr);
  } catch (e) {
    console.error("Failed to parse booking data:", e);
    setLocation("/dashboard");
    return null;
  }

  const { booking, items } = bookingData || {};
  
  if (!booking) {
    console.error("No booking data found in sessionStorage");
    setLocation("/dashboard");
    return null;
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-[5vw] py-4">
          <Link href="/">
            <div className="text-base font-semibold tracking-wide cursor-pointer" data-testid="brand-logo">
              PIX.IMMO
            </div>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" data-testid="button-dashboard">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl" data-testid="heading-confirmation">Buchung erfolgreich!</CardTitle>
              <CardDescription>
                Ihre Buchungsanfrage wurde erfolgreich übermittelt.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border bg-muted/50 p-4">
                <h3 className="mb-2 font-semibold">Buchungsdetails</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Objekt:</dt>
                    <dd className="font-medium" data-testid="text-property-name">{booking.propertyName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Adresse:</dt>
                    <dd className="font-medium" data-testid="text-property-address">{booking.propertyAddress}</dd>
                  </div>
                  {booking.propertyType && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Objektart:</dt>
                      <dd className="font-medium">{booking.propertyType}</dd>
                    </div>
                  )}
                  {booking.preferredDate && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Wunschtermin:</dt>
                      <dd className="font-medium">{booking.preferredDate}</dd>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <dt className="text-muted-foreground">Gesamtpreis (netto):</dt>
                    <dd className="text-lg font-semibold" data-testid="text-total-price">
                      {formatCurrency(booking.totalNetPrice)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Status:</dt>
                    <dd className="font-medium text-orange-600">ausstehend</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Erstellt am:</dt>
                    <dd className="text-xs text-muted-foreground">{formatDate(booking.createdAt)}</dd>
                  </div>
                </dl>
              </div>

              {items && items.length > 0 && (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <h3 className="mb-2 font-semibold">Ausgewählte Leistungen</h3>
                  <ul className="space-y-1 text-sm">
                    {items.map((item: any, index: number) => (
                      <li key={index} className="flex justify-between" data-testid={`item-${index}`}>
                        <span className="text-muted-foreground">
                          Leistung (Menge: {item.quantity})
                        </span>
                        <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-blue-900">
                  <Calendar className="h-4 w-4" />
                  Nächste Schritte
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>✓ Wir werden Ihre Anfrage prüfen und uns innerhalb von 24 Stunden bei Ihnen melden.</li>
                  <li>✓ Sie erhalten eine Bestätigung per E-Mail mit allen Details.</li>
                  <li>✓ Nach Terminabsprache erhalten Sie weitere Informationen zum Ablauf.</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Link href="/dashboard" className="flex-1">
                  <Button variant="outline" className="w-full" data-testid="button-back-dashboard">
                    <Home className="mr-2 h-4 w-4" />
                    Zum Dashboard
                  </Button>
                </Link>
                <Link href="/buchen" className="flex-1">
                  <Button className="w-full" data-testid="button-new-booking">
                    <Calendar className="mr-2 h-4 w-4" />
                    Neue Buchung
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
