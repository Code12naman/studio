import { Navbar } from "@/components/shared/navbar";
import { ListChecks, Users } from 'lucide-react'; // Import icons for nav items

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminNavItems = [
    { href: "/admin/dashboard", label: "Manage Issues", icon: <ListChecks className="h-4 w-4" /> },
    // { href: "/admin/dashboard/users", label: "Manage Users", icon: <Users className="h-4 w-4"/> }, // Uncomment when user management is implemented
  ];

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Navbar navItems={adminNavItems} userType="Admin" />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
