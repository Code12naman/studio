import Image from 'next/image';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, User, ArrowRight, ShieldAlert } from 'lucide-react'; // Import icons

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
         <div className="flex items-center gap-2 text-2xl font-bold text-primary">
             <ShieldAlert className="h-7 w-7" />
             <span>FixIt Local</span>
         </div>
         <nav className="space-x-4">
             <Button variant="ghost" asChild><Link href="#features">Features</Link></Button>
             <Button variant="ghost" asChild><Link href="#how-it-works">How It Works</Link></Button>
             {/* Add more nav links if needed */}
         </nav>
      </header>

      {/* Hero Section */}
      <section className="flex-grow flex flex-col items-center justify-center text-center container mx-auto px-4 py-16 md:py-24">
        <Badge variant="outline" className="mb-4 text-sm">Your Community Reporting Hub</Badge>
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
          Spot an issue? <span className="text-primary">Report it.</span> Get it fixed.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Empowering citizens to easily report local problems like potholes, broken streetlights, and more. Help make your community better, together.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" asChild>
            <Link href="/login/citizen">
              Report an Issue <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
             <Link href="/login/admin">
               Admin Access <Building className="ml-2 h-5 w-5" />
             </Link>
           </Button>
        </div>
      </section>

       {/* Features Section */}
      <section id="features" className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">Why Use FixIt Local?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              title="Easy Reporting"
              description="Quickly submit issues with descriptions, types, and locations using your device."
              imageUrl="https://picsum.photos/seed/feature1/400/250"
              imageHint="mobile map report"
            />
            <FeatureCard
              title="Track Progress"
              description="Stay updated on the status of your reported issues, from 'Pending' to 'Resolved'."
              imageUrl="https://picsum.photos/seed/feature2/400/250"
              imageHint="dashboard progress update"
            />
            <FeatureCard
              title="Community Impact"
              description="Contribute directly to the improvement of your neighborhood and city infrastructure."
              imageUrl="https://picsum.photos/seed/feature3/400/250"
              imageHint="community hands together"
            />
          </div>
        </div>
      </section>


       {/* How It Works Section */}
       <section id="how-it-works" className="py-16 bg-secondary">
         <div className="container mx-auto px-4 text-center">
           <h2 className="text-3xl font-bold text-foreground mb-12">How It Works</h2>
           <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-12">
             <StepCard number="1" title="Report" description="Log in, describe the issue, select its type, and confirm the location." />
              <ArrowRight className="text-primary h-8 w-8 hidden md:block" />
             <StepCard number="2" title="Review" description="Admins review the reported issue, verify details, and assign it for resolution." />
              <ArrowRight className="text-primary h-8 w-8 hidden md:block" />
             <StepCard number="3" title="Resolve" description="Relevant departments fix the issue. The status is updated, notifying the reporter." />
           </div>
         </div>
       </section>


      {/* Footer */}
      <footer className="py-6 bg-background border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          &copy; {new Date().getFullYear()} FixIt Local. All rights reserved.
          {/* Add social links or other footer content here */}
        </div>
      </footer>
    </div>
  );
}

// Helper component for Feature Cards
interface FeatureCardProps {
    title: string;
    description: string;
    imageUrl: string;
    imageHint: string;
}

function FeatureCard({ title, description, imageUrl, imageHint }: FeatureCardProps) {
    return (
        <Card className="text-center overflow-hidden shadow-md hover:shadow-lg transition-shadow">
             <div className="relative w-full h-48">
                <Image
                  src={imageUrl}
                  alt={title}
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint={imageHint}
                 />
            </div>
            <CardHeader>
                <CardTitle className="text-xl">{title}</CardTitle>
            </CardHeader>
            <CardContent>
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
        <div className="flex flex-col items-center max-w-xs">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                {number}
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    );
}


// Helper component for Badge (if not already imported/available globally)
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
