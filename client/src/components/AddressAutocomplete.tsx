import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Google Maps types (minimal declaration)
declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: any;
        };
      };
    };
  }
}

export interface AddressValidationResult {
  isValid: boolean;
  isRooftop: boolean;
  lat?: string;
  lng?: string;
  placeId?: string;
  formattedAddress?: string;
  locationType?: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onValidated?: (result: AddressValidationResult) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  testId?: string;
}

/**
 * Google Places Autocomplete Component
 * 
 * Provides address autocomplete with validation
 * Requires VITE_GOOGLE_MAPS_API_KEY environment variable
 * 
 * Usage:
 * <AddressAutocomplete 
 *   value={address}
 *   onChange={setAddress}
 *   onValidated={(result) => {
 *     setLat(result.lat);
 *     setLng(result.lng);
 *   }}
 * />
 */
export function AddressAutocomplete({
  value,
  onChange,
  onValidated,
  label = "Adresse",
  placeholder = "Straße, Hausnummer, PLZ, Stadt",
  required = false,
  error,
  disabled = false,
  testId = "input-address",
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [validationResult, setValidationResult] = useState<AddressValidationResult | null>(null);

  // Load Google Maps Script
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn('VITE_GOOGLE_MAPS_API_KEY not configured - Address autocomplete disabled');
      return;
    }

    // Check if script already loaded
    if (window.google?.maps?.places) {
      setIsScriptLoaded(true);
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=de&region=de`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize Autocomplete
  useEffect(() => {
    if (!isScriptLoaded || !inputRef.current || autocompleteRef.current) {
      return;
    }

    try {
      // Create autocomplete instance
      const autocomplete = new window.google!.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'de' }, // Restrict to Germany
        fields: ['formatted_address', 'geometry', 'place_id', 'address_components'],
        types: ['address'], // Only show full addresses
      });

      // Handle place selection
      autocomplete.addListener('place_changed', async () => {
        const place = autocomplete.getPlace();

        if (!place.formatted_address) {
          return;
        }

        // Update input value
        onChange(place.formatted_address);

        // Validate address via backend
        await validateAddress(place.formatted_address);
      });

      autocompleteRef.current = autocomplete;
    } catch (error) {
      console.error('Failed to initialize Google Places Autocomplete:', error);
    }
  }, [isScriptLoaded, onChange]);

  // Validate address via backend API
  const validateAddress = async (address: string) => {
    if (!address || address.trim().length < 5) {
      setValidationStatus('idle');
      setValidationResult(null);
      return;
    }

    setValidationStatus('validating');

    try {
      const response = await apiRequest('POST', '/api/google/geocode', { address });
      const data = await response.json();

      if (data.isValid) {
        setValidationStatus('valid');
        setValidationResult(data);
        
        // Notify parent component
        if (onValidated) {
          onValidated(data);
        }
      } else {
        setValidationStatus('invalid');
        setValidationResult(null);
      }
    } catch (error) {
      console.error('Address validation failed:', error);
      setValidationStatus('invalid');
      setValidationResult(null);
    }
  };

  // Handle manual input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Reset validation when user types manually
    if (validationStatus !== 'idle') {
      setValidationStatus('idle');
      setValidationResult(null);
    }
  };

  // Handle blur - validate if not already validated
  const handleBlur = () => {
    if (value && value.trim().length >= 5 && validationStatus === 'idle') {
      validateAddress(value);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={testId}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          id={testId}
          data-testid={testId}
          type="text"
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9"
        />
      </div>

      {/* Validation Status */}
      {validationStatus === 'validating' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Adresse wird validiert...</span>
        </div>
      )}

      {validationStatus === 'valid' && validationResult && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="ml-2 text-sm text-green-800 dark:text-green-200">
            <div className="flex items-center gap-2">
              <span>Adresse verifiziert</span>
              {validationResult.isRooftop && (
                <Badge variant="secondary" className="text-xs">
                  Exakte Position
                </Badge>
              )}
            </div>
            {validationResult.formattedAddress && (
              <div className="mt-1 text-xs text-green-600 dark:text-green-300">
                {validationResult.formattedAddress}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {validationStatus === 'invalid' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2 text-sm">
            Adresse konnte nicht verifiziert werden. Bitte überprüfen Sie Ihre Eingabe.
          </AlertDescription>
        </Alert>
      )}

      {/* Form error from parent */}
      {error && validationStatus === 'idle' && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* API Key missing warning */}
      {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2 text-sm">
            Google Maps API nicht konfiguriert. Autocomplete ist deaktiviert.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
