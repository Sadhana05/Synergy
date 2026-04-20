import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Users, Code2, Rocket, History, Layout, Shield } from 'lucide-react';

const reasons = [
  {
    title: 'Live coding with your team',
    description: 'See edits instantly, track active collaborators, and resolve issues together without waiting. Pair programming has never felt this natural.',
    icon: Users,
    color: 'text-primary',
    bg: 'bg-primary/10',
    ring: 'ring-primary/20'
  },
  {
    title: 'Terminal, chat, and editor in one place',
    description: 'Run commands, discuss changes, and write code without context switching across different tools. Everything lives in the browser.',
    icon: Code2,
    color: 'text-accent',
    bg: 'bg-accent/10',
    ring: 'ring-accent/20'
  },
  {
    title: 'Built-in deployments',
    description: 'Deploy projects directly and share links quickly for reviews, demos, and testing. Turn localhost into a public URL instantly.',
    icon: Rocket,
    color: 'text-ide-success',
    bg: 'bg-ide-success/10',
    ring: 'ring-ide-success/20'
  },
  {
    title: 'Snapshot and restore workflow',
    description: 'Capture important project states and roll back safely when needed. Fearless refactoring is now a reality.',
    icon: History,
    color: 'text-ide-warning',
    bg: 'bg-ide-warning/10',
    ring: 'ring-ide-warning/20'
  },
  {
    title: 'Flexible Workspace Layouts',
    description: 'Dock terminals, split editors, and customize your layout exactly how you want it. Your perfect IDE configuration, saved in the cloud.',
    icon: Layout,
    color: 'text-[#38BDF8]',
    bg: 'bg-[#38BDF8]/10',
    ring: 'ring-[#38BDF8]/20'
  },
  {
    title: 'Enterprise-grade Security',
    description: 'Your code is safe with us. End-to-end encryption for live sessions and strict role-based access controls for your entire team.',
    icon: Shield,
    color: 'text-ide-info',
    bg: 'bg-ide-info/10',
    ring: 'ring-ide-info/20'
  },
];

export default function WhySynergy() {
  return (
    <MarketingLayout>
      <div className="text-center py-12 md:py-20 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-foreground">
          Why Synergy?
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Because great software is built by teams that can move together, not by tools that slow them down. Discover the unfair advantage of cloud-native collaboration.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        {reasons.map((reason) => (
          <article 
            key={reason.title} 
            className="group rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-8 shadow-sm hover:shadow-lg hover:bg-card/60 transition-all duration-300"
          >
            <div className={`mb-6 inline-flex rounded-xl p-3 ring-1 ${reason.bg} ${reason.color} ${reason.ring} group-hover:scale-110 transition-transform duration-300`}>
              <reason.icon className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold mb-3">{reason.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{reason.description}</p>
          </article>
        ))}
      </div>
    </MarketingLayout>
  );
}
