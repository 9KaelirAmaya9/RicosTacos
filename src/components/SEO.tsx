import { Helmet } from "react-helmet-async";

const BASE_URL = "https://losricostacos.com";

interface SEOProps {
  title: string;
  description: string;
  canonicalPath: string;
  noindex?: boolean;
}

export const SEO = ({ title, description, canonicalPath, noindex = false }: SEOProps) => {
  const canonical = `${BASE_URL}${canonicalPath}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {/* hreflang — same URL serves both languages via client-side toggle */}
      <link rel="alternate" hreflang="en" href={canonical} />
      <link rel="alternate" hreflang="es" href={canonical} />
      <link rel="alternate" hreflang="x-default" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};
