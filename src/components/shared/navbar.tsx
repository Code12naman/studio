"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode; // Optional icon
}

interface NavbarProps {
  navItems: NavItem[];
  userType: "Citizen" | "Admin";
}

// Mock logout function - replace with actual Firebase signOut
const mockSignOut = async () => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
  console.log("User logged out");
};

export function Navbar({ navItems, userType }: NavbarProps) {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await mockSignOut(); // Replace with actual Firebase signOut
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push('/'); // Redirect to landing page
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Logout Failed",
        description: "Could not log you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="bg-card border-b sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href={userType === 'Citizen' ? '/citizen/dashboard' : '/admin/dashboard'} className="text-xl font-bold text-primary flex items-center gap-2">
          <ShieldAlert className="h-6 w-6" />
          FixIt Local <span className="text-sm font-normal text-muted-foreground">({userType})</span>
        </Link>
        <div className="flex items-center gap-4">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <Button variant="ghost" className="text-foreground hover:text-primary">
                 {item.icon && <span className="mr-2">{item.icon}</span>}
                 {item.label}
              </Button>
            </Link>
          ))}
          <Button variant="ghost" onClick={handleLogout} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
