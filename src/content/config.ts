import { defineCollection, z } from 'astro:content';

// Reusable SEO schema for page-level content
const seoFields = {
  metaTitle: z.string().max(60).optional().describe('Custom page title for search engines (max 60 chars)'),
  metaDescription: z.string().max(160).optional().describe('Custom description for search results (max 160 chars)'),
  ogImage: z.string().optional().describe('Custom social sharing image (1200x630px recommended)'),
  noIndex: z.boolean().optional().default(false).describe('Hide this page from search engines'),
};

export const collections = {
  styles: defineCollection({
    type: 'content',
    schema: z.object({
      name: z.string(),
      intro: z.string(),
      order: z.number().optional(),
      cardImage: z.string().optional(),
      slugOverride: z.string().optional().describe('Custom URL slug (overrides filename-based slug)'),
      // SEO fields
      ...seoFields,
    }),
  }),

  artists: defineCollection({
    type: 'content',
    schema: z.object({
      name: z.string().describe('Artist name'),
      photo: z.string().describe('Photo path'),
      intro: z.string().describe('Introduction text'),
      instagram: z.string().optional().describe('Instagram handle'),
      order: z.number().optional().describe('Display order'),
      styles: z.array(z.string()).optional().describe('Style slugs this artist works in'),
      slugOverride: z.string().optional().describe('Custom URL slug (overrides filename-based slug)'),
      // SEO fields
      ...seoFields,
    }),
  }),

  works: defineCollection({
    type: 'content',
    schema: z.object({
      image: z.string(),
      // artist is derived from folder structure (content/works/{artist}/{work}.md)
      styles: z.array(z.string()),
      order: z.number().optional(),
    }),
  }),

  reviews: defineCollection({
    type: 'content',
    schema: z.object({
      rating: z.number().min(1).max(5).optional().default(5),
      author: z.string(),
      order: z.number().optional(),
    }),
  }),

  studio: defineCollection({
    type: 'content',
    schema: z.object({
      images: z.array(z.string()),
    }),
  }),

  homepage: defineCollection({
    type: 'content',
    schema: z.object({
      // Hero Section
      headline: z.string().describe('Hero headline'),
      introText: z.string().describe('Hero introduction text (supports **bold** markdown)'),
      videoSrc: z.string().optional().describe('Hero background video'),
      videoPoster: z.string().optional().describe('Video poster/thumbnail image (shown while video loads on slow connections)'),
      streamVideoId: z.string().optional().describe('Cloudflare Stream video ID'),
      streamCustomerCode: z.string().optional().describe('Cloudflare Stream customer code'),
      topRightImage: z.string().optional().describe('Top right overlay image path'),
      bottomLeftImage: z.string().optional().describe('Bottom left overlay image path'),

      // Reviews Section
      reviewsTitle: z.string().optional().describe('Reviews section title'),
      reviewsSubtitle: z.string().optional().describe('Reviews section subtitle (supports **bold** markdown)'),

      // Instagram Section
      instagramTitle: z.string().optional().describe('Instagram section title'),
      instagramHandle: z.string().optional().describe('Instagram handle with @'),
      instagramUrl: z.string().optional().describe('Instagram profile URL'),
      instagramBackgroundImage: z.string().optional().describe('Instagram section background image'),

      // Studio Section
      studioTitle: z.string().optional().describe('Studio section title'),
      studioDescription: z.string().optional().describe('Studio section description'),

      // Walk-In Section
      walkInTitle: z.string().optional().describe('Walk-in section title'),
      walkInDescription: z.string().optional().describe('Walk-in section description'),
      walkInSchedule: z.string().optional().describe('Walk-in schedule text'),
      walkInBackgroundImage: z.string().optional().describe('Walk-in section background image'),

      // Styles Section
      stylesTitle: z.string().optional().describe('Styles section title'),
      stylesDescription: z.string().optional().describe('Styles section description'),
      stylesCtaText: z.string().optional().describe('Styles CTA button text'),

      // Values Section
      valuesTitle: z.string().optional().describe('Values section title'),
      valuesDescription: z.string().optional().describe('Values section description'),

      // Artists Section
      artistsTitle: z.string().optional().describe('Artists section title'),
      artistsDescription: z.string().optional().describe('Artists section description'),
      artistsCtaText: z.string().optional().describe('Artists CTA button text'),

      // SEO fields
      ...seoFields,
    }),
  }),

  settings: defineCollection({
    type: 'content',
    schema: z.object({
      // Global
      studioName: z.string().optional().describe('Studio name displayed in header/footer'),
      
      // Buttons
      buttonBookSession: z.string().optional().describe('Book session button text'),
      buttonGoogleMaps: z.string().optional().describe('Google Maps button text'),
      buttonInstagram: z.string().optional().describe('Instagram button text'),
      
      // Footer
      footerHeadline: z.string().optional().describe('Footer headline'),
      footerDescription: z.string().optional().describe('Footer description'),
      footerMapImage: z.string().optional().describe('Footer map image path'),
      footerEmailLabel: z.string().optional().describe('Email section label'),
      footerEmailDescription: z.string().optional().describe('Email section description'),
      footerPhoneLabel: z.string().optional().describe('Phone section label'),
      footerPhoneDescription: z.string().optional().describe('Phone section description'),
      footerStudioLabel: z.string().optional().describe('Studio section label'),
      footerEmail: z.string().optional().describe('Contact email address'),
      footerPhone: z.string().optional().describe('Contact phone number'),
      footerWhatsAppUrl: z.string().optional().describe('WhatsApp URL'),
      footerAddress: z.string().optional().describe('Studio address'),
      footerPrivacyNote: z.string().optional().describe('Privacy note text'),
      footerCopyright: z.string().optional().describe('Copyright text'),

      // SEO Global Defaults
      seoSiteName: z.string().optional().describe('Site name for og:site_name'),
      seoDefaultDescription: z.string().optional().describe('Default meta description when page has none'),
      seoDefaultOgImage: z.string().optional().describe('Default social sharing image'),
      seoGoogleMapsUrl: z.string().optional().describe('Google Maps URL for structured data'),
      seoInstagramUrl: z.string().optional().describe('Instagram URL for structured data'),
      seoSiteUrl: z.string().optional().describe('Full site URL (e.g., https://highcontrasttattoo.com)'),
    }),
  }),

  artistsPage: defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string().optional().describe('Artists page header title'),
      description: z.string().optional().describe('Artists page header description/subheader'),
      // SEO fields
      ...seoFields,
    }),
  }),

  stylesPage: defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string().optional().describe('Styles page header title'),
      description: z.string().optional().describe('Styles page header description/subheader'),
      // SEO fields
      ...seoFields,
    }),
  }),
};
