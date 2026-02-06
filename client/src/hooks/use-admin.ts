import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { api, type AdminLoginInput, type AdminChangePasswordInput } from "@shared/routes";
import type { SupportedLanguage, InsertSupportedLanguage, ProgramPiece, ProgramIntro } from "@shared/schema";

export function useAdminSession() {
  return useQuery<{ authenticated: boolean }>({
    queryKey: [api.admin.session.path],
    queryFn: async () => {
      const res = await fetch(api.admin.session.path, { credentials: "include" });
      return res.json();
    },
    staleTime: 1000 * 60,
  });
}

export function useAdminLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AdminLoginInput) => {
      const res = await apiRequest("POST", api.admin.login.path, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.session.path] });
    },
  });
}

export function useAdminLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", api.admin.logout.path);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.session.path] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: AdminChangePasswordInput) => {
      const res = await apiRequest("POST", api.admin.changePassword.path, data);
      return res.json();
    },
  });
}

export function useAdminLanguages() {
  return useQuery<SupportedLanguage[]>({
    queryKey: [api.languages.adminList.path],
    queryFn: async () => {
      const res = await fetch(api.languages.adminList.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch languages");
      return res.json();
    },
  });
}

export function useCreateLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertSupportedLanguage) => {
      const res = await apiRequest("POST", api.languages.create.path, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.languages.adminList.path] });
      queryClient.invalidateQueries({ queryKey: [api.languages.list.path] });
    },
  });
}

export function useDeleteLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/languages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.languages.adminList.path] });
      queryClient.invalidateQueries({ queryKey: [api.languages.list.path] });
    },
  });
}

export function useUpdateLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<InsertSupportedLanguage> }) => {
      const res = await apiRequest("PUT", `/api/admin/languages/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.languages.adminList.path] });
      queryClient.invalidateQueries({ queryKey: [api.languages.list.path] });
    },
  });
}

export function useAdminIntro(language: string) {
  return useQuery<ProgramIntro | null>({
    queryKey: [api.intro.get.path, language],
    queryFn: async () => {
      const res = await fetch(`${api.intro.get.path}?language=${encodeURIComponent(language)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch intro");
      return res.json();
    },
    enabled: !!language,
  });
}

export function useAdminPieces(language: string) {
  return useQuery<ProgramPiece[]>({
    queryKey: [api.adminPieces.list.path, language],
    queryFn: async () => {
      const res = await fetch(`${api.adminPieces.list.path}?language=${encodeURIComponent(language)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch pieces");
      return res.json();
    },
    enabled: !!language,
  });
}

export function useSavePieces() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { language: string; intro?: string; pieces: { id?: number; title: string; composer: string; notes: string; pieceOrder: number }[] }) => {
      const res = await apiRequest("POST", api.adminPieces.save.path, data);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.adminPieces.list.path, variables.language] });
      queryClient.invalidateQueries({ queryKey: [api.pieces.list.path, variables.language] });
      queryClient.invalidateQueries({ queryKey: [api.intro.get.path, variables.language] });
    },
  });
}

export function useDeletePiece() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/pieces/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.adminPieces.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.pieces.list.path] });
    },
  });
}

export function usePublishPieces() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (language: string) => {
      const res = await apiRequest("POST", api.adminPieces.publish.path, { language });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.adminPieces.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.pieces.list.path] });
    },
  });
}

export function useUnpublishPieces() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (language: string) => {
      const res = await apiRequest("POST", api.adminPieces.unpublish.path, { language });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.adminPieces.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.pieces.list.path] });
    },
  });
}

export function useTranslatePieces() {
  return useMutation({
    mutationFn: async (data: { targetLanguage: string; targetLanguageLabel: string }) => {
      const res = await apiRequest("POST", api.adminPieces.translate.path, data);
      return res.json() as Promise<{ intro?: string; pieces: { title: string; composer: string; notes: string }[] }>;
    },
  });
}
