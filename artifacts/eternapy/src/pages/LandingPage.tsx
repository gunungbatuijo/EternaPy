import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { Terminal, Code2, Cpu, Trophy, Zap, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-20 md:py-32 px-4 container mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            New Python Mastery Course Available
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Master Programming.<br/>
            <span className="text-primary">No Fluff. Just Code.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            EternaPy is the interactive learning platform for developers who take their craft seriously. Structured courses, real coding challenges, and AI-guided hints.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="h-14 px-8 text-lg w-full sm:w-auto" asChild>
              <Link href="/sign-up">Start Learning for Free</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full sm:w-auto" asChild>
              <Link href="/courses">Explore Courses</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">Join thousands of developers leveling up their skills.</p>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card/50 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why learn on EternaPy?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">We cut out the noise and focus on what actually makes you a better developer: writing code, solving problems, and understanding the core concepts.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-background p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Interactive Coding</h3>
              <p className="text-muted-foreground">Don't just watch videos. Write real code in our browser-based editor, run it, and get instant feedback from our test suites.</p>
            </div>
            <div className="bg-background p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Eternal AI Assistant</h3>
              <p className="text-muted-foreground">Stuck on a problem? Our AI won't give you the answer, but it will guide you toward it with contextual hints and explanations.</p>
            </div>
            <div className="bg-background p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Earn Your Progress</h3>
              <p className="text-muted-foreground">Gain XP, level up, build streaks, and unlock achievements. A gamified experience that respects your intelligence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 container mx-auto text-center">
        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-12 max-w-4xl mx-auto relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-10">
            <ShieldCheck className="w-64 h-64 text-primary" />
          </div>
          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to write better code?</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Start with our free beginner courses, or unlock the entire platform with EternaPy Pro.
            </p>
            <Button size="lg" className="h-12 px-8 mt-4" asChild>
              <Link href="/sign-up">Create Your Free Account</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
