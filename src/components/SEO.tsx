import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: 'website' | 'article' | 'book';
  articleAuthor?: string;
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  bookAuthor?: string;
  bookIsbn?: string;
  canonicalUrl?: string;
  structuredData?: object;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image = 'https://inthemiddleofallthings.com/logo.png',
  type = 'website',
  articleAuthor,
  articlePublishedTime,
  articleModifiedTime,
  bookAuthor,
  bookIsbn,
  canonicalUrl,
  structuredData,
}) => {
  const location = useLocation();
  const baseUrl = 'https://inthemiddleofallthings.com';
  const fullUrl = `${baseUrl}${location.pathname}`;
  const canonical = canonicalUrl || fullUrl;

  useEffect(() => {
    // Update document title
    if (title) {
      document.title = `${title} | In the Middle of All Things`;
    }

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Update or create link tags
    const updateLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // Basic SEO meta tags
    if (description) {
      updateMetaTag('description', description);
    }
    if (keywords) {
      updateMetaTag('keywords', keywords);
    }

    // Open Graph tags
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:url', fullUrl, true);
    if (title) {
      updateMetaTag('og:title', title, true);
    }
    if (description) {
      updateMetaTag('og:description', description, true);
    }
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:site_name', 'In the Middle of All Things', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:url', fullUrl);
    if (title) {
      updateMetaTag('twitter:title', title);
    }
    if (description) {
      updateMetaTag('twitter:description', description);
    }
    updateMetaTag('twitter:image', image);

    // Article-specific tags
    if (type === 'article') {
      if (articleAuthor) {
        updateMetaTag('article:author', articleAuthor, true);
      }
      if (articlePublishedTime) {
        updateMetaTag('article:published_time', articlePublishedTime, true);
      }
      if (articleModifiedTime) {
        updateMetaTag('article:modified_time', articleModifiedTime, true);
      }
    }

    // Canonical URL
    updateLinkTag('canonical', canonical);

    // Add or update structured data
    const addStructuredData = (data: object) => {
      // Remove existing structured data script if it exists
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(data);
      script.id = 'structured-data';
      document.head.appendChild(script);
    };

    // Default structured data for website
    const defaultStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'In the Middle of All Things',
      url: baseUrl,
      description: description || 'A contemplative journey through philosophical exploration of existence, consciousness, and the nature of being.',
      publisher: {
        '@type': 'Organization',
        name: 'In the Middle of All Things',
        url: baseUrl,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${baseUrl}/?search={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };

    // Merge with custom structured data
    const finalStructuredData = structuredData || defaultStructuredData;
    addStructuredData(finalStructuredData);
  }, [
    title,
    description,
    keywords,
    image,
    type,
    articleAuthor,
    articlePublishedTime,
    articleModifiedTime,
    bookAuthor,
    bookIsbn,
    canonical,
    fullUrl,
    structuredData,
  ]);

  return null; // This component doesn't render anything
};

export default SEO;




