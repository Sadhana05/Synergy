import Navbar from './Navbar';
import Footer from './Footer';

type MarketingLayoutProps = {
  children: React.ReactNode;
};

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] opacity-30 pointer-events-none bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/20 via-background to-background" />

      <Navbar />
      <main className="flex-1 w-full mx-auto max-w-7xl px-6 py-12 relative z-10 flex flex-col min-h-[calc(100vh-80px-350px)]">
        {children}
      </main>
      <Footer />
    </div>
  );
}
