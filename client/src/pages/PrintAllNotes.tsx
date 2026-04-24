import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAdminSession } from "@/hooks/use-admin";
import { api } from "@shared/routes";
import { Loader2, Printer, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import DOMPurify from "dompurify";

type PrintLanguageData = {
  code: string;
  label: string;
  nativeLabel: string;
  dir: string;
  intro: string | null;
  pieces: { title: string; composer: string; notes: string; pieceOrder: number }[];
};

export default function PrintAllNotes() {
  const [_, setLocation] = useLocation();
  const { data: session, isLoading: sessionLoading } = useAdminSession();

  const { data, isLoading } = useQuery<{ languages: PrintLanguageData[] }>({
    queryKey: [api.printAll.path],
    queryFn: async () => {
      const res = await fetch(api.printAll.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load print data");
      return res.json();
    },
    enabled: !!session?.authenticated,
  });

  useEffect(() => {
    if (!sessionLoading && !session?.authenticated) {
      setLocation("/admin");
    }
  }, [session?.authenticated, sessionLoading, setLocation]);

  if (sessionLoading || !session?.authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const languages = data?.languages || [];
  const languagesWithContent = languages.filter(l => l.pieces.length > 0 || (l.intro && l.intro !== "<p></p>"));

  return (
    <div className="min-h-screen bg-white">
      <div className="print:hidden bg-background border-b border-border sticky top-0 z-50">
        <div className="container max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/dashboard")} data-testid="button-back-dashboard">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Button>
          </div>
          <Button onClick={handlePrint} disabled={isLoading || languagesWithContent.length === 0} data-testid="button-print">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 print:hidden">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading all notes...</span>
        </div>
      ) : languagesWithContent.length === 0 ? (
        <div className="flex items-center justify-center py-24 print:hidden">
          <p className="text-muted-foreground">No program notes available to print.</p>
        </div>
      ) : (
        <div className="print-content" data-testid="print-content">
          {languagesWithContent.map((lang, langIndex) => (
            <div
              key={lang.code}
              className={langIndex > 0 ? "break-before-page" : ""}
              dir={lang.dir === "rtl" ? "rtl" : "ltr"}
              data-testid={`print-section-${lang.code}`}
            >
              <div className="px-8 py-10 max-w-[700px] mx-auto">
                <div className="text-center mb-8 border-b border-gray-300 pb-6">
                  <h1 className="text-2xl font-bold text-black mb-1">
                    St. George's Choral Society
                  </h1>
                  <h2 className="text-xl font-semibold text-gray-700 mb-1">
                    Program Notes
                  </h2>
                  <p className="text-base text-gray-500">
                    {lang.label} {lang.code !== "en" && lang.nativeLabel ? `— ${lang.nativeLabel}` : ""}
                  </p>
                </div>

                {lang.intro && lang.intro !== "<p></p>" && (
                  <div className="mb-8">
                    <div
                      className="prose prose-sm max-w-none text-gray-600 italic leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lang.intro) }}
                    />
                    <div className="h-px bg-gray-200 mt-6" />
                  </div>
                )}

                {lang.pieces.map((piece, pieceIndex) => (
                  <div key={pieceIndex} className="mb-8">
                    {pieceIndex > 0 && (
                      <div className="h-px bg-gray-200 mb-8" />
                    )}
                    <div className={`mb-4 ${lang.dir === "rtl" ? "text-right" : "text-left"}`}>
                      <h3 className="text-lg font-bold text-black whitespace-pre-line">{piece.title}</h3>
                      <p className="text-sm text-gray-600 italic">{piece.composer}</p>
                    </div>
                    <div
                      className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(piece.notes) }}
                    />
                  </div>
                ))}

              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }
          .break-before-page { break-before: page; }
          .print-content { color: black; background: white; }
          @page { margin: 0.75in; size: letter; }
        }
      `}</style>
    </div>
  );
}
