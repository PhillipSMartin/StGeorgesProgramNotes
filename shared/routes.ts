import { z } from 'zod';
import { insertTrackingEventSchema, program_content, tracking_events } from './schema';

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
