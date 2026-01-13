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
      // artist is derived from folder structure (content/works/{artist}/{work}.md)
      styles: z.array(z.string()),
      order: z.number().optional(),
    }),
  }),
};
