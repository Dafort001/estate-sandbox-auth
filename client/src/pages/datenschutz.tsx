import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

export default function Datenschutz() {
  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Datenschutzerklärung"
        description="Datenschutzerklärung von PIX.IMMO. Informationen zur Datenverarbeitung, KI-Bildoptimierung und Ihren Rechten gemäß DSGVO."
        path="/datenschutz"
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
            Datenschutzerklärung
          </h1>
          <p className="text-sm text-gray-600 mb-12">
            Stand: Oktober 2025
          </p>

          <div className="space-y-8 text-gray-700">
            {/* 1. Verantwortlicher */}
            <section data-testid="section-responsible">
              <h2 className="text-2xl font-semibold mb-3 text-black">1. Verantwortlicher</h2>
              <p className="mb-2">
                Verantwortlich für die Datenverarbeitung auf dieser Website ist:
              </p>
              <p className="mb-2">
                <strong>PIX.IMMO</strong><br />
                Daniel Fortmann<br />
                Hamburg
              </p>
              <p>
                Kontakt: Siehe <Link href="/impressum"><span className="underline cursor-pointer">Impressum</span></Link>
              </p>
            </section>

            {/* 2. Allgemeine Hinweise */}
            <section data-testid="section-general">
              <h2 className="text-2xl font-semibold mb-3 text-black">2. Allgemeine Hinweise zur Datenverarbeitung</h2>
              <p className="mb-4">
                Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
              </p>
              <p>
                Die Nutzung unserer Website ist in der Regel ohne Angabe personenbezogener Daten möglich. Soweit auf unseren Seiten personenbezogene Daten (beispielsweise Name, Anschrift oder E-Mail-Adressen) erhoben werden, erfolgt dies, soweit möglich, stets auf freiwilliger Basis.
              </p>
            </section>

            {/* 3. Erhebung und Speicherung */}
            <section data-testid="section-data-collection">
              <h2 className="text-2xl font-semibold mb-3 text-black">3. Erhebung und Speicherung personenbezogener Daten</h2>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">3.1 Websitebesuch</h3>
              <p className="mb-4">
                Bei jedem Aufruf unserer Website erfasst unser System automatisiert Daten und Informationen vom Computersystem des aufrufenden Rechners. Folgende Daten werden dabei erhoben:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Informationen über den Browsertyp und die verwendete Version</li>
                <li>Das Betriebssystem des Nutzers</li>
                <li>Die IP-Adresse des Nutzers</li>
                <li>Datum und Uhrzeit des Zugriffs</li>
                <li>Websites, von denen das System des Nutzers auf unsere Website gelangt</li>
              </ul>
              <p className="mb-4">
                Die Daten werden in den Logfiles unseres Systems gespeichert. Eine Speicherung dieser Daten zusammen mit anderen personenbezogenen Daten des Nutzers findet nicht statt.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">3.2 Registrierung und Kundenlogin</h3>
              <p className="mb-4">
                Bei der Registrierung für unseren Kundenbereich erheben wir folgende Daten:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>E-Mail-Adresse</li>
                <li>Passwort (verschlüsselt gespeichert)</li>
                <li>Optional: Name, Telefonnummer, Unternehmensname</li>
              </ul>
              <p>
                Diese Daten werden zur Durchführung des Vertragsverhältnisses und zur Bereitstellung unserer Dienstleistungen benötigt. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">3.3 Kontaktformular und E-Mail-Kontakt</h3>
              <p className="mb-4">
                Bei der Nutzung unseres Kontaktformulars oder bei Kontaktaufnahme per E-Mail werden Ihre Angaben zur Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">3.4 Buchung von Fotografieleistungen</h3>
              <p className="mb-4">
                Bei der Buchung unserer Leistungen über das Kundenportal erheben wir:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Immobilienadresse und -details</li>
                <li>Kontaktdaten (Name, E-Mail, Telefonnummer)</li>
                <li>Wunschtermin und besondere Anforderungen</li>
                <li>Ausgewählte Leistungspakete</li>
              </ul>
              <p>
                Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
              </p>
            </section>

            {/* 4. Bildverarbeitung und KI-Systeme */}
            <section data-testid="section-ai-processing" className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold mb-3 text-black">4. Bildverarbeitung mit KI-Systemen (wichtiger Hinweis)</h2>
              
              <h3 className="text-xl font-semibold mb-2 mt-4">4.1 Automatische Bildoptimierung</h3>
              <p className="mb-4">
                Zur Optimierung der von uns erstellten Immobilienfotos nutzen wir teilweise automatisierte KI-Systeme zur Bildanalyse, Beschriftung (Captioning) und Nachbearbeitung.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">4.2 Verarbeitung außerhalb der EU</h3>
              <p className="mb-4 font-semibold">
                Wichtig: Die KI-gestützte Bildverarbeitung erfolgt teilweise über externe Dienstleister mit Servern außerhalb der Europäischen Union.
              </p>
              <p className="mb-4">
                Konkret werden folgende Dienste eingesetzt:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  <strong>Modal Labs</strong> (USA) – für KI-basierte Bildanalyse und automatische Bildbeschreibungen
                </li>
                <li>
                  <strong>Replicate</strong> (USA) – für erweiterte KI-Retusche und Bildoptimierung
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">4.3 Anonymisierung und Datenschutzmaßnahmen</h3>
              <p className="mb-4">
                Um Ihre Privatsphäre zu schützen, werden folgende Maßnahmen ergriffen:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  <strong>Keine personenbezogenen Metadaten:</strong> Vor der Verarbeitung werden alle EXIF-Daten und GPS-Koordinaten aus den Bildern entfernt
                </li>
                <li>
                  <strong>Anonyme Verarbeitung:</strong> Die KI-Systeme erhalten nur die Bilddateien selbst, ohne Informationen über Kunden, Adressen oder Immobilien
                </li>
                <li>
                  <strong>Keine dauerhafte Speicherung:</strong> Die Bilder werden nach der Verarbeitung automatisch auf den externen Servern gelöscht
                </li>
                <li>
                  <strong>Verschlüsselte Übertragung:</strong> Alle Datenübertragungen erfolgen über sichere HTTPS/TLS-Verbindungen
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">4.4 Rechtsgrundlage und Einwilligung</h3>
              <p className="mb-4">
                Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an effizienter Leistungserbringung).
              </p>
              <p className="mb-4">
                Sollten Sie der Nutzung von KI-Systemen zur Bildoptimierung widersprechen, teilen Sie uns dies bitte vor der Auftragserteilung mit. In diesem Fall erfolgt die Bildbearbeitung ausschließlich manuell, was zu längeren Bearbeitungszeiten führen kann.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">4.5 Nur für PIX.IMMO-Produktionen</h3>
              <p>
                Die KI-gestützte Retusche über unser Kundenportal steht ausschließlich für Bilder zur Verfügung, die von PIX.IMMO erstellt wurden. Extern erstellte Bilder werden nicht verarbeitet.
              </p>
            </section>

            {/* 5. Cookies */}
            <section data-testid="section-cookies">
              <h2 className="text-2xl font-semibold mb-3 text-black">5. Cookies</h2>
              <p className="mb-4">
                Unsere Website verwendet Cookies. Cookies sind kleine Textdateien, die auf Ihrem Endgerät gespeichert werden und die Ihr Browser speichert.
              </p>
              <h3 className="text-xl font-semibold mb-2">5.1 Technisch notwendige Cookies</h3>
              <p className="mb-4">
                Wir verwenden Cookies, um unsere Website nutzerfreundlicher zu gestalten. Einige Elemente unserer Website erfordern es, dass der aufrufende Browser auch nach einem Seitenwechsel identifiziert werden kann (Session-Cookies für die Anmeldung).
              </p>
              <p>
                Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Funktionsfähigkeit der Website).
              </p>
            </section>

            {/* 6. Weitergabe von Daten */}
            <section data-testid="section-data-sharing">
              <h2 className="text-2xl font-semibold mb-3 text-black">6. Weitergabe von Daten an Dritte</h2>
              <p className="mb-4">
                Eine Übermittlung Ihrer persönlichen Daten an Dritte zu anderen als den im Folgenden aufgeführten Zwecken findet nicht statt. Wir geben Ihre persönlichen Daten nur an Dritte weiter, wenn:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Sie Ihre nach Art. 6 Abs. 1 S. 1 lit. a DSGVO ausdrückliche Einwilligung dazu erteilt haben</li>
                <li>Die Weitergabe nach Art. 6 Abs. 1 S. 1 lit. f DSGVO zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen erforderlich ist</li>
                <li>Eine gesetzliche Verpflichtung zur Weitergabe besteht</li>
              </ul>
              <p>
                Dienstleister, die wir im Rahmen der Auftragsverarbeitung einsetzen (z.B. Hosting, E-Mail-Versand), werden vertraglich verpflichtet, Ihre Daten ausschließlich nach unseren Weisungen zu verarbeiten.
              </p>
            </section>

            {/* 7. Speicherdauer */}
            <section data-testid="section-storage-duration">
              <h2 className="text-2xl font-semibold mb-3 text-black">7. Speicherdauer</h2>
              <p className="mb-4">
                Wir speichern Ihre personenbezogenen Daten nur so lange, wie dies für die Erfüllung der Zwecke erforderlich ist, für die sie erhoben wurden, oder wie es gesetzliche Aufbewahrungsfristen vorsehen.
              </p>
              <p>
                Nach Beendigung des Vertragsverhältnisses werden Ihre Daten unter Beachtung steuer- und handelsrechtlicher Aufbewahrungsfristen gespeichert und nach Ablauf dieser Fristen gelöscht, sofern Sie nicht ausdrücklich in eine weitere Nutzung eingewilligt haben.
              </p>
            </section>

            {/* 8. Ihre Rechte */}
            <section data-testid="section-rights">
              <h2 className="text-2xl font-semibold mb-3 text-black">8. Ihre Rechte als betroffene Person</h2>
              <p className="mb-4">
                Sie haben folgende Rechte:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Auskunftsrecht (Art. 15 DSGVO):</strong> Sie können Auskunft über Ihre von uns verarbeiteten personenbezogenen Daten verlangen</li>
                <li><strong>Recht auf Berichtigung (Art. 16 DSGVO):</strong> Sie können die Berichtigung unrichtiger Daten verlangen</li>
                <li><strong>Recht auf Löschung (Art. 17 DSGVO):</strong> Sie können die Löschung Ihrer Daten verlangen, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen</li>
                <li><strong>Recht auf Einschränkung (Art. 18 DSGVO):</strong> Sie können die Einschränkung der Verarbeitung verlangen</li>
                <li><strong>Recht auf Datenübertragbarkeit (Art. 20 DSGVO):</strong> Sie können die Herausgabe Ihrer Daten in einem strukturierten Format verlangen</li>
                <li><strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie können der Verarbeitung Ihrer Daten widersprechen</li>
                <li><strong>Beschwerderecht:</strong> Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren</li>
              </ul>
            </section>

            {/* 9. Datensicherheit */}
            <section data-testid="section-security">
              <h2 className="text-2xl font-semibold mb-3 text-black">9. Datensicherheit</h2>
              <p className="mb-4">
                Wir verwenden innerhalb des Website-Besuchs das verbreitete SSL-Verfahren (Secure Socket Layer) in Verbindung mit der jeweils höchsten Verschlüsselungsstufe, die von Ihrem Browser unterstützt wird.
              </p>
              <p>
                Unsere Mitarbeiter und alle an der Datenverarbeitung beteiligten Personen sind zur Wahrung der Vertraulichkeit und zur Einhaltung der datenschutzrechtlichen Bestimmungen verpflichtet.
              </p>
            </section>

            {/* 10. Änderungen */}
            <section data-testid="section-changes">
              <h2 className="text-2xl font-semibold mb-3 text-black">10. Änderungen dieser Datenschutzerklärung</h2>
              <p>
                Wir behalten uns vor, diese Datenschutzerklärung gelegentlich anzupassen, damit sie stets den aktuellen rechtlichen Anforderungen entspricht oder um Änderungen unserer Leistungen umzusetzen. Für Ihren erneuten Besuch gilt dann die neue Datenschutzerklärung.
              </p>
            </section>

            {/* Kontakt */}
            <section data-testid="section-contact-privacy" className="bg-gray-100 p-6 rounded-lg mt-8">
              <h2 className="text-2xl font-semibold mb-3 text-black">Fragen zum Datenschutz?</h2>
              <p>
                Bei Fragen zur Erhebung, Verarbeitung oder Nutzung Ihrer personenbezogenen Daten, bei Auskünften, Berichtigung, Sperrung oder Löschung von Daten wenden Sie sich bitte an die im{" "}
                <Link href="/impressum">
                  <span className="underline cursor-pointer">Impressum</span>
                </Link>
                {" "}angegebenen Kontaktdaten.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
