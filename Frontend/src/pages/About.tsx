import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Target, Lightbulb, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <MarketingLayout>
      <div className="text-center py-12 md:py-20 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-foreground">
          About Synergy
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Synergy helps developers collaborate naturally, from the first commit to pushing updates live globally. We believe the distance between an idea and a shipped product should be exactly zero.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3 mt-8">
        <section className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Target className="w-24 h-24 text-primary" />
          </div>
          <div className="mb-6 inline-flex rounded-xl bg-primary/10 p-3 text-primary ring-1 ring-primary/20">
            <Target className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed relative z-10">
            We built Synergy to remove the friction between coding, collaboration, and delivery. Instead of switching
            tools all day, teams can work in one shared environment with real-time editing and communication.
          </p>
        </section>

        <section className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Lightbulb className="w-24 h-24 text-accent" />
          </div>
          <div className="mb-6 inline-flex rounded-xl bg-accent/10 p-3 text-accent ring-1 ring-accent/20">
            <Lightbulb className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
          <p className="text-muted-foreground leading-relaxed relative z-10">
            A world where software development is instantly accessible to anyone with a browser, unbound by local hardware limits, creating a truly global engineering culture.
          </p>
        </section>

        <section className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-8 shadow-sm">
          <div className="mb-6 inline-flex rounded-xl bg-destructive/10 p-3 text-destructive ring-1 ring-destructive/20">
            <Heart className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Our Values</h2>
          <ul className="space-y-4 text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
              Developer-first workflows
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
              Fast feedback loops
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
              Simple and reliable deployment
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
              Collaboration that feels natural
            </li>
          </ul>
        </section>
      </div>

      <div className="mt-20 text-center">
         <Link to="/contact" className="inline-flex items-center text-primary font-medium hover:text-primary/80 transition-colors">
            Have questions about our team? Get in touch <ArrowRight className="w-4 h-4 ml-1" />
         </Link>
      </div>
    </MarketingLayout>
  );
}
