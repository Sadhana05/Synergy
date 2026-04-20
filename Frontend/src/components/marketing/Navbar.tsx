import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Navbar() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          <span className="text-primary text-2xl font-mono font-bold">&lt;/&gt;</span>
          <span className="font-bold text-xl tracking-tight">Synergy</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <Link to="/about" className="hover:text-primary transition-colors">About</Link>
          <Link to="/why-synergy" className="hover:text-primary transition-colors">Why Synergy</Link>
          <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
        </nav>

        <div className="flex items-center gap-4 text-sm">
          {isAuthenticated ? (
            <Link to="/dashboard" className="rounded-full bg-primary/10 px-4 py-2 text-primary font-medium hover:bg-primary/20 transition-colors">
              Dashboard
            </Link>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <Link to="/signin" className="font-medium hover:text-primary transition-colors">
                Sign In
              </Link>
              <Link to="/signup" className="rounded-full bg-primary px-4 py-2 text-primary-foreground font-medium shadow-md shadow-primary/20 hover:bg-primary/90 transition-all">
                Get Started
              </Link>
            </div>
          )}
          <div className="pl-2 border-l border-border/50">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
