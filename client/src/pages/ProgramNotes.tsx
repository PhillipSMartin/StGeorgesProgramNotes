import { useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useProgramPieces } from "@/hooks/use-program";
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

  const { data: pieces, isLoading } = useProgramPieces(langCode);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const displayPieces = pieces || [];

  return (
    <div className={cn(
      "min-h-screen bg-[#FAF9F6] dark:bg-[#0a0a0a] pb-24",
      isRTL ? "font-sans" : "font-serif"
    )} dir={isRTL ? "rtl" : "ltr"}>
      
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
            {langCode === 'en' ? 'Program Notes' : language?.nativeLabel || 'Program Notes'}
          </h1>
          
          <p className="text-lg text-muted-foreground">
            St. George's Choral Society
          </p>

          <div className="h-px w-20 bg-border mx-auto mt-6" />
        </motion.div>
      </div>

      <main className="container max-w-3xl mx-auto px-6">
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-5/6 mx-auto"></div>
            <div className="h-32 bg-muted rounded w-full mt-8"></div>
          </div>
        ) : displayPieces.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No program notes available for this language yet.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {displayPieces.map((piece, index) => (
              <motion.article
                key={piece.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.15, duration: 0.6 }}
                data-testid={`piece-${piece.id}`}
              >
                {index > 0 && (
                  <div className="flex items-center justify-center mb-8">
                    <div className="h-px w-16 bg-border" />
                    <Music className="w-4 h-4 mx-3 text-muted-foreground/50" />
                    <div className="h-px w-16 bg-border" />
                  </div>
                )}

                <div className="text-center mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2" data-testid={`text-piece-title-${piece.id}`}>
                    {piece.title}
                  </h2>
                  <p className="text-lg text-primary font-medium italic" data-testid={`text-piece-composer-${piece.id}`}>
                    {piece.composer}
                  </p>
                </div>

                <div
                  className="prose prose-lg dark:prose-invert mx-auto font-sans leading-relaxed text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(piece.notes) }}
                  data-testid={`text-piece-notes-${piece.id}`}
                />
              </motion.article>
            ))}
          </div>
        )}
      </main>

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
