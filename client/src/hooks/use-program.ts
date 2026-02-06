import { useQuery, useMutation } from "@tanstack/react-query";
import { api, type TrackingLogInput } from "@shared/routes";
import type { ProgramPiece, ProgramIntro } from "@shared/schema";

export function useProgramIntro(language: string) {
  return useQuery<ProgramIntro | null>({
    queryKey: [api.intro.get.path, language],
    queryFn: async () => {
      const url = `${api.intro.get.path}?language=${encodeURIComponent(language)}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch intro");
      return res.json();
    },
    staleTime: 1000 * 60 * 60,
  });
}

export function useProgramPieces(language: string) {
  return useQuery<ProgramPiece[]>({
    queryKey: [api.pieces.list.path, language],
    queryFn: async () => {
      const url = `${api.pieces.list.path}?language=${encodeURIComponent(language)}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch program pieces");
      return res.json();
    },
    staleTime: 1000 * 60 * 60,
  });
}

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
