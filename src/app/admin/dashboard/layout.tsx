
"use client"; // Required for using hooks like usePathname

import { Navbar } from "@/components/shared/navbar";
import { ListChecks, Users } from 'lucide-react'; // Import icons for nav items
import { usePathname } from 'next/navigation'; // Import usePathname

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // Get current path

  const adminNavItems = [
    { href: "/admin/dashboard", label: "Manage Issues", icon: <ListChecks className="h-4 w-4" />, isActive: pathname === "/admin/dashboard" },
    // { href: "/admin/dashboard/users", label: "Manage Users", icon: <Users className="h-4 w-4"/>, isActive: pathname === "/admin/dashboard/users" }, // Future: User management page
    // Profile link is now in the user dropdown menu in the Navbar
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[url('https://picsum.photos/seed/adminbg/1920/1080')] bg-cover bg-center bg-fixed">
      {/* Pass necessary props to Navbar */}
      <Navbar navItems={adminNavItems} userType="Admin" />
      {/* Added semi-transparent background, backdrop blur, padding, rounded corners, and shadow to main content area */}
      <main className="flex-1 container mx-auto px-4 py-8 bg-background/90 backdrop-blur-sm my-6 rounded-lg shadow-xl">
        {children}
      </main>
    </div>
  );
}
