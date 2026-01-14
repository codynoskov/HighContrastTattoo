import { defineCollection, z } from 'astro:content';

export const collections = {
  styles: defineCollection({
    type: 'content',
    schema: z.object({
      name: z.string(),
      intro: z.string(),
      order: z.number().optional(),
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
};
