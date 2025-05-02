import Image from 'next/image';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, User, ArrowRight, ShieldAlert, Zap, Users, MapPin } from 'lucide-react'; // Added more icons

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-secondary/50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary mr-6">
                <ShieldAlert className="h-7 w-7" />
                <span>FixIt Local</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" asChild><Link href="#features">Features</Link></Button>
                <Button variant="ghost" asChild><Link href="#how-it-works">How It Works</Link></Button>
                <Button variant="ghost" asChild><Link href="#get-started">Get Started</Link></Button>
            </nav>
             <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/login/citizen">Citizen Login</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/login/admin">Admin Login</Link>
                </Button>
             </div>
             {/* Mobile nav could be added here later */}
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-grow flex flex-col items-center justify-center text-center container mx-auto px-4 py-20 md:py-32">
        <Badge variant="secondary" className="mb-4 py-1 px-3 text-sm rounded-full shadow-sm">
            Your Community Reporting Hub
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight max-w-4xl">
          Spot an issue? <span className="text-primary">Report it easily.</span> Get it resolved.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
          Empowering citizens to report local problems like potholes, broken streetlights, and more. Help make your community better, together.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" asChild className="shadow-md hover:shadow-lg transition-shadow">
            <Link href="/citizen/dashboard/report">
              Report an Issue Now <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
           <Button size="lg" variant="secondary" asChild className="shadow-md hover:shadow-lg transition-shadow">
             <Link href="#how-it-works">
               Learn How It Works
             </Link>
           </Button>
        </div>
      </section>

       {/* Features Section */}
      <section id="features" className="py-20 bg-card/50 border-t border-b">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-16">Why Use FixIt Local?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="h-10 w-10 text-primary mb-4" />}
              title="Simple & Fast Reporting"
              description="Submit issues in seconds with descriptions, types, photos, and precise locations using your device."
              imageUrl="https://picsum.photos/seed/feature1/400/250"
              imageHint="mobile map report"
            />
            <FeatureCard
              icon={<Users className="h-10 w-10 text-primary mb-4" />}
              title="Track Progress Transparently"
              description="Stay updated on the status of your reported issues, from 'Pending' through 'In Progress' to 'Resolved'."
              imageUrl="https://picsum.photos/seed/feature2/400/250"
              imageHint="dashboard progress update"
            />
            <FeatureCard
              icon={<MapPin className="h-10 w-10 text-primary mb-4" />}
              title="Direct Community Impact"
              description="Be an active participant in improving your neighborhood and city infrastructure by highlighting areas needing attention."
              imageUrl="https://picsum.photos/seed/feature3/400/250"
              imageHint="community hands together"
            />
          </div>
        </div>
      </section>

       {/* How It Works Section */}
       <section id="how-it-works" className="py-20 bg-background">
         <div className="container mx-auto px-4 text-center">
           <h2 className="text-3xl font-bold text-foreground mb-16">How It Works - 3 Easy Steps</h2>
           <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-12 md:gap-8 max-w-5xl mx-auto">
                {/* Dashed line connecting steps on larger screens */}
                <div className="absolute top-16 left-1/2 -translate-x-1/2 md:top-1/2 md:left-0 md:right-0 md:-translate-x-0 w-px md:w-full h-[calc(100%-8rem)] md:h-px border-l-2 md:border-l-0 md:border-t-2 border-primary/50 border-dashed -z-0"></div>

             <StepCard number="1" title="Report Issue" description="Log in, describe the issue, select type/priority, add photo, and confirm location." />
             <StepCard number="2" title="Admin Review" description="City admins review the report, verify details, set priority, and assign it for resolution." />
             <StepCard number="3" title="Resolution & Update" description="Relevant departments fix the issue. The status is updated to 'Resolved', notifying the reporter." />
           </div>
         </div>
       </section>

       {/* Get Started Section */}
       <section id="get-started" className="py-20 bg-secondary/50 border-t">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl font-bold text-foreground mb-6">Ready to Make a Difference?</h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Join your neighbors in making our community a better place. Log in or sign up to start reporting.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Button size="lg" asChild>
                        <Link href="/login/citizen">
                            <User className="mr-2 h-5 w-5" /> Citizen Login
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                        <Link href="/login/admin">
                            <Building className="mr-2 h-5 w-5" /> Admin Login
                        </Link>
                    </Button>
                </div>
            </div>
       </section>

      {/* Footer */}
      <footer className="py-8 bg-card border-t mt-auto">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          &copy; {new Date().getFullYear()} FixIt Local. Empowering Communities.
          {/* Add social links or other footer content here if needed */}
           <div className="mt-2 space-x-4">
                <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
                <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
           </div>
        </div>
      </footer>
    </div>
  );
}

// Helper component for Feature Cards
interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    imageUrl: string;
    imageHint: string;
}

function FeatureCard({ icon, title, description, imageUrl, imageHint }: FeatureCardProps) {
    return (
        <Card className="text-center overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-background">
             <div className="relative w-full h-48 overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={title}
                  layout="fill"
                  objectFit="cover"
                  className="transition-transform duration-300 group-hover:scale-105"
                  data-ai-hint={imageHint}
                 />
            </div>
            <CardHeader className="pt-6">
                <div className="flex justify-center">{icon}</div>
                <CardTitle className="text-xl">{title}</CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
                <p className="text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}

// Helper component for Step Cards
interface StepCardProps {
    number: string;
    title: string;
    description: string;
}

function StepCard({ number, title, description }: StepCardProps) {
    return (
        <div className="flex flex-col items-center max-w-xs relative z-10 bg-background p-6 rounded-lg shadow-sm">
            <div className="w-12 h-12 mb-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold ring-4 ring-primary/20">
                {number}
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    );
}


// Helper component for Badge
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

function Badge({ className, variant, ...props }: BadgeProps) {
  // Simplified Badge component styling - use ShadCN's Badge if available
  const baseStyle = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none";
  const variantStyle = {
    default: "border-transparent bg-primary text-primary-foreground",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    destructive: "border-transparent bg-destructive text-destructive-foreground",
    outline: "text-foreground",
  };
  return (
    <div className={`${baseStyle} ${variantStyle[variant || 'default']} ${className}`} {...props} />
  );
}
