import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, AlertCircle } from "lucide-react";

interface StaticMapThumbnailProps {
  lat: string | number;
  lng: string | number;
  width?: number;
  height?: number;
  zoom?: number;
  className?: string;
  showAddress?: boolean;
  address?: string;
}

/**
 * Static Map Thumbnail Component
 * 
 * Displays a static satellite image from Google Maps Static API
 * Shows a preview of the property location
 * 
 * Usage:
 * <StaticMapThumbnail 
 *   lat={48.1351}
 *   lng={11.5820}
 *   address="Marienplatz 1, 80331 München"
 * />
 */
export function StaticMapThumbnail({
  lat,
  lng,
  width = 400,
  height = 200,
  zoom = 17,
  className = "",
  showAddress = true,
  address,
}: StaticMapThumbnailProps) {
  const [mapUrl, setMapUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchMapUrl = async () => {
      if (!lat || !lng) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const params = new URLSearchParams({
          lat: lat.toString(),
          lng: lng.toString(),
          width: width.toString(),
          height: height.toString(),
          zoom: zoom.toString(),
        });

        const response = await fetch(`/api/google/static-map?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to generate map');
        }

        const data = await response.json();
        
        if (data.url) {
          setMapUrl(data.url);
        } else {
          throw new Error('No map URL returned');
        }
      } catch (err) {
        console.error('Error fetching static map:', err);
        setError('Karte konnte nicht geladen werden');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMapUrl();
  }, [lat, lng, width, height, zoom]);

  if (!lat || !lng) {
    return null;
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      {isLoading && (
        <Skeleton 
          className="w-full" 
          style={{ height: `${height}px` }} 
        />
      )}

      {error && (
        <Alert variant="destructive" className="m-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2 text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && mapUrl && (
        <div className="relative">
          <img
            src={mapUrl}
            alt={address || "Standortkarte"}
            className="w-full h-auto object-cover"
            style={{ height: `${height}px` }}
            data-testid="img-static-map"
          />
          
          {showAddress && address && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm text-white p-2">
              <div className="flex items-start gap-2 text-xs">
                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{address}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
