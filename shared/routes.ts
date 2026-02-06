import { z } from 'zod';
import { insertTrackingEventSchema, insertSupportedLanguageSchema, program_content, tracking_events, supported_languages } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  content: {
    list: {
      method: 'GET' as const,
      path: '/api/content',
      input: z.object({
        language: z.string(),
      }),
      responses: {
        200: z.array(z.custom<typeof program_content.$inferSelect>()),
      },
    },
  },
  tracking: {
    log: {
      method: 'POST' as const,
      path: '/api/tracking/log',
      input: insertTrackingEventSchema,
      responses: {
        201: z.custom<typeof tracking_events.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  languages: {
    list: {
      method: 'GET' as const,
      path: '/api/languages',
      responses: {
        200: z.array(z.custom<typeof supported_languages.$inferSelect>()),
      },
    },
    adminList: {
      method: 'GET' as const,
      path: '/api/admin/languages',
      responses: {
        200: z.array(z.custom<typeof supported_languages.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/admin/languages',
      input: insertSupportedLanguageSchema,
      responses: {
        201: z.custom<typeof supported_languages.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/admin/languages/:id',
      input: insertSupportedLanguageSchema.partial(),
      responses: {
        200: z.custom<typeof supported_languages.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/admin/languages/:id',
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  admin: {
    login: {
      method: 'POST' as const,
      path: '/api/admin/login',
      input: z.object({
        password: z.string().min(1),
      }),
      responses: {
        200: z.object({ message: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/admin/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    session: {
      method: 'GET' as const,
      path: '/api/admin/session',
      responses: {
        200: z.object({ authenticated: z.boolean() }),
      },
    },
    changePassword: {
      method: 'POST' as const,
      path: '/api/admin/change-password',
      input: z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6),
      }),
      responses: {
        200: z.object({ message: z.string() }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type ProgramContentListResponse = z.infer<typeof api.content.list.responses[200]>;
export type TrackingLogInput = z.infer<typeof api.tracking.log.input>;
export type TrackingLogResponse = z.infer<typeof api.tracking.log.responses[201]>;
export type SupportedLanguageResponse = z.infer<typeof api.languages.list.responses[200]>;
export type AdminLoginInput = z.infer<typeof api.admin.login.input>;
export type AdminChangePasswordInput = z.infer<typeof api.admin.changePassword.input>;
