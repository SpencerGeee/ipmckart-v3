// Schema.org structured data for IPMC Kart
const schemaData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "IPMC Kart",
      "url": "https://localhost:4040",
      "logo": "https://localhost:4040/assets/logo.webp",
      "description": "Shop quality electronics at IPMC Kart. Find laptops, smartphones, UPS, and tech accessories with fast delivery across Ghana.",
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+233-53-100-5871",
        "contactType": "Customer Service",
        "email": "care@ipmcghana.com"
      },
      "sameAs": [
        "https://www.facebook.com/IPMCKart/",
        "https://x.com/ipmckart",
        "https://www.linkedin.com/company/ipmc-kart/"
      ],
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "GH"
      }
    };

// Add schema to page
if (typeof document !== 'undefined') {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schemaData);
    document.head.appendChild(script);
}
