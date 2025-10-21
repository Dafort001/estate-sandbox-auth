import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  path?: string;
  type?: "website" | "article";
  image?: string;
  schema?: Record<string, any>;
}

export function SEOHead({
  title,
  description,
  path = "/",
  type = "website",
  image = "/og-image.jpg",
  schema,
}: SEOHeadProps) {
  useEffect(() => {
    // Set page title
    document.title = `${title} | PIX.IMMO`;

    // Set or update meta tags
    const setMeta = (name: string, content: string, property?: boolean) => {
      const attr = property ? "property" : "name";
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute("content", content);
    };

    // Standard meta tags
    setMeta("description", description);

    // Canonical link
    const baseUrl = window.location.origin;
    const fullUrl = `${baseUrl}${path}`;
    
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", fullUrl);

    // Open Graph tags
    
    setMeta("og:title", `${title} | PIX.IMMO`, true);
    setMeta("og:description", description, true);
    setMeta("og:type", type, true);
    setMeta("og:url", fullUrl, true);
    setMeta("og:image", `${baseUrl}${image}`, true);
    setMeta("og:site_name", "PIX.IMMO", true);
    setMeta("og:locale", "de_DE", true);

    // Twitter Card tags
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", `${title} | PIX.IMMO`);
    setMeta("twitter:description", description);
    setMeta("twitter:image", `${baseUrl}${image}`);

    // Schema.org JSON-LD - cleanup and update
    let scriptElement = document.querySelector('script[type="application/ld+json"]');
    
    if (schema) {
      if (!scriptElement) {
        scriptElement = document.createElement("script");
        scriptElement.setAttribute("type", "application/ld+json");
        document.head.appendChild(scriptElement);
      }
      scriptElement.textContent = JSON.stringify(schema);
    } else if (scriptElement) {
      // Remove stale JSON-LD script if no schema provided
      scriptElement.remove();
    }
  }, [title, description, path, type, image, schema]);

  return null;
}

// Predefined Schema.org templates
export const SchemaTemplates = {
  localBusiness: {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://pix.immo/#organization",
    name: "PIX.IMMO",
    description: "Professionelle Immobilienfotografie für Hamburg und Berlin",
    url: "https://pix.immo",
    telephone: "+49...",
    priceRange: "€€",
    image: "https://pix.immo/logo.png",
    address: [
      {
        "@type": "PostalAddress",
        addressLocality: "Hamburg",
        addressCountry: "DE",
      },
      {
        "@type": "PostalAddress",
        addressLocality: "Berlin",
        addressCountry: "DE",
      }
    ],
    geo: [
      {
        "@type": "GeoCoordinates",
        latitude: 53.5511,
        longitude: 9.9937,
      },
      {
        "@type": "GeoCoordinates",
        latitude: 52.5200,
        longitude: 13.4050,
      }
    ],
    areaServed: [
      {
        "@type": "City",
        name: "Hamburg",
      },
      {
        "@type": "City",
        name: "Berlin",
      }
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Immobilienfotografie Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Immobilienfotografie",
            description: "Professionelle Innen- und Außenaufnahmen von Immobilien",
          }
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Drohnenaufnahmen",
            description: "Luftaufnahmen zur Darstellung von Lage und Grundstück",
          }
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "360° Rundgänge",
            description: "Virtuelle Touren für Online-Exposés",
          }
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Videoaufnahmen",
            description: "Videoclips für Social Media und Online-Portale",
          }
        }
      ]
    }
  },

  faqPage: (questions: Array<{ question: string; answer: string }>) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map(q => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      }
    }))
  }),

  breadcrumb: (items: Array<{ name: string; url: string }>) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    }))
  }),

  article: (title: string, description: string, datePublished: string, image?: string) => ({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description,
    image: image || "https://pix.immo/og-image.jpg",
    datePublished: datePublished,
    author: {
      "@type": "Organization",
      name: "PIX.IMMO",
    },
    publisher: {
      "@type": "Organization",
      name: "PIX.IMMO",
      logo: {
        "@type": "ImageObject",
        url: "https://pix.immo/logo.png",
      }
    }
  }),
};
