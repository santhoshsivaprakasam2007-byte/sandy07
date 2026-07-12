import Link from "next/link";
import { Button } from "../components/ui/button";

export default function LandingPage() {
  return (
    <div className="bg-background min-h-screen text-on-background flex flex-col font-body-md overflow-x-hidden">
      {/* Navigation */}
      <nav className="flex justify-between items-center w-full px-container-margin py-md sticky top-0 bg-background/80 backdrop-blur-md z-50 border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-md">
            <span
              className="material-symbols-outlined text-white text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_stories
            </span>
          </div>
          <span className="font-headline-sm font-bold text-primary tracking-tight">Cognitive Clarity</span>
        </div>
        <div className="hidden md:flex gap-6 items-center">
          <Link href="#features" className="text-on-surface-variant hover:text-primary transition-colors font-medium">Features</Link>
          <Link href="#how-it-works" className="text-on-surface-variant hover:text-primary transition-colors font-medium">How it Works</Link>
          <Link href="#testimonials" className="text-on-surface-variant hover:text-primary transition-colors font-medium">Testimonials</Link>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/login" className="text-on-surface hover:text-primary transition-colors font-medium hidden md:block">
            Log in
          </Link>
          <Link href="/signup">
            <Button className="rounded-full bg-primary hover:bg-primary/90 text-on-primary">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-container-margin py-32 md:py-48 flex flex-col items-center text-center">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
          <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] opacity-20 blur-[120px] bg-primary rounded-full z-0"></div>
          <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] opacity-20 blur-[100px] bg-secondary rounded-full z-0"></div>
        </div>

        <div className="relative z-10 max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-on-surface leading-tight">
            Master your mind. <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Ace your academics.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-on-surface-variant mb-10 max-w-2xl mx-auto font-body-lg">
            The ultimate productivity OS designed specifically for high-performing students. Plan, focus, and track your way to academic excellence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="rounded-full px-8 h-14 text-lg bg-primary hover:bg-primary/90 w-full sm:w-auto shadow-lg shadow-primary/25">
                Start for free
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg w-full sm:w-auto border-outline hover:bg-surface-container-low">
                Explore features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-container-margin bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to succeed</h2>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">We've combined the best productivity methodologies into one seamless experience.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-2xl border border-outline-variant/30 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary text-[24px]">calendar_month</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Study Planner</h3>
              <p className="text-on-surface-variant">Organize your syllabus, assignments, and exams. Our intelligent system helps you prioritize high-impact tasks.</p>
            </div>
            
            <div className="glass-card p-8 rounded-2xl border border-outline-variant/30 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-secondary text-[24px]">timer</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Deep Focus Timer</h3>
              <p className="text-on-surface-variant">Enter flow state with our built-in Pomodoro timer. Block distractions and track your deep work sessions.</p>
            </div>
            
            <div className="glass-card p-8 rounded-2xl border border-outline-variant/30 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 rounded-lg bg-tertiary/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-tertiary text-[24px]">insights</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Progress Analytics</h3>
              <p className="text-on-surface-variant">Visualize your study habits. Track your streaks, study hours, and completion rates to stay motivated.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-container-margin">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="md:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Built on cognitive science</h2>
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center shrink-0">1</div>
                <div>
                  <h4 className="text-xl font-bold mb-2">Capture</h4>
                  <p className="text-on-surface-variant">Get everything out of your head. Add tasks, deadlines, and reading assignments instantly.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center shrink-0">2</div>
                <div>
                  <h4 className="text-xl font-bold mb-2">Organize</h4>
                  <p className="text-on-surface-variant">Group by subject, set priorities, and schedule your week with our intuitive drag-and-drop interface.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center shrink-0">3</div>
                <div>
                  <h4 className="text-xl font-bold mb-2">Execute</h4>
                  <p className="text-on-surface-variant">Use the focus timer to knock out tasks one by one. Build momentum and watch your analytics grow.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="md:w-1/2 w-full">
            <div className="aspect-square md:aspect-[4/3] rounded-2xl bg-surface-container border border-outline-variant/20 shadow-2xl relative overflow-hidden">
               {/* Decorative mock UI */}
               <div className="absolute inset-4 rounded-xl border border-outline-variant/10 bg-surface shadow-sm flex flex-col">
                  <div className="h-12 border-b border-outline-variant/10 flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col gap-4">
                    <div className="h-8 w-1/3 bg-surface-container rounded-md"></div>
                    <div className="h-24 w-full bg-primary/10 rounded-xl border border-primary/20 mt-4"></div>
                    <div className="h-16 w-full bg-surface-container rounded-xl"></div>
                    <div className="h-16 w-full bg-surface-container rounded-xl"></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-container-margin bg-gradient-to-br from-primary to-secondary text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">Ready to transform your grades?</h2>
          <p className="text-xl text-white/80 mb-10">Join thousands of students who are already studying smarter, not harder.</p>
          <Link href="/signup">
            <Button size="lg" className="rounded-full px-10 h-14 text-lg bg-white text-primary hover:bg-white/90 shadow-xl transition-transform hover:scale-105 active:scale-95">
              Create your free account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-container-margin bg-surface-container-lowest border-t border-outline-variant/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary text-[24px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_stories
            </span>
            <span className="font-bold text-lg">Cognitive Clarity</span>
          </div>
          <div className="flex gap-6 text-sm text-on-surface-variant">
            <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-primary transition-colors">Contact</Link>
          </div>
          <p className="text-sm text-on-surface-variant">© {new Date().getFullYear()} Cognitive Clarity. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
