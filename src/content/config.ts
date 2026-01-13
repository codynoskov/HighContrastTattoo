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
      name: z.string(),
      photo: z.string(),
      intro: z.string(),
      instagram: z.string().optional(),
      order: z.number().optional(),
    }),
  }),

  works: defineCollection({
    type: 'content',
    schema: z.object({
      image: z.string(),
      artist: z.string(),
      styles: z.array(z.string()),
      order: z.number().optional(),
    }),
  }),
};
