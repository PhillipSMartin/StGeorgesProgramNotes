import { z } from 'zod';
import { insertTrackingEventSchema, insertSupportedLanguageSchema, program_intro, program_pieces, tracking_events, supported_languages } from './schema';

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
    reorder: {
      method: 'POST' as const,
      path: '/api/admin/languages/reorder',
      input: z.object({
        orderedIds: z.array(z.number()),
      }),
      responses: {
        200: z.object({ message: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  intro: {
    get: {
      method: 'GET' as const,
      path: '/api/intro',
      responses: {
        200: z.custom<typeof program_intro.$inferSelect>().nullable(),
      },
    },
  },
  pieces: {
    list: {
      method: 'GET' as const,
      path: '/api/pieces',
      responses: {
        200: z.array(z.custom<typeof program_pieces.$inferSelect>()),
      },
    },
  },
  adminPieces: {
    list: {
      method: 'GET' as const,
      path: '/api/admin/pieces',
      responses: {
        200: z.array(z.custom<typeof program_pieces.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    save: {
      method: 'POST' as const,
      path: '/api/admin/pieces',
      input: z.object({
        language: z.string(),
        intro: z.string().optional(),
        pieces: z.array(z.object({
          id: z.number().optional(),
          title: z.string(),
          composer: z.string(),
          notes: z.string(),
          pieceOrder: z.number(),
        })),
      }),
      responses: {
        200: z.object({ message: z.string(), pieces: z.array(z.custom<typeof program_pieces.$inferSelect>()) }),
        401: errorSchemas.unauthorized,
      },
    },
    deletePiece: {
      method: 'DELETE' as const,
      path: '/api/admin/pieces/:id',
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
      },
    },
    publish: {
      method: 'POST' as const,
      path: '/api/admin/pieces/publish',
      input: z.object({
        language: z.string(),
      }),
      responses: {
        200: z.object({ message: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
    unpublish: {
      method: 'POST' as const,
      path: '/api/admin/pieces/unpublish',
      input: z.object({
        language: z.string(),
      }),
      responses: {
        200: z.object({ message: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
    translate: {
      method: 'POST' as const,
      path: '/api/admin/pieces/translate',
      input: z.object({
        targetLanguage: z.string(),
        targetLanguageLabel: z.string(),
      }),
      responses: {
        200: z.object({
          intro: z.string().optional(),
          pieces: z.array(z.object({
            title: z.string(),
            composer: z.string(),
            notes: z.string(),
          })),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  analytics: {
    current: {
      method: 'GET' as const,
      path: '/api/admin/analytics/current',
      responses: {
        200: z.object({
          stats: z.array(z.object({
            language: z.string(),
            label: z.string(),
            count: z.number(),
            percentage: z.number(),
          })),
          dateRange: z.object({ start: z.string(), end: z.string() }),
          totalCount: z.number(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    clear: {
      method: 'POST' as const,
      path: '/api/admin/analytics/clear',
      responses: {
        200: z.object({ message: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
    archives: {
      method: 'GET' as const,
      path: '/api/admin/analytics/archives',
      responses: {
        200: z.array(z.object({
          id: z.number(),
          periodStart: z.string(),
          periodEnd: z.string(),
          totalCount: z.number(),
          createdAt: z.string().nullable(),
        })),
        401: errorSchemas.unauthorized,
      },
    },
    archive: {
      method: 'GET' as const,
      path: '/api/admin/analytics/archives/:id',
      responses: {
        200: z.object({
          stats: z.array(z.object({
            language: z.string(),
            label: z.string(),
            count: z.number(),
            percentage: z.number(),
          })),
          dateRange: z.object({ start: z.string(), end: z.string() }),
          totalCount: z.number(),
        }),
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

export type TrackingLogInput = z.infer<typeof api.tracking.log.input>;
export type TrackingLogResponse = z.infer<typeof api.tracking.log.responses[201]>;
export type SupportedLanguageResponse = z.infer<typeof api.languages.list.responses[200]>;
export type AdminLoginInput = z.infer<typeof api.admin.login.input>;
export type AdminChangePasswordInput = z.infer<typeof api.admin.changePassword.input>;
