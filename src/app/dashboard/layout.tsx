import { Sidebar } from "@/components/layout/sidebar";
import { DashboardTopbar } from "@/components/layout/dashboard-topbar";
import { PageGuidePopup } from "@/components/layout/page-guide-popup";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 260, backgroundColor: "var(--bg-primary)" }}>
        <DashboardTopbar />
        <PageGuidePopup />
        <main className="px-5 pb-8 pt-6 sm:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
