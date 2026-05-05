import type { z } from 'zod';
import type {
  AnnouncementSchema,
  CreateAnnouncementSchema,
  UpdateAnnouncementSchema,
} from './schema';

export type Announcement = z.infer<typeof AnnouncementSchema>;
export type CreateAnnouncementInput = z.infer<typeof CreateAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof UpdateAnnouncementSchema>;
