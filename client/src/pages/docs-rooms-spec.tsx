import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, FileText, FileJson, Keyboard, Tag, Hash } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

interface RoomTypeData {
  roomTypes: string[];
  byCategory: Record<string, string[]>;
  withMeta: Array<{
    id: string;
    label: string;
    category: string;
    description: string;
    examples: string[];
  }>;
  synonyms: Record<string, string>;
  categories: Array<{ id: string; label: string; description: string }>;
  shortcuts: Record<string, string>;
  version: string;
}

export default function DocsRoomsSpec() {
  const { data, isLoading } = useQuery<RoomTypeData>({
    queryKey: ["/api/roomtypes"],
  });

  const handleDownloadTxt = () => {
    if (!data) return;
    
    let content = `# pix.immo Raumtypen-Taxonomie ${data.version}\n`;
    content += `# Generiert am ${new Date().toLocaleDateString("de-DE")}\n\n`;
    
    data.categories.forEach((category) => {
      content += `## ${category.label}\n`;
      content += `${category.description}\n\n`;
      
      const roomsInCategory = data.byCategory[category.id] || [];
      roomsInCategory.forEach((roomId) => {
        const room = data.withMeta.find((r) => r.id === roomId);
        if (room) {
          content += `### ${room.label} (${room.id})\n`;
          content += `${room.description}\n`;
          if (room.examples.length > 0) {
            content += `Beispiele: ${room.examples.join(", ")}\n`;
          }
          content += `\n`;
        }
      });
      content += `\n`;
    });
    
    // Add keyboard shortcuts section
    content += `## Tastatur-Shortcuts\n\n`;
    Object.entries(data.shortcuts).forEach(([key, roomId]) => {
      const room = data.withMeta.find((r) => r.id === roomId);
      if (room) {
        content += `${key} → ${room.label}\n`;
      }
    });
    
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pix-immo-raumtypen-${data.version}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    if (!data) return;
    
    const jsonData = {
      version: data.version,
      generatedAt: new Date().toISOString(),
      categories: data.categories,
      roomTypes: data.withMeta,
      shortcuts: data.shortcuts,
      synonyms: data.synonyms,
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { 
      type: "application/json;charset=utf-8" 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pix-immo-raumtypen-${data.version}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Lade Raumtypen-Taxonomie...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Fehler beim Laden der Raumtypen</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Raumtypen-Spezifikation | pix.immo Dokumentation"
        description="Vollständige Dokumentation der Raumtypen-Taxonomie für die pix.immo Plattform. Enthält 30+ Raumtypen, Kategorien, Beispiele und Tastatur-Shortcuts."
      />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-semibold tracking-tight">
                    Raumtypen-Spezifikation
                  </h1>
                  <Badge variant="secondary" className="text-xs">
                    {data.version}
                  </Badge>
                </div>
                <p className="text-muted-foreground max-w-2xl">
                  Vollständige Dokumentation der Raumtypen-Taxonomie für die pix.immo Plattform.
                  Verwendet für Dateinamen-Konventionen, Klassifizierung und QA-Automation.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTxt}
                  data-testid="button-download-txt"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  .txt
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadJson}
                  data-testid="button-download-json"
                >
                  <FileJson className="h-4 w-4 mr-2" />
                  .json
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium">Kategorien</CardDescription>
                <CardTitle className="text-2xl">{data.categories.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium">Raumtypen</CardDescription>
                <CardTitle className="text-2xl">{data.roomTypes.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium">Synonyme</CardDescription>
                <CardTitle className="text-2xl">{Object.keys(data.synonyms).length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium">Shortcuts</CardDescription>
                <CardTitle className="text-2xl">{Object.keys(data.shortcuts).length}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Categories with Room Types */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Raumtypen nach Kategorien</h2>
            </div>

            {data.categories.map((category) => {
              const roomsInCategory = data.byCategory[category.id] || [];
              
              return (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{category.label}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {roomsInCategory.map((roomId) => {
                      const room = data.withMeta.find((r) => r.id === roomId);
                      if (!room) return null;
                      
                      // Find keyboard shortcut for this room
                      const shortcutKey = Object.entries(data.shortcuts).find(
                        ([_, id]) => id === roomId
                      )?.[0];
                      
                      return (
                        <div key={room.id} className="space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                                  {room.id}
                                </code>
                                <span className="font-medium">{room.label}</span>
                                {shortcutKey && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Keyboard className="h-3 w-3 mr-1" />
                                    {shortcutKey}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {room.description}
                              </p>
                              {room.examples.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {room.examples.map((example, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className="text-xs font-normal"
                                    >
                                      {example}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          {roomsInCategory.indexOf(roomId) < roomsInCategory.length - 1 && (
                            <Separator className="mt-4" />
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Keyboard Shortcuts Reference */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Tastatur-Shortcuts</CardTitle>
              </div>
              <CardDescription>
                Schnellzugriff auf häufig verwendete Raumtypen während der Klassifizierung
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(data.shortcuts)
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([key, roomId]) => {
                    const room = data.withMeta.find((r) => r.id === roomId);
                    if (!room) return null;
                    
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-2 p-2 rounded-lg border bg-card hover-elevate"
                      >
                        <Badge variant="secondary" className="text-sm font-mono w-8 justify-center">
                          {key}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">
                            {room.label}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {room.id}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Usage Example */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Naming Policy v3.1</CardTitle>
              </div>
              <CardDescription>
                Dateinamen-Konvention für bearbeitete Bilder
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                {"{"}<span className="text-primary">date</span>{"}"}-
                {"{"}<span className="text-primary">shootcode</span>{"}_"}
                {"{"}<span className="text-primary">room_type</span>{"}_"}
                {"{"}<span className="text-primary">index</span>{"}_v"}
                {"{"}<span className="text-primary">ver</span>{"}"}.jpg
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Beispiele:</p>
                <div className="space-y-1 text-sm font-mono">
                  <div className="bg-muted/50 px-3 py-2 rounded">
                    <span className="text-muted-foreground">20250115-ABC123_liv_001_v1.jpg</span>
                  </div>
                  <div className="bg-muted/50 px-3 py-2 rounded">
                    <span className="text-muted-foreground">20250115-ABC123_kit_001_v1.jpg</span>
                  </div>
                  <div className="bg-muted/50 px-3 py-2 rounded">
                    <span className="text-muted-foreground">20250115-ABC123_bed_001_v2.jpg</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="text-sm space-y-2">
                <p className="font-medium">Komponenten:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">date</code> – ISO 8601 Format (YYYYMMDD)</li>
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">shootcode</code> – Eindeutiger Shoot-Identifier (6 Zeichen, alphanumerisch)</li>
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">room_type</code> – Raumtyp-ID aus Taxonomie (z.B. liv, kit, bed)</li>
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">index</code> – Fortlaufende Nummer (001-999)</li>
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">ver</code> – Versions-Nummer für Überarbeitungen (v1, v2, ...)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="border-t mt-12">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p>
                pix.immo Raumtypen-Taxonomie {data.version}
              </p>
              <p>
                Generiert am {new Date().toLocaleDateString("de-DE")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
