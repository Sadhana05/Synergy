import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background/60 backdrop-blur-xl mt-20 relative z-10 w-full overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
      <div className="mx-auto w-full max-w-7xl px-6 py-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-primary text-2xl font-mono font-bold">&lt;/&gt;</span>
              <span className="font-bold text-xl tracking-tight">Synergy</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              A collaborative coding workspace where teams write, run, and deploy projects together in real time. Built for speed.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Product</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/why-synergy" className="hover:text-primary transition-colors">Features</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Documentation</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Company</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Careers</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Legal</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Synergy Dev Inc. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-primary transition-colors font-medium">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors font-medium">GitHub</a>
            <a href="#" className="hover:text-primary transition-colors font-medium">Discord</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
