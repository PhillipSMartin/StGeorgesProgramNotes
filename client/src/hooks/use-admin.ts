import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { api, type AdminLoginInput, type AdminChangePasswordInput } from "@shared/routes";
import type { SupportedLanguage, InsertSupportedLanguage, ProgramContent, ContentVersion } from "@shared/schema";

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

export function useAdminContent(language: string) {
  return useQuery<ProgramContent[]>({
    queryKey: [api.adminContent.list.path, language],
    queryFn: async () => {
      const res = await fetch(`${api.adminContent.list.path}?language=${encodeURIComponent(language)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch content");
      return res.json();
    },
    enabled: !!language,
  });
}

export function useSaveContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { language: string; sections: { section: string; content: string; order?: number }[] }) => {
      const res = await apiRequest("POST", api.adminContent.save.path, data);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.adminContent.list.path, variables.language] });
      queryClient.invalidateQueries({ queryKey: [api.content.list.path, variables.language] });
    },
  });
}

export function usePublishContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (language: string) => {
      const res = await apiRequest("POST", api.adminContent.publish.path, { language });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.adminContent.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.content.list.path] });
    },
  });
}

export function useUnpublishContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (language: string) => {
      const res = await apiRequest("POST", api.adminContent.unpublish.path, { language });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.adminContent.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.content.list.path] });
    },
  });
}

export function useContentVersions(language: string, section: string) {
  return useQuery<ContentVersion[]>({
    queryKey: [api.adminContent.versions.path, language, section],
    queryFn: async () => {
      const res = await fetch(`${api.adminContent.versions.path}?language=${encodeURIComponent(language)}&section=${encodeURIComponent(section)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch versions");
      return res.json();
    },
    enabled: !!language && !!section,
  });
}

export function useTranslateContent() {
  return useMutation({
    mutationFn: async (data: { targetLanguage: string; targetLanguageLabel: string }) => {
      const res = await apiRequest("POST", api.adminContent.translate.path, data);
      return res.json() as Promise<{ title: string; composer: string; notes: string }>;
    },
  });
}
