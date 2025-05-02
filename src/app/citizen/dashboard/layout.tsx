
"use client"; // Required for using hooks like usePathname

import { Navbar } from "@/components/shared/navbar";
import { FilePenLine, History } from 'lucide-react'; // Import icons for nav items
import { usePathname } from 'next/navigation'; // Import usePathname

export default function CitizenDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // Get current path

  const citizenNavItems = [
    { href: "/citizen/dashboard/report", label: "Report Issue", icon: <FilePenLine className="h-4 w-4" />, isActive: pathname === "/citizen/dashboard/report" },
    { href: "/citizen/dashboard", label: "My Issues", icon: <History className="h-4 w-4" />, isActive: pathname === "/citizen/dashboard" },
    // The profile link is handled by the dropdown in the Navbar now.
    // Keeping this structure allows adding more main nav links easily if needed later.
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[url('https://picsum.photos/seed/citizenbg/1920/1080')] bg-cover bg-center bg-fixed">
      {/* Pass isActive status to Navbar */}
      <Navbar navItems={citizenNavItems} userType="Citizen" />
       {/* Added semi-transparent background, backdrop blur, padding, rounded corners, and shadow to main content area */}
       <main className="flex-1 container mx-auto px-4 py-8 bg-background/90 backdrop-blur-sm my-6 rounded-lg shadow-xl">
        {children}
      </main>
    </div>
  );
}
