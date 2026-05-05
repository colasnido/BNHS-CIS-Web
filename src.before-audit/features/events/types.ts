import type { z } from 'zod';
import type { EventSchema, CreateEventSchema, UpdateEventSchema } from './schema';

export type Event = z.infer<typeof EventSchema>;
export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;
