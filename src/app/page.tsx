import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Building, User } from 'lucide-react'; // Import icons

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Welcome to FixIt Local</CardTitle>
          <CardDescription className="text-muted-foreground pt-2">
            Report and track local issues in your community. Your voice matters!
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-center text-foreground">
            Help improve your neighborhood by reporting issues like potholes, broken streetlights, or garbage dumping.
          </p>
          <div className="flex flex-col gap-4 mt-4">
            <Link href="/login/citizen" passHref>
              <Button className="w-full" variant="default">
                <User className="mr-2" /> Login as Citizen
              </Button>
            </Link>
            <Link href="/login/admin" passHref>
              <Button className="w-full" variant="secondary">
                <Building className="mr-2" /> Login as Admin
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
