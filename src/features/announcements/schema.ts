import { z } from 'zod';

const AnnouncementPrioritySchema = z.enum(['low', 'medium', 'high']);

export const AnnouncementSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(3, 'Title must be at least 3 characters').max(160),
  summary: z.string().min(10, 'Summary must be at least 10 characters').max(1000),
  priority: AnnouncementPrioritySchema,
  published: z.boolean(),
  linkUrl: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateAnnouncementSchema = AnnouncementSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateAnnouncementSchema = CreateAnnouncementSchema.partial();
