import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { SupportedLanguage } from "@shared/schema";

export interface LanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
  dir: "ltr" | "rtl";
}

interface LanguageSelectorProps {
  onSelect: (lang: LanguageOption) => void;
  isLoading?: boolean;
}

export function LanguageSelector({ onSelect, isLoading }: LanguageSelectorProps) {
  const { data: dbLanguages, isLoading: langsLoading } = useQuery<SupportedLanguage[]>({
    queryKey: [api.languages.list.path],
    queryFn: async () => {
      const res = await fetch(api.languages.list.path, { credentials: "include" });
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const languages: LanguageOption[] = dbLanguages
    ? dbLanguages.map(l => ({
        code: l.code,
        label: l.label,
        nativeLabel: l.nativeLabel,
        dir: l.dir as "ltr" | "rtl",
      }))
    : [];

  if (langsLoading) {
    return (
      <div className="grid gap-2 w-full max-w-sm mx-auto">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-14 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-2 w-full max-w-sm mx-auto">
      {languages.map((lang, index) => (
        <motion.button
          key={lang.code}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.4 }}
          onClick={() => onSelect(lang)}
          disabled={isLoading}
          data-testid={`button-language-${lang.code}`}
          className={cn(
            "group relative overflow-hidden rounded-lg border border-border bg-white/50 p-4 text-left transition-all duration-200 hover:border-primary/50 hover:bg-white hover:shadow-md hover:shadow-primary/5",
            "active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed",
            "dark:bg-card dark:hover:bg-accent/10"
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors whitespace-nowrap">
                {lang.label}
              </span>
              <span className={cn(
                "text-xl font-serif text-foreground font-bold",
                lang.dir === 'rtl' && "font-sans"
              )}>
                {lang.nativeLabel}
              </span>
            </div>
            
            <div className="h-6 w-6 rounded-full border border-primary/20 flex items-center justify-center opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shrink-0">
              <span className="text-primary text-sm">→</span>
            </div>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </motion.button>
      ))}
    </div>
  );
}
