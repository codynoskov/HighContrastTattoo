import { defineCollection, z } from 'astro:content';

export const collections = {
  styles: defineCollection({
    type: 'content',
    schema: z.object({
      name: z.string(),
      slugOverride: z.string().optional(),
      order: z.number().optional(),
      intro: z.string(),
      details: z.string().optional(),
      cover: z.string().optional(),
    }),
  }),

  artists: defineCollection({
    type: 'content',
    schema: z.object({
      name: z.string(),
      slugOverride: z.string().optional(),
      photo: z.string(),
      intro: z.string(),
      styles: z.array(z.string()),
      details: z.string().optional(),
    }),
  }),

  works: defineCollection({
    type: 'content',
    schema: z.object({
      image: z.string(),
      styles: z.array(z.string()),
      artist: z.string(),
    }),
  }),
};
