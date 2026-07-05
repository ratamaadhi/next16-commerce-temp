import type { Metadata } from "next";
import { AnalyticsDashboard } from "@/components/dashboard/analytics-dashboard";

export const metadata: Metadata = {
  title: "Analytics Internal",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <AnalyticsDashboard />;
}
