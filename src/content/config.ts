import { defineCollection, z } from 'astro:content';

export const collections = {
  styles: defineCollection({
    type: 'content',
    schema: z.object({
      name: z.string(),
      intro: z.string(),
    }),
  }),

  artists: defineCollection({
    type: 'content',
    schema: z.object({
      name: z.string(),
      photo: z.string(),
      intro: z.string(),
      styles: z.array(z.string()),
    }),
  }),
};
