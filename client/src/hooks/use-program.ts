import { useQuery, useMutation } from "@tanstack/react-query";
import { api, type ProgramContentListResponse, type TrackingLogInput, type TrackingLogResponse } from "@shared/routes";

// GET /api/content
export function useProgramContent(language: string) {
  return useQuery({
    queryKey: [api.content.list.path, language],
    queryFn: async () => {
      // In a real app, we would use the typed route with query params
      // Since our buildUrl helper in the prompt handles path params but not query params efficiently for this specific generated structure, 
      // we'll construct the URL manually for the query string to be safe and explicit.
      const url = `${api.content.list.path}?language=${encodeURIComponent(language)}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch program content");
      return api.content.list.responses[200].parse(await res.json());
    },
    // Don't refetch too often as content is static
    staleTime: 1000 * 60 * 60, 
  });
}

// POST /api/tracking/log
export function useLogLanguageSelection() {
  return useMutation({
    mutationFn: async (data: TrackingLogInput) => {
      const validated = api.tracking.log.input.parse(data);
      const res = await fetch(api.tracking.log.path, {
        method: api.tracking.log.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.tracking.log.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to log tracking event");
      }
      
      return api.tracking.log.responses[201].parse(await res.json());
    },
  });
}
