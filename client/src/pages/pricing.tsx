import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Preise und Leistungen"
        description="Professionelle Immobilienfotografie ab 180€. Drohnenaufnahmen, 360°-Touren, Videos und KI-gestützte Bildoptimierung für Hamburg und Berlin."
        path="/preise"
      />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center justify-between px-[5vw] py-4">
          <Link href="/">
            <div className="text-base font-semibold tracking-wide cursor-pointer" data-testid="brand-logo">
              PIX.IMMO
            </div>
          </Link>
          <Link href="/">
            <span
              className="flex items-center gap-2 hover:opacity-70 transition-opacity cursor-pointer"
              data-testid="button-back-home"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm">Zurück</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="py-12 md:py-20">
        <div className="w-full max-w-3xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="page-title">
            Preise und Leistungen
          </h1>
          <p className="text-lg text-gray-700 mb-2">
            Immobilienfotografie Hamburg & Berlin
          </p>
          <p className="text-base text-gray-600 mb-12 leading-relaxed">
            Professionelle Immobilienfotografie, Drohnenaufnahmen, Videos und 360°-Rundgänge für Exposés, Online-Präsentationen und soziale Medien.
            Alle Aufnahmen werden individuell geplant, mit professioneller Ausrüstung umgesetzt und sorgfältig nachbearbeitet.
            Auf Wunsch erfolgt die Optimierung zusätzlich durch ein internes KI-System zur automatischen Licht- und Farbkorrektur.
          </p>

          <div className="space-y-12">
            {/* Immobilienfotografie */}
            <section data-testid="section-photography">
              <h2 className="text-2xl font-semibold mb-3">Immobilienfotografie</h2>
              <p className="text-xl font-medium text-gray-900 mb-4">ab 180 € zzgl. MwSt.</p>
              <ul className="space-y-2 text-gray-700 mb-4">
                <li className="flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Aufnahmen von Innen- und Außenbereichen mit professioneller Kamera- und Lichttechnik</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Auswahl und Bearbeitung der besten Motive</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Lieferung als hochauflösende Dateien, optimiert für Web und Druck</span>
                </li>
              </ul>
              <p className="text-sm text-gray-600 italic">
                Ideal für hochwertige Exposés, Online-Anzeigen und Social-Media-Beiträge.
              </p>
            </section>

            {/* Drohnenaufnahmen */}
            <section data-testid="section-drone">
              <h2 className="text-2xl font-semibold mb-3">Drohnenaufnahmen</h2>
              <p className="text-xl font-medium text-gray-900 mb-1">ab 150 € zzgl. MwSt.</p>
              <p className="text-lg font-medium text-gray-700 mb-4">ab 100 €, wenn Teil eines Fotopakets</p>
              <ul className="space-y-2 text-gray-700 mb-4">
                <li className="flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Außenaufnahmen aus der Luft zur Darstellung von Lage, Grundstück und Umgebung</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Durchführung nach rechtlicher und wetterbedingter Machbarkeit</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Lieferung mehrerer Perspektiven in hoher Auflösung</span>
                </li>
              </ul>
              <p className="text-sm text-gray-600 italic">
                Empfohlen zur Ergänzung klassischer Immobilienfotografie.
              </p>
            </section>

            {/* Videoaufnahmen */}
            <section data-testid="section-video">
              <h2 className="text-2xl font-semibold mb-3">Videoaufnahmen</h2>
              <p className="text-xl font-medium text-gray-900 mb-4">ab 199 € zzgl. MwSt.</p>
              <ul className="space-y-2 text-gray-700 mb-4">
                <li className="flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Kurze Videoclips für Online- und Social-Media-Plattformen</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Kombination aus Boden- und Luftaufnahmen möglich</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Quer- oder Hochformat für Reels, Instagram und YouTube</span>
                </li>
              </ul>
              <p className="text-sm text-gray-600 italic">
                Für Makler, Bauträger und Agenturen, die Immobilien filmisch präsentieren möchten.
              </p>
            </section>

            {/* Virtuelle Rundgänge */}
            <section data-testid="section-360">
              <h2 className="text-2xl font-semibold mb-3">Virtuelle Rundgänge (360°-Touren)</h2>
              <p className="text-xl font-medium text-gray-900 mb-4">ab 100 € zzgl. MwSt.</p>
              <ul className="space-y-2 text-gray-700 mb-4">
                <li className="flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Erstellung von 360°-Aufnahmen und virtuellen Rundgängen für Online-Exposés</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span><strong>Basis-Variante</strong> ab 100 € für die Nutzung in <strong>MLS- und CRM-Systemen</strong> (z. B. FIO, onOffice, Propstack)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span><strong>Erweiterte Variante</strong> ab 239 € mit interaktiver Navigation, Grundriss-Verknüpfung und optionalem Hosting für sechs Monate</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Lieferung in Formaten, die für gängige Maklersoftware und Portale geeignet sind</span>
                </li>
              </ul>
              <p className="text-sm text-gray-600 italic">
                Diese Leistung eignet sich ideal zur Integration in Exposés, Immobilienportale oder Kunden-Galerien.
              </p>
            </section>

            {/* Virtuelles Staging */}
            <section data-testid="section-staging">
              <h2 className="text-2xl font-semibold mb-3">Virtuelles Staging</h2>
              <p className="text-xl font-medium text-gray-900 mb-4">auf Anfrage</p>
              <p className="text-gray-700 mb-4">
                Virtuelles Staging wird ausschließlich auf Basis eines individuellen Briefings und Moodboards angeboten.
                Die Preisgestaltung richtet sich nach Raumgröße, Stilrichtung und gewünschtem Detailgrad.
              </p>
              <p className="text-sm text-gray-600 italic">
                Ideal für leerstehende oder renovierungsbedürftige Objekte.
              </p>
            </section>

            {/* Bildoptimierung */}
            <section data-testid="section-retouching">
              <h2 className="text-2xl font-semibold mb-3">Bildoptimierung und KI-Retusche</h2>
              <p className="text-xl font-medium text-gray-900 mb-4">ab 3,90 € pro Bild zzgl. MwSt.</p>
              <ul className="space-y-2 text-gray-700 mb-4">
                <li className="flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Anpassung von Farben, Kontrast und Belichtung</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Entfernen kleiner Objekte oder störender Elemente</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Optional automatische Optimierung über internes KI-System</span>
                </li>
              </ul>
              <p className="text-sm text-gray-600 italic">
                Für eine harmonische, natürliche Bildwirkung.
              </p>
            </section>

            {/* Anfahrt */}
            <section data-testid="section-travel">
              <h2 className="text-2xl font-semibold mb-3">Anfahrt und Geltungsbereich</h2>
              <p className="text-gray-700 mb-4">
                Unsere Leistungen werden im Großraum Hamburg und Berlin angeboten.
                Die Anfahrt ist innerhalb von <strong>30 Kilometern um Hamburg</strong> sowie <strong>innerhalb des Berliner S-Bahn-Rings</strong> im Preis enthalten.
              </p>
              <p className="text-gray-700 mb-4">
                Für weiter entfernte Objekte werden <strong>0,80 € pro gefahrenem Kilometer</strong> (Hin- und Rückweg) berechnet.
                Zusätzliche Reisezeiten oder Übernachtungen werden <strong>nach Absprache</strong> vereinbart.
              </p>
              <p className="text-gray-700">
                Bei größeren Projekten oder mehreren Objekten pro Termin erfolgt die Berechnung individuell und transparent nach Aufwand.
              </p>
            </section>

            {/* Anfrage und Buchung */}
            <section data-testid="section-booking" className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold mb-3">Anfrage und Buchung</h2>
              <p className="text-gray-700 mb-4">
                Für ein individuelles Angebot oder zur direkten Buchung nutzen Sie bitte den{" "}
                <Link href="/login">
                  <span className="font-semibold text-black hover:underline cursor-pointer" data-testid="link-login">
                    Kunden-Login
                  </span>
                </Link>
                {" "}oder das{" "}
                <Link href="/kontakt">
                  <span className="font-semibold text-black hover:underline cursor-pointer" data-testid="link-contact">
                    Kontaktformular
                  </span>
                </Link>
                {" "}auf unserer Webseite.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
