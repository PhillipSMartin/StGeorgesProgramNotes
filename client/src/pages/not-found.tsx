import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FAF9F6] dark:bg-[#0a0a0a] p-4">
      <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full shadow-lg text-center">
        <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-destructive" />
        </div>
        
        <h1 className="text-2xl font-serif font-bold text-foreground mb-2">404 Page Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The page you are looking for does not exist or has been moved.
        </p>

        <Link href="/" className="inline-flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors">
          Return to Home
        </Link>
      </div>
    </div>
  );
}
