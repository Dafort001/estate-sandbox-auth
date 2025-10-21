/**
 * Google Maps API Integration
 * 
 * Provides:
 * 1. Address Geocoding & Validation (Places API / Geocoding API)
 * 2. Static Map Thumbnail Generation (Maps Static API)
 * 
 * Required Environment Variables:
 * - GOOGLE_MAPS_API_KEY (server-side key)
 */

// Google Geocoding API Response Types
export interface GeocodingResult {
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    location_type: 'ROOFTOP' | 'RANGE_INTERPOLATED' | 'GEOMETRIC_CENTER' | 'APPROXIMATE';
    viewport: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
  };
  place_id: string;
  types: string[];
}

export interface AddressValidationResult {
  isValid: boolean;
  isRooftop: boolean;
  lat?: string;
  lng?: string;
  placeId?: string;
  formattedAddress?: string;
  locationType?: string;
  error?: string;
}

/**
 * Geocode an address using Google Geocoding API
 * @param address - The address to geocode
 * @returns Geocoding results or null if failed
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult[] | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error('GOOGLE_MAPS_API_KEY not configured');
    return null;
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', address);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('region', 'de'); // Bias results to Germany
    url.searchParams.set('language', 'de'); // Return German results

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return data.results as GeocodingResult[];
    }

    console.error('Geocoding failed:', data.status, data.error_message);
    return null;
  } catch (error) {
    console.error('Geocoding API error:', error);
    return null;
  }
}

/**
 * Validate an address and check if it has rooftop-level accuracy
 * @param address - The address to validate
 * @returns Validation result with coordinates if valid
 */
export async function validateAddress(address: string): Promise<AddressValidationResult> {
  const results = await geocodeAddress(address);

  if (!results || results.length === 0) {
    return {
      isValid: false,
      isRooftop: false,
      error: 'Address could not be found',
    };
  }

  // Use the first (best) result
  const result = results[0];
  const isRooftop = result.geometry.location_type === 'ROOFTOP';

  return {
    isValid: true,
    isRooftop,
    lat: result.geometry.location.lat.toString(),
    lng: result.geometry.location.lng.toString(),
    placeId: result.place_id,
    formattedAddress: result.formatted_address,
    locationType: result.geometry.location_type,
  };
}

/**
 * Generate a Google Static Maps URL for a thumbnail
 * @param lat - Latitude
 * @param lng - Longitude
 * @param options - Optional configuration
 * @returns Static map image URL
 */
export function getStaticMapUrl(
  lat: number | string,
  lng: number | string,
  options: {
    width?: number;
    height?: number;
    zoom?: number;
    mapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
    markerColor?: string;
  } = {}
): string {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('GOOGLE_MAPS_API_KEY not configured');
    return '';
  }

  const {
    width = 400,
    height = 200,
    zoom = 17,
    mapType = 'satellite',
    markerColor = 'red',
  } = options;

  const url = new URL('https://maps.googleapis.com/maps/api/staticmap');
  url.searchParams.set('center', `${lat},${lng}`);
  url.searchParams.set('zoom', zoom.toString());
  url.searchParams.set('size', `${width}x${height}`);
  url.searchParams.set('maptype', mapType);
  url.searchParams.set('markers', `color:${markerColor}|${lat},${lng}`);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('scale', '2'); // Retina display support

  return url.toString();
}

/**
 * Validate address with Place Autocomplete API (alternative method)
 * This would be used if you want to use Place Autocomplete service
 * instead of Geocoding API for validation
 */
export async function getPlaceDetails(placeId: string): Promise<GeocodingResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('GOOGLE_MAPS_API_KEY not configured');
    return null;
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('fields', 'address_components,formatted_address,geometry,place_id,types');
    url.searchParams.set('language', 'de');

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      return data.result as GeocodingResult;
    }

    console.error('Place Details failed:', data.status, data.error_message);
    return null;
  } catch (error) {
    console.error('Place Details API error:', error);
    return null;
  }
}
