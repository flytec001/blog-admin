import { z } from "zod";

export const postMetaSchema = z
  .object({
    title: z.string().min(1),
    slug: z.string().min(1),
    date: z.string().min(1),
    lastmod: z.string().min(1),
    draft: z.boolean().default(false),
    description: z.string().default(""),
    tags: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    cover: z.string().optional(),
  })
  .strip();

export const postInputSchema = postMetaSchema.extend({
  body: z.string().min(1),
});

export const postWriteSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  date: z.string().min(1),
  draft: z.boolean(),
  description: z.string().default(""),
  tags: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  cover: z.union([z.string().url(), z.literal("")]).optional(),
  body: z.string().min(1),
  sha: z.string().optional(),
});

export type PostMetaInput = z.infer<typeof postMetaSchema>;
export type PostInput = z.infer<typeof postInputSchema>;
export type PostWriteInput = z.infer<typeof postWriteSchema>;
