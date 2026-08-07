import { Sidebar } from "@/components/layout/Sidebar";
import { ChatNotifications } from "@/components/shared/ChatNotifications";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <ChatNotifications />
      <main className="lg:ml-[260px] min-h-screen p-4 md:p-6 lg:p-8 pt-16 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
