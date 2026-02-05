import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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

export const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English", dir: "ltr" },
  { code: "es", label: "Spanish", nativeLabel: "Español", dir: "ltr" },
  { code: "zh", label: "Chinese", nativeLabel: "简体中文", dir: "ltr" },
  { code: "fa", label: "Farsi", nativeLabel: "فارسی", dir: "rtl" },
];

export function LanguageSelector({ onSelect, isLoading }: LanguageSelectorProps) {
  return (
    <div className="grid gap-4 w-full max-w-sm mx-auto">
      {LANGUAGES.map((lang, index) => (
        <motion.button
          key={lang.code}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          onClick={() => onSelect(lang)}
          disabled={isLoading}
          className={cn(
            "group relative overflow-hidden rounded-xl border border-border bg-white/50 p-6 text-left transition-all duration-300 hover:border-primary/50 hover:bg-white hover:shadow-lg hover:shadow-primary/5",
            "active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
            "dark:bg-card dark:hover:bg-accent/10"
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-sm font-medium uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
                {lang.label}
              </span>
              <span className={cn(
                "block mt-1 text-2xl font-serif text-foreground font-medium",
                lang.code === 'fa' && "font-sans" // Use standard font for Farsi to ensure readability
              )}>
                {lang.nativeLabel}
              </span>
            </div>
            
            {/* Elegant decorative element */}
            <div className="h-8 w-8 rounded-full border border-primary/20 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
              <span className="text-primary text-lg">→</span>
            </div>
          </div>
          
          {/* Subtle gradient background on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </motion.button>
      ))}
    </div>
  );
}
