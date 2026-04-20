import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Mail, MessageCircle, Clock, MapPin, Send } from 'lucide-react';

export default function Contact() {
  return (
    <MarketingLayout>
      <div className="text-center py-12 max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          Contact Us
        </h1>
        <p className="text-lg text-muted-foreground">
          Need help, want a demo, or have feedback? Reach us through the channels below. We are always here to help your team succeed.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5 mt-8 max-w-6xl mx-auto">
        {/* Contact Information Cards (Left Col) */}
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Get in touch</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="mt-1 bg-primary/10 p-2.5 rounded-lg text-primary ring-1 ring-primary/20">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Email Support</h3>
                  <p className="text-sm text-muted-foreground">For technical questions and account help.</p>
                  <a href="mailto:support@synergy.dev" className="text-sm text-primary hover:underline mt-1 inline-block">support@synergy.dev</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 bg-accent/10 p-2.5 rounded-lg text-accent ring-1 ring-accent/20">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Sales Inquiries</h3>
                  <p className="text-sm text-muted-foreground">For enterprise pricing and custom setups.</p>
                  <a href="mailto:sales@synergy.dev" className="text-sm text-accent hover:underline mt-1 inline-block">sales@synergy.dev</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 bg-ide-warning/10 p-2.5 rounded-lg text-ide-warning ring-1 ring-ide-warning/20">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Response Time</h3>
                  <p className="text-sm text-muted-foreground">We aim to respond to all inquiries within 24 hours during business days.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 bg-ide-success/10 p-2.5 rounded-lg text-ide-success ring-1 ring-ide-success/20">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Headquarters</h3>
                  <p className="text-sm text-muted-foreground">123 Cloud Avenue, Tech District<br />San Francisco, CA 94105</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Contact Form (Right Col) */}
        <div className="lg:col-span-3">
          <section className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-8 shadow-xl h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
            
            <h2 className="text-2xl font-bold mb-6 relative z-10">Send a Message</h2>
            <form className="space-y-5 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">First Name</label>
                  <input
                    type="text"
                    placeholder="Jane"
                    className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Last Name</label>
                  <input
                    type="text"
                    placeholder="Doe"
                    className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <input
                  type="email"
                  placeholder="jane@example.com"
                  className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Subject</label>
                <select className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none">
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="sales">Sales & Enterprise</option>
                  <option value="feedback">Product Feedback</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Message</label>
                <textarea
                  placeholder="How can we help you today?"
                  rows={5}
                  className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                />
              </div>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all mt-4"
              >
                Send Message <Send className="w-4 h-4" />
              </button>
            </form>
          </section>
        </div>
      </div>
    </MarketingLayout>
  );
}
