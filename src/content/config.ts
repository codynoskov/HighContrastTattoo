import { defineCollection, z } from 'astro:content';

export const collections = {
  styles: defineCollection({
    type: 'content',
    schema: z.object({
      name: z.string(),
      intro: z.string(),
      order: z.number().optional(),
      cardImage: z.string().optional(),
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
      headline: z.string().describe('Hero headline'),
      introText: z.string().describe('Hero introduction text (supports **bold** markdown)'),
      ctaText: z.string().optional().describe('Call-to-action button text'),
      ctaHref: z.string().optional().describe('Call-to-action button link'),
      videoSrc: z.string().optional().describe('Video URL (R2 or external)'),
      streamVideoId: z.string().optional().describe('Cloudflare Stream video ID'),
      streamCustomerCode: z.string().optional().describe('Cloudflare Stream customer code'),
      topRightImage: z.string().optional().describe('Top right overlay image path'),
      bottomLeftImage: z.string().optional().describe('Bottom left overlay image path'),
    }),
  }),
};
