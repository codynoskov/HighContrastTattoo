import { defineCollection, z } from 'astro:content';

const galleryImageSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
  tags: z.array(z.object({
    text: z.string(),
    color: z.enum(["Primary", "Accent", "Neutral"]).optional()
  })).optional()
});

const contentBlockSchema = z.object({
  title: z.string(),
  paragraphs: z.array(z.string()),
  gallery: z.array(galleryImageSchema).optional()
});

const artistsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    bio: z.string(),
    fullBio: z.string().optional(),
    image: z.string(),
    instagram: z.string(),
    tags: z.array(z.string()),
    bookingHref: z.string(),
    galleryImages: z.array(galleryImageSchema),
    contentBlocks: z.array(contentBlockSchema).optional()
  })
});

const stylesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    description: z.string(),
    artists: z.array(z.object({
      name: z.string(),
      href: z.string().optional()
    })),
    galleryImages: z.array(galleryImageSchema),
    contentBlocks: z.array(contentBlockSchema).optional(),
    bookingHref: z.string()
  })
});

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    layout: z.string().optional(),
    title: z.string(),
    date: z.date(),
    thumbnail: z.string().optional(),
    rating: z.number().optional()
  })
});

export const collections = {
  artists: artistsCollection,
  styles: stylesCollection,
  blog: blogCollection
};
