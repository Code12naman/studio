"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import Link from "next/link";

// Mock Firebase Auth - Replace with actual Firebase integration and role check
const mockAdminSignIn = async (email: string, pass: string) => {
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
  // In a real app, you'd verify credentials AND check if the user has an 'admin' role.
  if (email === 'admin@example.com' && pass === 'password') {
    // Simulate successful admin login
    return { user: { uid: 'admin123', email, role: 'admin' } };
  } else {
    throw new Error("Invalid credentials or insufficient permissions. Use admin@example.com / password");
  }
};

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Replace with actual Firebase signInWithEmailAndPassword and role check
      await mockAdminSignIn(email, password);
      toast({
        title: "Admin Login Successful",
        description: "Welcome, Admin!",
      });
      router.push('/admin/dashboard'); // Redirect to admin dashboard
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      toast({
        title: "Login Failed",
        description: err.message || "Please check your credentials and permissions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Admin Login</CardTitle>
          <CardDescription>Access the dashboard to manage reported issues.</CardDescription>
        </CardHeader>
        <CardContent>
           {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            (Use admin@example.com / password)
          </div>
          <div className="mt-2 text-center text-sm">
            <Link href="/" className="underline text-primary">
              Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
