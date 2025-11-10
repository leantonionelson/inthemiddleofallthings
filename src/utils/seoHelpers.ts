/**
 * SEO and AEO Helper Functions
 * Provides structured data schemas and SEO metadata for different content types
 */

export interface BookStructuredData {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  author: {
    '@type': string;
    name: string;
  };
  publisher: {
    '@type': string;
    name: string;
  };
  datePublished?: string;
  dateModified?: string;
  inLanguage: string;
  isbn?: string;
  numberOfPages?: number;
  about?: {
    '@type': string;
    name: string;
  }[];
}

export interface ArticleStructuredData {
  '@context': string;
  '@type': string;
  headline: string;
  description: string;
  author: {
    '@type': string;
    name: string;
  };
  publisher: {
    '@type': string;
    name: string;
    logo: {
      '@type': string;
      url: string;
    };
  };
  datePublished?: string;
  dateModified?: string;
  mainEntityOfPage: {
    '@type': string;
    '@id': string;
  };
  articleSection?: string;
  inLanguage: string;
}

export interface FAQStructuredData {
  '@context': string;
  '@type': string;
  mainEntity: {
    '@type': string;
    name: string;
    acceptedAnswer: {
      '@type': string;
      text: string;
    };
  }[];
}

export interface BreadcrumbStructuredData {
  '@context': string;
  '@type': string;
  itemListElement: {
    '@type': string;
    position: number;
    name: string;
    item: string;
  }[];
}

/**
 * Generate Book structured data
 */
export function generateBookStructuredData(
  title: string,
  description: string,
  author: string = 'In the Middle of All Things',
  datePublished?: string,
  dateModified?: string,
  isbn?: string,
  numberOfPages?: number
): BookStructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: title,
    description,
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'In the Middle of All Things',
    },
    datePublished,
    dateModified,
    inLanguage: 'en-US',
    isbn,
    numberOfPages,
    about: [
      {
        '@type': 'Thing',
        name: 'Philosophy',
      },
      {
        '@type': 'Thing',
        name: 'Consciousness',
      },
      {
        '@type': 'Thing',
        name: 'Existence',
      },
    ],
  };
}

/**
 * Generate Article structured data for chapters
 */
export function generateArticleStructuredData(
  headline: string,
  description: string,
  url: string,
  author: string = 'In the Middle of All Things',
  datePublished?: string,
  dateModified?: string,
  articleSection?: string
): ArticleStructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'In the Middle of All Things',
      logo: {
        '@type': 'ImageObject',
        url: 'https://inthemiddleofallthings.com/logo.png',
      },
    },
    datePublished,
    dateModified,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    articleSection,
    inLanguage: 'en-US',
  };
}

/**
 * Generate FAQ structured data for AEO optimization
 */
export function generateFAQStructuredData(
  faqs: { question: string; answer: string }[]
): FAQStructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate Breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(
  items: { name: string; url: string }[]
): BreadcrumbStructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate default FAQ data for the website
 */
export function getDefaultFAQs(): { question: string; answer: string }[] {
  return [
    {
      question: 'What is "In the Middle of All Things"?',
      answer: '"In the Middle of All Things" is a philosophical book and contemplative platform that explores existence, consciousness, and the nature of being. It consists of four parts: The Axis of Becoming, The Spiral Path, The Living Axis, and The Horizon Beyond, along with guided meditations and philosophical stories.',
    },
    {
      question: 'What topics does the book cover?',
      answer: 'The book covers philosophical exploration of consciousness, existence, the nature of being, the axis of becoming, the spiral path of personal growth, the living axis of present moment awareness, and the horizon beyond our current understanding.',
    },
    {
      question: 'Are there guided meditations available?',
      answer: 'Yes, the platform includes a collection of guided meditations that complement the philosophical content. These meditations are designed to deepen your contemplative practice and support your journey of self-discovery.',
    },
    {
      question: 'Can I read the book offline?',
      answer: 'Yes, the platform supports offline reading. You can download chapters and meditations for offline access, allowing you to continue your contemplative journey even without an internet connection.',
    },
    {
      question: 'Is there audio narration available?',
      answer: 'Yes, the platform features AI-powered text-to-speech narration using Google\'s Gemini API, with a seamless fallback to browser speech synthesis. You can listen to chapters and meditations with synchronized text highlighting.',
    },
    {
      question: 'How is the book structured?',
      answer: 'The book is organized into four main parts: Part I: The Axis of Becoming, Part II: The Spiral Path, Part III: The Living Axis, and Part IV: The Horizon Beyond. Each part contains multiple chapters that build upon the philosophical themes.',
    },
    {
      question: 'What is the purpose of this philosophical exploration?',
      answer: 'The purpose is to provide a contemplative journey that helps readers explore fundamental questions about existence, consciousness, and being. It aims to support self-discovery, deepen understanding of the nature of reality, and offer wisdom for navigating life\'s complexities.',
    },
  ];
}

/**
 * Generate comprehensive website structured data
 */
export function generateWebsiteStructuredData(description?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'In the Middle of All Things',
    url: 'https://inthemiddleofallthings.com',
    description:
      description ||
      'A contemplative journey through philosophical exploration of existence, consciousness, and the nature of being.',
    publisher: {
      '@type': 'Organization',
      name: 'In the Middle of All Things',
      url: 'https://inthemiddleofallthings.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://inthemiddleofallthings.com/logo.png',
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://inthemiddleofallthings.com/?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

