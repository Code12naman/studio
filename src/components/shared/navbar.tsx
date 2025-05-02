
 "use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut, ShieldAlert, UserCircle, Camera } from "lucide-react"; // Added Camera
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"; // Import DropdownMenu
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar
import { cn } from "@/lib/utils"; // Import cn utility
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; // Import Dialog
import AiAnalysisComponent from "@/components/shared/ai-analysis"; // Verified import path
import React from "react"; // Import React

interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode; // Optional icon
  isActive?: boolean; // Optional: indicates if the nav item is active
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

// Mock user data - replace with actual user data from context/session
const mockUser = {
    email: "user@example.com",
    displayName: "Demo User",
    photoURL: `https://picsum.photos/seed/${'user123'}/40/40`, // Generate placeholder avatar based on ID
    // In a real app, this might be null if no photo is set
};


export function Navbar({ navItems, userType }: NavbarProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = React.useState(false);

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

  // Generate initials for Avatar fallback
  const getInitials = (name: string | null | undefined): string => {
      if (!name) return "?";
      const names = name.split(' ');
      if (names.length === 1) return names[0][0]?.toUpperCase() ?? "?";
      return (names[0][0] + (names[names.length - 1][0] || '')).toUpperCase();
  }

  const handleProfileClick = () => {
    // Navigate to a profile page (create this page later)
    // For now, just log or show a toast
    toast({ title: "Profile Clicked", description: "User profile page is not yet implemented." });
    // router.push(userType === 'Admin' ? '/admin/profile' : '/citizen/profile');
  };


  return (
    <nav className="bg-card border-b sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href={userType === 'Citizen' ? '/citizen/dashboard' : '/admin/dashboard'} className="text-xl font-bold text-primary flex items-center gap-2">
          <ShieldAlert className="h-6 w-6" />
          FixIt Local <span className="text-sm font-normal text-muted-foreground">({userType})</span>
        </Link>
        <div className="flex items-center gap-1"> {/* Reduced gap slightly */}
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} passHref legacyBehavior>
              <Button
                 variant={item.isActive ? "secondary" : "ghost"} // Use secondary variant for active link
                 className={cn(
                    "text-foreground hover:text-primary",
                    item.isActive && "font-semibold text-primary" // Add specific active styles
                 )}
                 as="a" // Ensure Button renders as an anchor tag for proper navigation
               >
                 {item.icon && <span className="mr-2">{item.icon}</span>}
                 {item.label}
              </Button>
            </Link>
          ))}

          {/* AI Analysis Camera Icon (Citizen Only) */}
          {userType === 'Citizen' && (
             <Dialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
                 <DialogTrigger asChild>
                     <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                         <Camera className="h-5 w-5" />
                         <span className="sr-only">Analyze Issue with Camera</span>
                     </Button>
                 </DialogTrigger>
                 <DialogContent className="max-w-md">
                     <DialogHeader>
                         <DialogTitle>Analyze Issue with Camera</DialogTitle>
                     </DialogHeader>
                     {/* Integrate the AI Analysis Component */}
                     <AiAnalysisComponent onClose={() => setIsAnalysisDialogOpen(false)} />
                 </DialogContent>
             </Dialog>
          )}

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-2"> {/* Added margin */}
                <Avatar className="h-8 w-8">
                   <AvatarImage src={mockUser.photoURL || undefined} alt={mockUser.displayName || "User"} data-ai-hint="person face" />
                  <AvatarFallback>{getInitials(mockUser.displayName)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{mockUser.displayName || "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {mockUser.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
               <DropdownMenuItem onClick={handleProfileClick}>
                 <UserCircle className="mr-2 h-4 w-4" />
                 <span>Profile</span>
                 {/* <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut> */}
               </DropdownMenuItem>
               {/* Add other items like Settings if needed */}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </nav>
  );
}
