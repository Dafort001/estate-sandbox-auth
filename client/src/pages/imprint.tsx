import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

export default function Imprint() {
  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Impressum und Datenschutz"
        description="Rechtliche Informationen und Datenschutzerklärung von PIX.IMMO - Daniel Fortmann, Hamburg."
        path="/impressum"
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
      <article className="py-12 md:py-20">
        <div className="w-full max-w-3xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-8" data-testid="page-title">Impressum und Datenschutz</h1>
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Impressum</h2>
            <p className="mb-2">Verantwortlich gemäß § 5 TMG und § 18 Abs. 2 MStV</p>
            <p className="mb-4">
              <strong>Daniel Fortmann</strong><br />
              Kaiser-Wilhelm-Straße 47<br />
              20355 Hamburg<br />
              Deutschland
            </p>
            <p className="mb-4">
              E-Mail: <a href="mailto:mail@pix.immo" className="text-primary hover:underline">mail@pix.immo</a><br />
              USt-IdNr.: DE117975393
            </p>
            <p className="text-sm text-gray-600 mb-2">
              Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
            <p className="text-sm text-gray-600">
              Plattform der EU-Kommission zur Online-Streitbeilegung (OS): <a href="https://ec.europa.eu/consumers/odr/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr/</a>
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Vorbehalt gemäß § 44b UrhG – Text- und Data-Mining (TDM)</h2>
            <p className="mb-4">
              Pix.immo, vertreten durch Daniel Fortmann, behält sich die Nutzung sämtlicher Inhalte dieser Website zum Zweck des kommerziellen Text- und Data-Minings im Sinne von § 44b UrhG ausdrücklich vor.
            </p>
            <p className="mb-4">
              Für Nutzungslizenzen kontaktieren Sie uns bitte unter: <a href="mailto:mail@pix.immo" className="text-primary hover:underline">mail@pix.immo</a>
            </p>
            <p className="text-sm text-gray-600 italic">
              English translation: Pix.immo, represented by Daniel Fortmann, expressly reserves the right to use all content on this website for the purpose of commercial text and data mining within the meaning of Section 44b of the German Copyright Act (UrhG). For usage licenses, please contact mail@pix.immo.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Datenschutzerklärung</h2>
            
            <div className="prose prose-sm max-w-none">
              <p className="mb-6">
                Wir informieren Sie nachfolgend gemäß Art. 13 DSGVO darüber, wie Ihre personenbezogenen Daten verarbeitet werden, wenn Sie unsere Website besuchen oder unsere Online-Dienste nutzen.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-8">1. Verantwortlicher</h3>
              <p className="mb-4">
                Daniel Fortmann<br />
                Kaiser-Wilhelm-Straße 47<br />
                20355 Hamburg<br />
                Deutschland<br />
                E-Mail: <a href="mailto:mail@pix.immo" className="text-primary hover:underline">mail@pix.immo</a>
              </p>
              <p className="mb-6">Es besteht keine Verpflichtung zur Bestellung eines Datenschutzbeauftragten.</p>

              <h3 className="text-xl font-semibold mb-3 mt-8">2. Allgemeine Datenverarbeitung</h3>
              <p className="mb-4">Beim Aufrufen unserer Website werden automatisch folgende Daten verarbeitet (Server-Logfiles):</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Besuchte Seite oder Datei</li>
                <li>Datum und Uhrzeit des Zugriffs</li>
                <li>Übertragene Datenmenge</li>
                <li>Browsertyp und Version</li>
                <li>Betriebssystem</li>
                <li>Referrer-URL</li>
                <li>IP-Adresse</li>
              </ul>
              <p className="mb-2">Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an Stabilität und Sicherheit).</p>
              <p className="mb-6">Speicherdauer: in der Regel maximal 30 Tage.</p>

              <h3 className="text-xl font-semibold mb-3 mt-8">3. Cookies und lokale Speicherung</h3>
              <p className="mb-4">
                Wir verwenden Cookies und ähnliche Technologien, um grundlegende Funktionen bereitzustellen, Nutzungsstatistiken zu erstellen und die Sicherheit zu gewährleisten.
              </p>
              <p className="mb-4">Rechtsgrundlagen:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Notwendige Cookies: Art. 6 Abs. 1 lit. f DSGVO</li>
                <li>Statistik oder Marketing-Cookies: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung über Cookie-Banner)</li>
              </ul>
              <p className="mb-6">Sie können Cookies im Browser löschen oder blockieren. Einige Funktionen könnten dadurch eingeschränkt sein.</p>

              <h3 className="text-xl font-semibold mb-3 mt-8">8. Rechte der betroffenen Personen</h3>
              <p className="mb-4">Sie haben das Recht auf:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Auskunft (Art. 15 DSGVO)</li>
                <li>Berichtigung (Art. 16 DSGVO)</li>
                <li>Löschung (Art. 17 DSGVO)</li>
                <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
                <li>Widerspruch (Art. 21 DSGVO)</li>
                <li>Widerruf erteilter Einwilligungen (Art. 7 Abs. 3 DSGVO)</li>
              </ul>
              <p className="mb-6">
                Zudem haben Sie das Recht auf Beschwerde bei einer Datenschutzaufsichtsbehörde, z. B. Der Hamburgische Beauftragte für Datenschutz und Informationsfreiheit (HmbBfDI), Ludwig-Erhard-Str. 22, 20459 Hamburg.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-8">13. Kontakt</h3>
              <p className="mb-6">
                Daniel Fortmann<br />
                Kaiser-Wilhelm-Straße 47<br />
                20355 Hamburg<br />
                Deutschland<br />
                E-Mail: <a href="mailto:mail@pix.immo" className="text-primary hover:underline">mail@pix.immo</a>
              </p>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  © 2022–2025 Daniel Fortmann. Alle Rechte vorbehalten.
                </p>
              </div>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
