import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export default function KontaktFormular() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    gdprAccepted: false,
    honeypot: "", // Spam protection - should stay empty
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Spam protection - check honeypot field value from actual DOM (not just state)
    // This catches both state manipulation and direct DOM manipulation
    const honeypotField = document.getElementById('website') as HTMLInputElement;
    const honeypotValue = honeypotField?.value || formData.honeypot;
    
    if (honeypotValue) {
      // Silently reject spam submissions without feedback
      // Log for debugging/monitoring purposes
      console.warn('[Spam Protection] Honeypot triggered - submission blocked', {
        timestamp: new Date().toISOString(),
        honeypot: honeypotValue,
      });
      
      // Don't show success or error - just silently fail
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        // Reset form without showing success
      }, 1000);
      return;
    }

    if (!formData.gdprAccepted) {
      toast({
        variant: "destructive",
        title: "Datenschutz",
        description: "Bitte akzeptieren Sie die Datenschutzbestimmungen",
      });
      return;
    }

    if (!formData.name || !formData.email || !formData.message) {
      toast({
        variant: "destructive",
        title: "Fehlende Angaben",
        description: "Bitte füllen Sie alle Pflichtfelder aus",
      });
      return;
    }

    setLoading(true);

    // TODO: In production, send to backend API endpoint
    // For now, simulate submission
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
      toast({
        title: "Nachricht gesendet",
        description: "Wir melden uns schnellstmöglich bei Ihnen!",
      });
    }, 1000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-6">
          <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-3" data-testid="success-title">
            Vielen Dank für Ihre Nachricht!
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            Wir haben Ihre Anfrage erhalten und werden uns schnellstmöglich bei Ihnen melden.
          </p>
          <Link href="/">
            <Button data-testid="button-back-home">
              Zurück zur Startseite
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
      <div className="py-12 md:py-20">
        <div className="w-full max-w-2xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="page-title">
            Kontaktformular
          </h1>
          <p className="text-lg text-gray-700 mb-8">
            Sie haben Fragen zu unseren Leistungen oder möchten ein individuelles Angebot anfragen? 
            Schreiben Sie uns – wir melden uns schnellstmöglich bei Ihnen!
          </p>

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="contact-form">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-600">*</span>
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ihr vollständiger Name"
                required
                data-testid="input-name"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-Mail <span className="text-red-600">*</span>
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ihre.email@beispiel.de"
                required
                data-testid="input-email"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Telefon <span className="text-gray-500 text-sm">(optional)</span>
              </label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+49 (0)..."
                data-testid="input-phone"
              />
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Betreff <span className="text-gray-500 text-sm">(optional)</span>
              </label>
              <Input
                id="subject"
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="z.B. Anfrage zu Immobilienfotografie"
                data-testid="input-subject"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Ihre Nachricht <span className="text-red-600">*</span>
              </label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Bitte beschreiben Sie Ihr Anliegen..."
                rows={6}
                required
                data-testid="textarea-message"
              />
            </div>

            {/* Honeypot field - hidden from users but visible to bots */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <label htmlFor="website">
                Website (leave blank)
              </label>
              <Input
                id="website"
                name="website"
                type="text"
                value={formData.honeypot}
                onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* GDPR Notice */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="gdpr"
                  checked={formData.gdprAccepted}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, gdprAccepted: checked as boolean })
                  }
                  data-testid="checkbox-gdpr"
                />
                <label htmlFor="gdpr" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                  Ich habe die{" "}
                  <Link href="/datenschutz">
                    <span className="underline font-medium cursor-pointer">
                      Datenschutzerklärung
                    </span>
                  </Link>
                  {" "}zur Kenntnis genommen. Ich stimme zu, dass meine Angaben zur Kontaktaufnahme 
                  und für Rückfragen dauerhaft gespeichert werden. 
                  <span className="text-red-600 ml-1">*</span>
                </label>
              </div>
              <p className="text-xs text-gray-600 mt-3 ml-7">
                Hinweis: Sie können Ihre Einwilligung jederzeit für die Zukunft per E-Mail widerrufen.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full sm:w-auto"
                data-testid="button-submit"
              >
                {loading ? (
                  "Wird gesendet..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Nachricht senden
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-gray-600 pt-2">
              <span className="text-red-600">*</span> Pflichtfelder
            </p>
          </form>

          {/* Alternative Contact Info */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Weitere Kontaktmöglichkeiten</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>E-Mail:</strong>{" "}
                <a href="mailto:info@pix.immo" className="underline">
                  info@pix.immo
                </a>
              </p>
              <p>
                Oder besuchen Sie unsere{" "}
                <Link href="/kontakt">
                  <span className="underline cursor-pointer">Kontaktseite</span>
                </Link>
                {" "}für weitere Informationen zu unseren Standorten in Hamburg und Berlin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
