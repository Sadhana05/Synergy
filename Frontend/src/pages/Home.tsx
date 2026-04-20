import { Link } from 'react-router-dom';
import { Users, Rocket, Shield, Code2, ArrowRight, Zap, Target } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';

const highlights = [
  {
    title: 'Real-time collaboration',
    description: 'Code together with live cursors, instant updates, and shared workspace activity without missing a beat.',
    icon: Users,
  },
  {
    title: 'One-click deployment',
    description: 'Deploy static and frontend projects directly from your workspace and get a live link instantly.',
    icon: Rocket,
  },
  {
    title: 'Secure edge access',
    description: 'Invite members securely with granular roles and keep your workspace-level permissions perfectly isolated.',
    icon: Shield,
  },
  {
    title: 'Built by developers',
    description: 'Integrated blazing-fast editor, terminal, chat, and automated QA tools right inside your browser.',
    icon: Code2,
  },
  {
    title: 'Unmatched speed',
    description: 'Vite-powered environment offering HMR natively, so your preview is always up strictly to the millisecond.',
    icon: Zap,
  },
  {
    title: 'Precision tooling',
    description: 'Full TypeScript support out-of-the-box ensuring type-safety as your team scales their monolithic apps.',
    icon: Target,
  },
];

export default function Home() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="text-center py-20 pb-16 flex flex-col items-center relative">
         <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground mb-6 drop-shadow-sm">
           Build Faster With <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent relative">
             Synergy
             <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent rounded-full opacity-50 blur-sm" />
           </span>
         </h1>
         <p className="max-w-2xl text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed font-medium">
           A collaborative coding workspace where teams write, run, and deploy projects together in real time. Experience the future of team programming.
         </p>
         <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full sm:w-auto">
            <Link to="/signup" className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all">
              Start Building <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/why-synergy" className="w-full sm:w-auto rounded-full border border-border/60 bg-card/50 backdrop-blur-md px-8 py-3.5 text-base font-medium hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all">
              Discover Features
            </Link>
         </div>
      </section>

      {/* Grid Section */}
      <section className="mt-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need to ship</h2>
          <p className="text-muted-foreground">Zero configuration. Total power. Complete collaboration.</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="group rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-8 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:bg-card/60 transition-all duration-300">
                <div className="mb-6 inline-flex rounded-xl bg-primary/10 p-3.5 text-primary ring-1 ring-primary/20 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 transition-all duration-300">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight mb-3 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Stats Section */}
      <section className="mt-24 border-y border-border/50 bg-primary/5 py-16 backdrop-blur-md -mx-6 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
          <div>
            <div className="text-4xl md:text-5xl font-black text-primary mb-2">10k+</div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Developers</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-black text-primary mb-2">50M</div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Lines of Code</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-black text-primary mb-2">99.9%</div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Uptime</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-black text-primary mb-2">&lt; 1s</div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Deploy Time</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mt-24 mb-10 bg-card/60 border border-border/50 rounded-3xl p-12 text-center backdrop-blur-md relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Ready to empower your team?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Join thousands of leading engineering teams building the future on Synergy. Free for individuals and small teams.</p>
          <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all">
            Get Started for Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
