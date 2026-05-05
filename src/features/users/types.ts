import type { z } from 'zod';
import type {
  UserSchema,
  CreateUserSchema,
  UpdateUserSchema,
  RoleSchema,
} from './schema';

export type User = z.infer<typeof UserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type Role = z.infer<typeof RoleSchema>;
