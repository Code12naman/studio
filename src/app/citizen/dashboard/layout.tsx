import { Navbar } from "@/components/shared/navbar";
import { FilePenLine, History } from 'lucide-react'; // Import icons for nav items

export default function CitizenDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const citizenNavItems = [
    { href: "/citizen/dashboard/report", label: "Report Issue", icon: <FilePenLine className="h-4 w-4" /> },
    { href: "/citizen/dashboard", label: "My Issues", icon: <History className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Navbar navItems={citizenNavItems} userType="Citizen" />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
