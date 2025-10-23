import type { CheckPlugin, CheckResult } from "../types";

export class NamingCheckPlugin implements CheckPlugin {
  id = "naming";
  name = "Naming Policy Check";
  description = "Validates naming policy v3.1, room type taxonomy, and filename patterns";
  enabled = true;

  async run(): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    // Check 1: Room type taxonomy
    results.push(await this.checkRoomTaxonomy());

    // Check 2: Naming policy v3.1 pattern
    results.push(await this.checkNamingPattern());

    // Check 3: Room type synonyms
    results.push(await this.checkRoomSynonyms());

    return results;
  }

  private async checkRoomTaxonomy(): Promise<CheckResult> {
    try {
      // Import room types
      const { ALL_ROOM_TYPES, ROOM_CATEGORIES } = await import("@shared/room-types");

      if (!ALL_ROOM_TYPES || ALL_ROOM_TYPES.length === 0) {
        return {
          id: "naming-room-taxonomy-missing",
          name: "Room Type Taxonomy",
          status: "fail",
          severity: "P0",
          message: "Room type taxonomy not defined",
          autoFixAvailable: false,
          timestamp: new Date().toISOString(),
        };
      }

      if (ALL_ROOM_TYPES.length < 30) {
        return {
          id: "naming-room-taxonomy-incomplete",
          name: "Room Type Taxonomy",
          status: "warning",
          severity: "P2",
          message: "Room type taxonomy appears incomplete",
          details: `Expected 30+ room types, found ${ALL_ROOM_TYPES.length}`,
          autoFixAvailable: false,
          timestamp: new Date().toISOString(),
        };
      }

      const categoryCount = Object.keys(ROOM_CATEGORIES).length;
      if (!ROOM_CATEGORIES || categoryCount !== 3) {
        return {
          id: "naming-room-categories-invalid",
          name: "Room Type Taxonomy",
          status: "warning",
          severity: "P2",
          message: "Room categories configuration is invalid",
          details: `Expected 3 categories (INTERIOR, EXTERIOR, DOCUMENTS), found ${categoryCount}`,
          autoFixAvailable: false,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        id: "naming-room-taxonomy",
        name: "Room Type Taxonomy",
        status: "pass",
        severity: "INFO",
        message: `Room type taxonomy configured (${ALL_ROOM_TYPES.length} types, ${categoryCount} categories)`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        id: "naming-room-taxonomy-error",
        name: "Room Type Taxonomy",
        status: "fail",
        severity: "P0",
        message: "Could not verify room type taxonomy",
        details: `Error: ${error}`,
        autoFixAvailable: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkNamingPattern(): Promise<CheckResult> {
    try {
      const { validateFilenameV31 } = await import("../../fileNaming");

      // Test various naming patterns
      const testCases = [
        { filename: "20251023-ABC123_wohnzimmer_001_v1.jpg", shouldPass: true },
        { filename: "20251023-ABC123_küche_002_v1.jpg", shouldPass: false }, // küche has umlaut
        { filename: "invalid-filename.jpg", shouldPass: false },
        { filename: "20251023_ABC123_wohnzimmer_001_v1.jpg", shouldPass: false }, // wrong separator
      ];

      const failures: string[] = [];

      for (const test of testCases) {
        const result = validateFilenameV31(test.filename);
        const isValid = result !== null;
        if (isValid !== test.shouldPass) {
          failures.push(`${test.filename}: expected ${test.shouldPass ? "pass" : "fail"}, got ${isValid ? "pass" : "fail"}`);
        }
      }

      if (failures.length > 0) {
        return {
          id: "naming-pattern-validation-fail",
          name: "Naming Pattern v3.1",
          status: "fail",
          severity: "P1",
          message: "Naming pattern validation v3.1 test failed",
          details: failures.join("\n"),
          autoFixAvailable: false,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        id: "naming-pattern",
        name: "Naming Pattern v3.1",
        status: "pass",
        severity: "INFO",
        message: "Naming pattern v3.1 validation working correctly",
        details: "Format: {date}-{shootcode}_{room_type}_{index}_v{ver}.jpg",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        id: "naming-pattern-error",
        name: "Naming Pattern v3.1",
        status: "fail",
        severity: "P0",
        message: "Could not verify naming pattern validation",
        details: `Error: ${error}`,
        autoFixAvailable: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkRoomSynonyms(): Promise<CheckResult> {
    try {
      const { ROOM_SYNONYMS } = await import("@shared/room-types");

      if (!ROOM_SYNONYMS || Object.keys(ROOM_SYNONYMS).length === 0) {
        return {
          id: "naming-room-synonyms-missing",
          name: "Room Type Synonyms",
          status: "warning",
          severity: "P2",
          message: "Room type synonyms not defined",
          autoFixAvailable: false,
          timestamp: new Date().toISOString(),
        };
      }

      const totalSynonyms = Object.values(ROOM_SYNONYMS).reduce(
        (sum, synonyms) => sum + synonyms.length,
        0
      );

      if (totalSynonyms < 50) {
        return {
          id: "naming-room-synonyms-incomplete",
          name: "Room Type Synonyms",
          status: "warning",
          severity: "P2",
          message: "Room type synonyms appear incomplete",
          details: `Expected 100+ synonyms, found ${totalSynonyms}`,
          autoFixAvailable: false,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        id: "naming-room-synonyms",
        name: "Room Type Synonyms",
        status: "pass",
        severity: "INFO",
        message: `Room type synonyms configured (${totalSynonyms} synonyms across ${Object.keys(ROOM_SYNONYMS).length} room types)`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        id: "naming-room-synonyms-error",
        name: "Room Type Synonyms",
        status: "warning",
        severity: "P2",
        message: "Could not verify room type synonyms",
        details: `Error: ${error}`,
        autoFixAvailable: false,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
