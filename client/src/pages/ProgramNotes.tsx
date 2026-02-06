import { useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useProgramContent } from "@/hooks/use-program";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { SupportedLanguage } from "@shared/schema";
import { motion } from "framer-motion";
import { ChevronLeft, Music, Info, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";

export default function ProgramNotes() {
  const [match, params] = useRoute("/program/:lang");
  const langCode = match ? params.lang : "en";

  const { data: dbLanguages } = useQuery<SupportedLanguage[]>({
    queryKey: [api.languages.list.path],
    queryFn: async () => {
      const res = await fetch(api.languages.list.path, { credentials: "include" });
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const language = dbLanguages?.find(l => l.code === langCode);
  const isRTL = language?.dir === "rtl";

  const { data: content, isLoading, error } = useProgramContent(langCode);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const displayContent = content || [];

  const getSectionContent = (sectionStart: string) => {
    return displayContent.filter(item => item.section.startsWith(sectionStart));
  };

  const titleSection = getSectionContent("title")[0];
  const composerSection = getSectionContent("composer")[0];
  const notesSections = displayContent.filter(item => !item.section.startsWith("title") && !item.section.startsWith("composer"));

  return (
    <div className={cn(
      "min-h-screen bg-[#FAF9F6] dark:bg-[#0a0a0a] pb-24",
      isRTL ? "font-sans" : "font-serif"
    )} dir={isRTL ? "rtl" : "ltr"}>
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-[#FAF9F6]/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md z-50 border-b border-border/40 shadow-sm">
        <div className="container max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            {isRTL ? <ChevronLeft className="w-5 h-5 rotate-180" /> : <ChevronLeft className="w-5 h-5" />}
            <span className="font-sans text-sm font-medium uppercase tracking-wider">
              {langCode === 'en' ? 'Back' : language?.nativeLabel || 'Back'}
            </span>
          </Link>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
             <span className="font-serif font-bold text-primary text-xs">SG</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="pt-24 px-6 pb-8 container max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-secondary/10 mb-6">
            <Music className="w-6 h-6 text-secondary-foreground/80" />
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold mb-4 text-foreground leading-tight">
            {titleSection?.content || "Program Title"}
          </h1>
          
          <p className="text-lg md:text-xl text-primary font-medium italic mb-8">
            {composerSection?.content || "Composer Name"}
          </p>

          <div className="h-px w-20 bg-border mx-auto" />
        </motion.div>
      </div>

      {/* Content Section */}
      <main className="container max-w-3xl mx-auto px-6">
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-5/6 mx-auto"></div>
            <div className="h-32 bg-muted rounded w-full mt-8"></div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="prose prose-lg dark:prose-invert mx-auto font-sans leading-relaxed text-muted-foreground"
          >
            {notesSections.map((item) => (
              <div
                key={item.id}
                className="mb-6"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.content) }}
                data-testid={`text-notes-${item.section}`}
              />
            ))}
          </motion.div>
        )}
      </main>

      {/* Sticky Bottom Nav for later phases */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 pointer-events-none">
        <div className="bg-foreground/90 text-background backdrop-blur-md rounded-full px-6 py-3 shadow-2xl flex items-center gap-6 pointer-events-auto scale-90 md:scale-100">
          <button className="flex flex-col items-center gap-1 text-xs opacity-100">
            <ScrollText className="w-5 h-5" />
            <span>Notes</span>
          </button>
          <div className="w-px h-8 bg-background/20" />
          <button className="flex flex-col items-center gap-1 text-xs opacity-50 hover:opacity-100 transition-opacity">
            <Info className="w-5 h-5" />
            <span>Info</span>
          </button>
        </div>
      </div>
    </div>
  );
}
