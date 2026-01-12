import { defineCollection, z } from 'astro:content';

const uuid = z.string().uuid();

export const collections = {
  styles: defineCollection({
    type: 'content',
    schema: z.object({
      id: uuid,
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
      id: uuid,
      name: z.string(),
      slugOverride: z.string().optional(),
      photo: z.string(),
      intro: z.string(),
      styles: z.array(uuid),
      details: z.string().optional(),
      works: z.array(
        z.object({
          image: z.string(),
          styleTags: z.array(uuid),
        })
      ),
    }),
  }),
};
