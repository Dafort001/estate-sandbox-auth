/**
 * Raum-Taxonomie für pix.immo
 * Version: 3.1
 * Stand: 2025-10-23
 * 
 * Definiert alle zulässigen Raumtypen für Immobilienfotografie
 * inkl. Synonym-Mapping und Validierung
 */

// ==================== KATEGORIEN ====================

export const ROOM_CATEGORIES = {
  INTERIOR: 'interior',
  EXTERIOR: 'exterior',
  DOCUMENTS: 'documents',
} as const;

export type RoomCategory = typeof ROOM_CATEGORIES[keyof typeof ROOM_CATEGORIES];

// ==================== RAUMTYPEN ====================

/**
 * Innenräume
 */
export const INTERIOR_ROOMS = [
  'wohnzimmer',
  'schlafzimmer',
  'kinderzimmer',
  'gästezimmer',
  'esszimmer',
  'küche',
  'bad',
  'duschbad',
  'gäste_wc',
  'wc_separat',
  'arbeitszimmer',
  'ankleide',
  'flur',
  'diele',
  'treppenhaus',
  'hobbyraum',
  'hauswirtschaftsraum',
  'abstellraum',
  'keller',
  'dachboden',
] as const;

/**
 * Außenbereiche & Umfeld
 */
export const EXTERIOR_ROOMS = [
  'balkon',
  'terrasse',
  'garten',
  'außenansicht',
  'eingangsbereich',
  'stellplatz',
  'garage',
  'carport',
  'umgebung',
  'aussicht',
] as const;

/**
 * Dokumente & Sonstiges
 */
export const DOCUMENT_ROOMS = [
  'grundriss',
  'lageplan',
  'technikraum',
  'undefined_space',
] as const;

/**
 * Alle Raumtypen kombiniert
 */
export const ALL_ROOM_TYPES = [
  ...INTERIOR_ROOMS,
  ...EXTERIOR_ROOMS,
  ...DOCUMENT_ROOMS,
] as const;

export type RoomType = typeof ALL_ROOM_TYPES[number];

/**
 * Standard-Fallback für nicht klassifizierte Räume
 */
export const DEFAULT_ROOM_TYPE: RoomType = 'undefined_space';

// ==================== SYNONYM-MAPPING ====================

/**
 * Synonym-Mapping für flexible Eingabe
 * Key = Synonym, Value = offizieller Raumtyp
 */
export const ROOM_SYNONYMS: Record<string, RoomType> = {
  // Wohnzimmer
  'living': 'wohnzimmer',
  'livingroom': 'wohnzimmer',
  'living_room': 'wohnzimmer',
  'wohn': 'wohnzimmer',
  'salon': 'wohnzimmer',
  
  // Schlafzimmer
  'bedroom': 'schlafzimmer',
  'bed_room': 'schlafzimmer',
  'schlaf': 'schlafzimmer',
  'masterbedroom': 'schlafzimmer',
  
  // Kinderzimmer
  'kids': 'kinderzimmer',
  'kids_room': 'kinderzimmer',
  'kinder': 'kinderzimmer',
  'child_room': 'kinderzimmer',
  
  // Gästezimmer
  'guest': 'gästezimmer',
  'guest_room': 'gästezimmer',
  'gast': 'gästezimmer',
  
  // Esszimmer
  'dining': 'esszimmer',
  'dining_room': 'esszimmer',
  'ess': 'esszimmer',
  
  // Küche
  'kitchen': 'küche',
  'cook': 'küche',
  'kueche': 'küche',
  
  // Badezimmer
  'bathroom': 'bad',
  'bath': 'bad',
  'badezimmer': 'bad',
  
  // Duschbad
  'shower': 'duschbad',
  'shower_room': 'duschbad',
  'dusche': 'duschbad',
  
  // Gäste-WC
  'guesttoilet': 'gäste_wc',
  'guest_toilet': 'gäste_wc',
  'guest_wc': 'gäste_wc',
  'gast_wc': 'gäste_wc',
  
  // WC separat
  'toilet': 'wc_separat',
  'wc': 'wc_separat',
  'restroom': 'wc_separat',
  
  // Arbeitszimmer
  'office': 'arbeitszimmer',
  'home_office': 'arbeitszimmer',
  'study': 'arbeitszimmer',
  'büro': 'arbeitszimmer',
  'buero': 'arbeitszimmer',
  
  // Ankleide
  'walkin': 'ankleide',
  'walk_in': 'ankleide',
  'wardrobe': 'ankleide',
  'garderobe': 'ankleide',
  
  // Flur
  'hallway': 'flur',
  'corridor': 'flur',
  'gang': 'flur',
  
  // Diele
  'entrance_hall': 'diele',
  'eingang': 'diele',
  
  // Treppenhaus
  'staircase': 'treppenhaus',
  'stairs': 'treppenhaus',
  'treppe': 'treppenhaus',
  
  // Hobbyraum
  'hobby': 'hobbyraum',
  'hobby_room': 'hobbyraum',
  'recreation': 'hobbyraum',
  
  // Hauswirtschaftsraum
  'utility': 'hauswirtschaftsraum',
  'utility_room': 'hauswirtschaftsraum',
  'laundry': 'hauswirtschaftsraum',
  
  // Abstellraum
  'storage': 'abstellraum',
  'storage_room': 'abstellraum',
  'abstell': 'abstellraum',
  
  // Keller
  'basement': 'keller',
  'cellar': 'keller',
  
  // Dachboden
  'attic': 'dachboden',
  'loft': 'dachboden',
  
  // Balkon
  'balcony': 'balkon',
  
  // Terrasse
  'terrace': 'terrasse',
  'patio': 'terrasse',
  
  // Garten
  'garden': 'garten',
  'yard': 'garten',
  
  // Außenansicht
  'exterior': 'außenansicht',
  'outside': 'außenansicht',
  'aussen': 'außenansicht',
  
  // Eingangsbereich
  'entrance': 'eingangsbereich',
  'entry': 'eingangsbereich',
  
  // Stellplatz
  'parking': 'stellplatz',
  'parkplatz': 'stellplatz',
  
  // Garage
  'car_garage': 'garage',
  
  // Carport
  'car_port': 'carport',
  
  // Umgebung
  'surroundings': 'umgebung',
  'environment': 'umgebung',
  
  // Aussicht
  'view': 'aussicht',
  
  // Grundriss
  'floorplan': 'grundriss',
  'floor_plan': 'grundriss',
  'plan': 'grundriss',
  
  // Lageplan
  'siteplan': 'lageplan',
  'site_plan': 'lageplan',
  'lage': 'lageplan',
  
  // Technikraum
  'technical': 'technikraum',
  'technical_room': 'technikraum',
  'technik': 'technikraum',
  
  // Undefined
  'unknown': 'undefined_space',
  'other': 'undefined_space',
  'sonstiges': 'undefined_space',
  'undefined': 'undefined_space',
};

// ==================== KATEGORIEZUORDNUNG ====================

/**
 * Mapping: Raumtyp → Kategorie
 */
export const ROOM_TO_CATEGORY: Record<RoomType, RoomCategory> = {
  // Interior
  wohnzimmer: ROOM_CATEGORIES.INTERIOR,
  schlafzimmer: ROOM_CATEGORIES.INTERIOR,
  kinderzimmer: ROOM_CATEGORIES.INTERIOR,
  gästezimmer: ROOM_CATEGORIES.INTERIOR,
  esszimmer: ROOM_CATEGORIES.INTERIOR,
  küche: ROOM_CATEGORIES.INTERIOR,
  bad: ROOM_CATEGORIES.INTERIOR,
  duschbad: ROOM_CATEGORIES.INTERIOR,
  gäste_wc: ROOM_CATEGORIES.INTERIOR,
  wc_separat: ROOM_CATEGORIES.INTERIOR,
  arbeitszimmer: ROOM_CATEGORIES.INTERIOR,
  ankleide: ROOM_CATEGORIES.INTERIOR,
  flur: ROOM_CATEGORIES.INTERIOR,
  diele: ROOM_CATEGORIES.INTERIOR,
  treppenhaus: ROOM_CATEGORIES.INTERIOR,
  hobbyraum: ROOM_CATEGORIES.INTERIOR,
  hauswirtschaftsraum: ROOM_CATEGORIES.INTERIOR,
  abstellraum: ROOM_CATEGORIES.INTERIOR,
  keller: ROOM_CATEGORIES.INTERIOR,
  dachboden: ROOM_CATEGORIES.INTERIOR,
  
  // Exterior
  balkon: ROOM_CATEGORIES.EXTERIOR,
  terrasse: ROOM_CATEGORIES.EXTERIOR,
  garten: ROOM_CATEGORIES.EXTERIOR,
  außenansicht: ROOM_CATEGORIES.EXTERIOR,
  eingangsbereich: ROOM_CATEGORIES.EXTERIOR,
  stellplatz: ROOM_CATEGORIES.EXTERIOR,
  garage: ROOM_CATEGORIES.EXTERIOR,
  carport: ROOM_CATEGORIES.EXTERIOR,
  umgebung: ROOM_CATEGORIES.EXTERIOR,
  aussicht: ROOM_CATEGORIES.EXTERIOR,
  
  // Documents
  grundriss: ROOM_CATEGORIES.DOCUMENTS,
  lageplan: ROOM_CATEGORIES.DOCUMENTS,
  technikraum: ROOM_CATEGORIES.DOCUMENTS,
  undefined_space: ROOM_CATEGORIES.DOCUMENTS,
};

// ==================== DISPLAY NAMES ====================

/**
 * Deutsche Anzeigenamen (für UI)
 */
export const ROOM_DISPLAY_NAMES: Record<RoomType, string> = {
  wohnzimmer: 'Wohnzimmer',
  schlafzimmer: 'Schlafzimmer',
  kinderzimmer: 'Kinderzimmer',
  gästezimmer: 'Gästezimmer',
  esszimmer: 'Esszimmer',
  küche: 'Küche',
  bad: 'Badezimmer',
  duschbad: 'Duschbad',
  gäste_wc: 'Gäste-WC',
  wc_separat: 'WC (separat)',
  arbeitszimmer: 'Arbeitszimmer',
  ankleide: 'Ankleide',
  flur: 'Flur',
  diele: 'Diele',
  treppenhaus: 'Treppenhaus',
  hobbyraum: 'Hobbyraum',
  hauswirtschaftsraum: 'Hauswirtschaftsraum',
  abstellraum: 'Abstellraum',
  keller: 'Keller',
  dachboden: 'Dachboden',
  balkon: 'Balkon',
  terrasse: 'Terrasse',
  garten: 'Garten',
  außenansicht: 'Außenansicht',
  eingangsbereich: 'Eingangsbereich',
  stellplatz: 'Stellplatz',
  garage: 'Garage',
  carport: 'Carport',
  umgebung: 'Umgebung',
  aussicht: 'Aussicht',
  grundriss: 'Grundriss',
  lageplan: 'Lageplan',
  technikraum: 'Technikraum',
  undefined_space: 'Nicht klassifiziert',
};

// ==================== VALIDIERUNG & HELPERS ====================

/**
 * Prüft, ob ein String ein gültiger Raumtyp ist
 */
export function isValidRoomType(value: string): value is RoomType {
  return ALL_ROOM_TYPES.includes(value as RoomType);
}

/**
 * Normalisiert einen Raumtyp (inkl. Synonym-Auflösung)
 * @param input - Eingabe (kann Synonym sein)
 * @returns Offizieller Raumtyp oder DEFAULT_ROOM_TYPE
 */
export function normalizeRoomType(input: string): RoomType {
  const normalized = input.toLowerCase().trim().replace(/\s+/g, '_');
  
  // Direkt gültig?
  if (isValidRoomType(normalized)) {
    return normalized;
  }
  
  // Synonym?
  const synonym = ROOM_SYNONYMS[normalized];
  if (synonym) {
    return synonym;
  }
  
  // Fallback
  return DEFAULT_ROOM_TYPE;
}

/**
 * Gibt die Kategorie eines Raumtyps zurück
 */
export function getRoomCategory(roomType: RoomType): RoomCategory {
  return ROOM_TO_CATEGORY[roomType];
}

/**
 * Gibt den Display-Namen eines Raumtyps zurück
 */
export function getRoomDisplayName(roomType: RoomType): string {
  return ROOM_DISPLAY_NAMES[roomType];
}

/**
 * Gruppiert alle Raumtypen nach Kategorie
 */
export function getRoomsByCategory(): Record<RoomCategory, RoomType[]> {
  return {
    [ROOM_CATEGORIES.INTERIOR]: [...INTERIOR_ROOMS],
    [ROOM_CATEGORIES.EXTERIOR]: [...EXTERIOR_ROOMS],
    [ROOM_CATEGORIES.DOCUMENTS]: [...DOCUMENT_ROOMS],
  };
}

/**
 * Gibt alle Raumtypen mit Display-Namen und Kategorie zurück
 */
export function getAllRoomsWithMeta() {
  return ALL_ROOM_TYPES.map(roomType => ({
    id: roomType,
    name: getRoomDisplayName(roomType),
    category: getRoomCategory(roomType),
  }));
}

// ==================== KEYBOARD SHORTCUTS ====================

/**
 * Tastatur-Shortcuts für schnelle Klassifizierung (1-0)
 * Mapping: Taste → Raumtyp
 */
export const KEYBOARD_SHORTCUTS: Record<string, RoomType> = {
  '1': 'wohnzimmer',
  '2': 'schlafzimmer',
  '3': 'küche',
  '4': 'bad',
  '5': 'esszimmer',
  '6': 'balkon',
  '7': 'terrasse',
  '8': 'garten',
  '9': 'außenansicht',
  '0': 'undefined_space',
};

/**
 * Reverse Mapping: Raumtyp → Tastatur-Shortcut
 */
export const SHORTCUTS_REVERSE: Record<RoomType, string | undefined> = Object.entries(KEYBOARD_SHORTCUTS)
  .reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
  }, {} as Record<RoomType, string | undefined>);

/**
 * Gibt den Shortcut für einen Raumtyp zurück (falls vorhanden)
 */
export function getShortcutForRoom(roomType: RoomType): string | undefined {
  return SHORTCUTS_REVERSE[roomType];
}
