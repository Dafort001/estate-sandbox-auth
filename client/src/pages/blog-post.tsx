import { Link, useParams } from "wouter";
import { ArrowLeft } from "lucide-react";

// Mock blog data - full content for individual posts
const blogPostsData: Record<string, {
  title: string;
  heroImage: string;
  content: {
    part1: string;
    image1: string;
    part2: string;
    image2: string;
    part3: string;
  };
}> = {
  "fruehlingsduft": {
    title: "Es fliegt, es fliegt ...der warme Frühlingsduft",
    heroImage: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=1200&h=1800&fit=crop",
    content: {
      part1: "Salut mal frühe, schöne, warme und extrem erlebnisreiche viele gemeinsame Tage. Mit dem Einzug vom Frühling, steht das Leben nicht nur vor unserer Tür, sondern auch in unseren Kühlschränken. Wir sind bereits seit Februar in vollem Einsatz und kochen, kochen und kochen. Die ersten Projekte sind bereits abgeschlossen und weitere folgen in den kommenden Wochen.",
      image1: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&h=800&fit=crop",
      part2: "Der Frühling bringt nicht nur frische Farben in die Natur, sondern auch neue Energie in unsere kreativen Projekte. Mit jedem Sonnenstrahl wächst die Inspiration für innovative Konzepte und außergewöhnliche Perspektiven. Die längeren Tage ermöglichen es uns, noch intensiver an unseren Visionen zu arbeiten.",
      image2: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=800&fit=crop",
      part3: "Diese Jahreszeit symbolisiert für uns einen Neuanfang – eine Zeit, in der wir unsere Leidenschaft für perfekte Bilder mit der erwachenden Natur verbinden können. Jedes Projekt wird zu einer Entdeckungsreise, bei der wir die Schönheit des Moments einfangen und für die Ewigkeit festhalten.",
    },
  },
  "kaffee-moment": {
    title: "Der perfekte Kaffee-Moment",
    heroImage: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&h=1800&fit=crop",
    content: {
      part1: "In der Ruhe des Morgens liegt eine besondere Magie. Der erste Schluck Kaffee ist mehr als nur ein Getränk – es ist ein Ritual, das den Tag einläutet und die Sinne weckt. Diese kostbaren Momente der Stille vor dem geschäftigen Alltag sind unbezahlbar.",
      image1: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&h=800&fit=crop",
      part2: "Die Kunst liegt im Detail: Die richtige Temperatur, die perfekte Crema, das sanfte Aroma, das den Raum erfüllt. Jeder dieser Aspekte trägt zu einem unvergesslichen Erlebnis bei. Es sind diese kleinen Freuden, die den Alltag besonders machen.",
      image2: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1200&h=800&fit=crop",
      part3: "In unserer hektischen Welt ist es wichtig, innezuhalten und den Moment zu genießen. Der Kaffee wird zum Symbol für Achtsamkeit und bewusstes Erleben. Nehmen Sie sich Zeit für diese kleinen Pausen – sie sind es, die das Leben lebenswert machen.",
    },
  },
  "urban-leben": {
    title: "Urbanes Leben in der Moderne",
    heroImage: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&h=1800&fit=crop",
    content: {
      part1: "Die Stadt pulsiert mit Leben und Energie. Zwischen Glas und Beton entstehen täglich neue Geschichten. Das urbane Leben ist geprägt von Kontrasten: Alt trifft Neu, Tradition begegnet Innovation. In dieser dynamischen Umgebung finden wir unendliche Inspiration.",
      image1: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=800&fit=crop",
      part2: "Architektur ist die Sprache der Stadt. Jedes Gebäude erzählt seine eigene Geschichte, formt die Skyline und prägt das Stadtbild. Die moderne Metropole ist ein lebendiges Museum zeitgenössischer Baukunst, in dem sich Vergangenheit und Zukunft vereinen.",
      image2: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1200&h=800&fit=crop",
      part3: "Das Leben in der Stadt bedeutet Vielfalt, Bewegung und ständige Veränderung. Es ist ein Ort der Möglichkeiten, wo Träume verwirklicht werden und Innovation gedeiht. Diese urbane Energie spiegelt sich in jedem Winkel wider.",
    },
  },
  "kulinarik": {
    title: "Kulinarische Entdeckungen",
    heroImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=1800&fit=crop",
    content: {
      part1: "Essen ist weit mehr als bloße Nahrungsaufnahme – es ist Kunst, Kultur und Leidenschaft. Jedes Gericht erzählt eine Geschichte von Tradition, Innovation und handwerklichem Können. Die Kulinarik verbindet Menschen über Grenzen hinweg.",
      image1: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=1200&h=800&fit=crop",
      part2: "In der Küche verschmelzen Kreativität und Präzision zu wahren Meisterwerken. Farben, Texturen und Aromen werden sorgfältig komponiert, um alle Sinne anzusprechen. Jeder Teller ist eine Leinwand, auf der kulinarische Visionen Gestalt annehmen.",
      image2: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=1200&h=800&fit=crop",
      part3: "Die Liebe zum Detail macht den Unterschied zwischen gutem und außergewöhnlichem Essen. Es sind die kleinen Nuancen, die überraschen und begeistern. Kulinarik ist eine Reise der Entdeckung, die niemals endet.",
    },
  },
  "natur-pur": {
    title: "Natur Pur",
    heroImage: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=1800&fit=crop",
    content: {
      part1: "Die Natur ist die größte Künstlerin. In ihrer unendlichen Weisheit erschafft sie Landschaften von atemberaubender Schönheit. Jeder Baum, jeder Stein, jeder Wassertropfen ist Teil eines größeren Ganzen – eines perfekten Ökosystems.",
      image1: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&h=800&fit=crop",
      part2: "In der Stille des Waldes findet der Geist Ruhe. Die grüne Umgebung wirkt heilsam auf Körper und Seele. Hier, fernab vom städtischen Trubel, können wir uns mit unseren Wurzeln verbinden und neue Kraft schöpfen.",
      image2: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1200&h=800&fit=crop",
      part3: "Die Natur lehrt uns Demut und Geduld. Sie zeigt uns den Rhythmus des Lebens und erinnert uns daran, dass wir Teil eines größeren Ganzen sind. Jeder Moment in der Natur ist ein Geschenk.",
    },
  },
  "architektur": {
    title: "Architektonische Meisterwerke",
    heroImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=1800&fit=crop",
    content: {
      part1: "Architektur formt unsere Welt. Sie ist die Manifestation menschlicher Kreativität und technischer Brillanz. Große Bauwerke inspirieren uns, fordern uns heraus und prägen unsere Umgebung für Generationen.",
      image1: "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?w=1200&h=800&fit=crop",
      part2: "Moderne Architektur strebt nach Perfektion in Form und Funktion. Klare Linien, innovative Materialien und nachhaltige Konzepte vereinen sich zu Bauwerken, die nicht nur schön anzusehen sind, sondern auch den Bedürfnissen der Menschen gerecht werden.",
      image2: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&h=800&fit=crop",
      part3: "Jedes Gebäude ist ein Statement, eine Vision in Stein und Stahl gegossen. Architektur prägt nicht nur Stadtbilder, sondern auch die Art, wie wir leben und arbeiten. Sie ist Ausdruck unserer Zeit und unserer Werte.",
    },
  },
  "lichtspiel": {
    title: "Das Spiel mit dem Licht",
    heroImage: "https://images.unsplash.com/photo-1477346611705-65d1883cee1e?w=1200&h=1800&fit=crop",
    content: {
      part1: "Licht ist der Pinsel, mit dem die Natur malt. Es formt Schatten, erzeugt Stimmungen und verwandelt das Gewöhnliche in etwas Außergewöhnliches. In der Fotografie ist Licht nicht nur ein technisches Element – es ist die Seele jedes Bildes.",
      image1: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&h=800&fit=crop",
      part2: "Die goldene Stunde, wenn die Sonne tief steht, taucht die Welt in warmes, weiches Licht. Diese magischen Momente sind flüchtig und kostbar. Sie erfordern Geduld und ein geschultes Auge, um sie einzufangen.",
      image2: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=800&fit=crop",
      part3: "Schatten sind ebenso wichtig wie Licht. Sie verleihen Tiefe, Kontrast und Dramatik. Das Spiel zwischen Hell und Dunkel erzeugt Spannung und lenkt den Blick des Betrachters genau dorthin, wo wir ihn haben möchten.",
    },
  },
  "minimalism": {
    title: "Minimalismus im Alltag",
    heroImage: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=1200&h=1800&fit=crop",
    content: {
      part1: "Weniger ist mehr – dieses Prinzip prägt nicht nur Design, sondern auch Lebensphilosophien. Minimalismus bedeutet Reduktion auf das Wesentliche, Klarheit in der Formgebung und Fokus auf Qualität statt Quantität.",
      image1: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&h=800&fit=crop",
      part2: "In einer Welt voller Reize und Ablenkungen schafft Minimalismus Raum zum Atmen. Klare Linien, neutrale Farben und durchdachte Kompositionen beruhigen das Auge und den Geist. Einfachheit ist die höchste Form der Raffinesse.",
      image2: "https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?w=1200&h=800&fit=crop",
      part3: "Minimalistisches Design ist zeitlos. Es verzichtet auf Trends und konzentriert sich auf das Bleibende. Diese Ästhetik spricht eine universelle Sprache, die über Kulturen und Zeiten hinweg verstanden wird.",
    },
  },
  "zeitlos": {
    title: "Zeitlose Eleganz",
    heroImage: "https://images.unsplash.com/photo-1464550838636-1a3496df938b?w=1200&h=1800&fit=crop",
    content: {
      part1: "Wahre Eleganz kennt keine Zeit. Sie ist nicht an Trends gebunden, sondern beruht auf zeitlosen Prinzipien von Harmonie, Balance und Proportion. Eleganz zeigt sich in der Zurückhaltung, in der Qualität der Ausführung.",
      image1: "https://images.unsplash.com/photo-1502481851512-e9e2529bfbf9?w=1200&h=800&fit=crop",
      part2: "In der Fotografie bedeutet Eleganz, die Essenz einzufangen ohne zu überwältigen. Es ist die Kunst, Schönheit zu zeigen, ohne sie zu inszenieren. Natürlichkeit und Raffinesse gehen Hand in Hand.",
      image2: "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=1200&h=800&fit=crop",
      part3: "Zeitlose Eleganz ist eine Haltung, eine Philosophie. Sie findet sich in den kleinen Details, in der Sorgfalt der Ausführung und in der Liebe zum Handwerk. Was elegant ist, bleibt schön – heute, morgen und für immer.",
    },
  },
};

export default function BlogPost() {
  const params = useParams();
  const slug = params.slug || "";
  const post = blogPostsData[slug];

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Blog-Beitrag nicht gefunden</h1>
          <Link href="/blog">
            <span className="text-primary hover:underline cursor-pointer">Zurück zum Blog</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-[5vw] py-4">
          <Link href="/">
            <div className="text-base font-semibold tracking-wide cursor-pointer" data-testid="brand-logo">
              PIX.IMMO
            </div>
          </Link>
          <Link href="/blog">
            <button
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
              data-testid="button-back-to-blog"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm">Blog</span>
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Image - Full width portrait */}
      <div className="relative w-full h-[60vh] md:h-[80vh] bg-gray-100">
        <img
          src={post.heroImage}
          alt={post.title}
          className="w-full h-full object-cover"
          data-testid="hero-image"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-[5vw] md:p-12">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white max-w-4xl leading-tight" data-testid="post-title">
            {post.title}
          </h1>
        </div>
      </div>

      {/* Content - Narrow centered text block with embedded landscape images */}
      <article className="py-12 md:py-20">
        <div className="w-full max-w-xl mx-auto px-6">
          {/* First text block */}
          <p className="text-base md:text-lg leading-relaxed mb-12 text-gray-800" data-testid="content-part-1">
            {post.content.part1}
          </p>

          {/* First landscape image */}
          <div className="mb-12 -mx-6" data-testid="image-1-container">
            <img
              src={post.content.image1}
              alt="Blog Bild 1"
              className="w-full h-auto"
              loading="lazy"
            />
          </div>

          {/* Second text block */}
          <p className="text-base md:text-lg leading-relaxed mb-12 text-gray-800" data-testid="content-part-2">
            {post.content.part2}
          </p>

          {/* Second landscape image */}
          <div className="mb-12 -mx-6" data-testid="image-2-container">
            <img
              src={post.content.image2}
              alt="Blog Bild 2"
              className="w-full h-auto"
              loading="lazy"
            />
          </div>

          {/* Third text block */}
          <p className="text-base md:text-lg leading-relaxed text-gray-800" data-testid="content-part-3">
            {post.content.part3}
          </p>
        </div>
      </article>

      {/* Back to blog link */}
      <div className="pb-20 text-center">
        <Link href="/blog">
          <span className="inline-flex items-center gap-2 text-primary hover:underline cursor-pointer" data-testid="link-back-to-blog">
            <ArrowLeft className="h-4 w-4" />
            Zurück zum Blog
          </span>
        </Link>
      </div>
    </div>
  );
}
