 "use client"; // Required for using hooks like usePathname

import { Navbar } from "@/components/shared/navbar";
import { ListChecks, Users, UserCircle } from 'lucide-react'; // Import icons for nav items
import { usePathname } from 'next/navigation'; // Import usePathname

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // Get current path

  const adminNavItems = [
    { href: "/admin/dashboard", label: "Manage Issues", icon: <ListChecks className="h-4 w-4" />, isActive: pathname === "/admin/dashboard" },
    // { href: "/admin/dashboard/users", label: "Manage Users", icon: <Users className="h-4 w-4"/>, isActive: pathname === "/admin/dashboard/users" }, // Uncomment when user management is implemented
    // { href: "/admin/profile", label: "Profile", icon: <UserCircle className="h-4 w-4" />, isActive: pathname === "/admin/profile" }, // Placeholder for profile page
  ];

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      {/* Pass isActive status to Navbar */}
      <Navbar navItems={adminNavItems} userType="Admin" />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
