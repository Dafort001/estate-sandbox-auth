import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function AGB() {
  return (
    <div className="min-h-screen bg-white">
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="page-title">Allgemeine Liefer- und Geschäftsbedingungen</h1>
          <p className="text-gray-600 mb-12">Stand: 20. Oktober 2025</p>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">I. Geltung</h2>
            <ol className="list-decimal pl-6 space-y-3 text-gray-800">
              <li>Diese allgemeinen Liefer- und Geschäftsbedingungen (AGB) gelten für alle vom Fotografen durchgeführten Aufträge, Angebote, Lieferungen und Leistungen – einschließlich digitaler Bereitstellungen über Online-Plattformen, Cloud-Systeme oder Download-Links.</li>
              <li>Sie gelten als vereinbart mit Entgegennahme der Lieferung oder Leistung oder mit Annahme des Angebots des Fotografen durch den Kunden, spätestens jedoch mit der Abnahme des Bildmaterials.</li>
              <li>Widerspricht der Kunde diesen AGB, hat er dies schriftlich innerhalb von drei Werktagen zu erklären. Abweichende Bedingungen gelten nur, wenn sie schriftlich bestätigt wurden.</li>
              <li>Diese AGB gelten auch für zukünftige Geschäftsbeziehungen, sofern keine abweichenden Regelungen schriftlich getroffen werden.</li>
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">II. Auftragsproduktionen</h2>
            <ol className="list-decimal pl-6 space-y-3 text-gray-800">
              <li>Kostenvoranschläge sind unverbindlich. Bei Kostenerhöhungen über 15 % informiert der Fotograf den Kunden unverzüglich.</li>
              <li>Der Fotograf kann zur Durchführung notwendige Leistungen Dritter im Namen und auf Rechnung des Kunden beauftragen.</li>
              <li>Die Bildauswahl zur Abnahme erfolgt – sofern nicht anders vereinbart – durch den Fotografen.</li>
              <li>Mängel sind innerhalb von zwei Wochen nach Lieferung schriftlich anzuzeigen. Danach gelten die Aufnahmen als abgenommen.</li>
              <li>Bei Stornierung eines Auftrags nach Produktionsbeginn werden bereits entstandene Kosten sowie 50 % des vereinbarten Honorars als Ausfallhonorar berechnet.</li>
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">III. Überlassenes Bildmaterial</h2>
            <ol className="list-decimal pl-6 space-y-3 text-gray-800">
              <li>Diese AGB gelten für sämtliches Bildmaterial, unabhängig von Entstehungsstufe oder Format, einschließlich digitaler Dateien.</li>
              <li>Der Kunde erkennt an, dass das Bildmaterial urheberrechtlich geschützte Werke im Sinne von § 2 Abs. 1 Nr. 5 UrhG darstellt.</li>
              <li>Gestaltungsvorschläge oder Konzeptionen sind eigenständige, vergütungspflichtige Leistungen.</li>
              <li>Das Bildmaterial bleibt Eigentum des Fotografen.</li>
              <li>Der Kunde darf es nur zu internen Sichtungs- oder Produktionszwecken an Dritte weitergeben.</li>
              <li>Reklamationen sind innerhalb von zwei Wochen schriftlich mitzuteilen. Danach gilt das Bildmaterial als ordnungsgemäß geliefert.</li>
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">IV. Nutzungsrechte</h2>
            <ol className="list-decimal pl-6 space-y-3 text-gray-800">
              <li>Der Kunde erhält ein einfaches Nutzungsrecht zur einmaligen Verwendung für den vereinbarten Zweck.</li>
              <li>Ausschließliche, räumliche oder zeitlich unbegrenzte Nutzungsrechte bedürfen einer gesonderten Vereinbarung und eines Aufschlags von mindestens 100 %.</li>
              <li>Jede weitergehende Nutzung oder Veränderung bedarf der schriftlichen Zustimmung des Fotografen.</li>
              <li>Die Bearbeitung, Veränderung oder KI-gestützte Weiterverarbeitung des Bildmaterials ist nur nach schriftlicher Zustimmung des Fotografen zulässig.</li>
              <li>Eine Weitergabe von Nutzungsrechten an Dritte ist ohne Zustimmung ausgeschlossen.</li>
              <li>Nutzungsrechte gehen erst nach vollständiger Bezahlung über.</li>
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">V. Haftung</h2>
            <ol className="list-decimal pl-6 space-y-3 text-gray-800">
              <li>Der Fotograf haftet nicht für Rechte Dritter (z. B. abgebildete Personen, Marken, Kunstwerke), sofern keine entsprechenden Freigaben vorliegen. Die Einholung notwendiger Genehmigungen obliegt dem Kunden.</li>
              <li>Ab Lieferung liegt die Verantwortung für die sachgemäße Nutzung beim Kunden.</li>
              <li>Für die Verfügbarkeit digitaler Inhalte auf Drittplattformen (z. B. Cloudflare, Pix.Immo-Galerien) wird keine Haftung übernommen.</li>
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">VI. Honorare</h2>
            <ol className="list-decimal pl-6 space-y-3 text-gray-800">
              <li>Es gilt das vereinbarte Honorar. Ist kein Honorar vereinbart, gilt die jeweils aktuelle MFM-Honorarliste.</li>
              <li>Kosten und Auslagen (Reisen, Modelle, Requisiten etc.) trägt der Kunde.</li>
              <li>Das Honorar ist bei Lieferung fällig. Bei Teillieferungen können Teilhonorare berechnet werden.</li>
              <li>Das Honorar ist auch dann zu zahlen, wenn das Bildmaterial nicht veröffentlicht wird.</li>
              <li>Eine Aufrechnung ist nur mit unbestrittenen oder rechtskräftig festgestellten Forderungen zulässig.</li>
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">VII. Rückgabe von Bildmaterial</h2>
            <ol className="list-decimal pl-6 space-y-3 text-gray-800">
              <li>Analoges Material ist spätestens drei Monate nach Lieferung zurückzugeben.</li>
              <li>Digitale Daten sind nach Nutzung zu löschen.</li>
              <li>Bei Bereitstellung über Online-Galerien entfällt die Rückgabe.</li>
              <li>Rücksendungen erfolgen auf Kosten und Risiko des Kunden.</li>
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">VIII. Vertragsstrafe und Schadensersatz</h2>
            <ol className="list-decimal pl-6 space-y-3 text-gray-800">
              <li>Jede unberechtigte Nutzung oder Weitergabe führt zu einer Vertragsstrafe in Höhe des fünffachen Nutzungshonorars.</li>
              <li>Bei fehlendem oder falschem Urhebervermerk wird ein Aufschlag von 100 % des Nutzungshonorars berechnet.</li>
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">IX. Allgemeine Bestimmungen</h2>
            <ol className="list-decimal pl-6 space-y-3 text-gray-800">
              <li>Es gilt deutsches Recht, auch bei Auslandslieferungen.</li>
              <li>Nebenabreden bedürfen der Schriftform. E-Mail genügt.</li>
              <li>Sollte eine Klausel unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.</li>
              <li>Gerichtsstand und Erfüllungsort ist Hamburg, sofern der Kunde Kaufmann ist.</li>
            </ol>
          </section>

          <div className="mt-12 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">Stand: 20. Oktober 2025</p>
          </div>
        </div>
      </article>
    </div>
  );
}
