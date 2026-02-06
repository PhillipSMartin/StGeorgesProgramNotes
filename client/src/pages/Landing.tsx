import { useState } from "react";
import { useLocation } from "wouter";
import { LanguageSelector, type LanguageOption } from "@/components/LanguageSelector";
import { useLogLanguageSelection } from "@/hooks/use-program";
import { motion } from "framer-motion";

export default function Landing() {
  const [_, setLocation] = useLocation();
  const { mutateAsync: logSelection, isPending } = useLogLanguageSelection();

  const handleLanguageSelect = async (lang: LanguageOption) => {
    try {
      // Log selection to backend (fire and forget basically, but we await to ensure order)
      await logSelection({
        eventType: "language_selected",
        payload: { language: lang.code },
      });
    } catch (error) {
      console.error("Failed to log language selection:", error);
    } finally {
      // Navigate regardless of logging success
      setLocation(`/program/${lang.code}`);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF9F6] dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary" />
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center mb-8 max-w-md mx-auto relative z-10"
      >
        {/* Placeholder for Logo - styled text for now */}
        <div className="mb-4 mx-auto w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
           <span className="text-2xl font-serif text-white italic font-bold">SG</span>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground tracking-tight mb-2">
          St. George's <br/>
          <span className="text-primary italic">Choral Society</span>
        </h1>
        
        <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-secondary to-transparent mx-auto my-4" />
        
        <p className="text-muted-foreground font-light text-base tracking-wide">
          Welcome to tonight's performance. <br className="hidden sm:block"/> Please select your preferred language.
        </p>
      </motion.div>

      <div className="w-full relative z-10">
        <LanguageSelector onSelect={handleLanguageSelect} isLoading={isPending} />
      </div>

      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="mt-16 text-center text-xs text-muted-foreground uppercase tracking-widest"
      >
        © 2024 St. George's Choral Society
      </motion.footer>
    </div>
  );
}
