import { z } from 'zod';

/**
 * Single source of truth for Event shape and validation.
 * Stored in Firestore, validated on every write.
 */
const EventCategorySchema = z.enum([
  'academic',
  'sports',
  'arts',
  'assembly',
  'community',
  'other',
]);

const EventStatusSchema = z.enum(['draft', 'published', 'archived']);

export const EventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(3, 'Title must be at least 3 characters').max(120),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  location: z.string().min(2).max(120),
  startDate: z.string().datetime({ message: 'Invalid date format (must be ISO)' }),
  endDate: z.string().datetime({ message: 'Invalid date format (must be ISO)' }),
  isAllDay: z.boolean(),
  category: EventCategorySchema,
  status: EventStatusSchema,
  published: z.boolean(),
  imageUrl: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Schema for creating a new event.
 * Server fills in id, createdAt, updatedAt.
 */
export const CreateEventSchema = EventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateEventSchema = CreateEventSchema.partial();
