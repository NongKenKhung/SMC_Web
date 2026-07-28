import type { Metadata } from "next";
import AdminShell from "./AdminShell";
import "./admin.css";

/* <html>/<body> และฟอนต์อยู่ที่ app/layout.tsx (root) */

export const metadata: Metadata = {
  title: "SMC Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminShell>{children}</AdminShell>;
}
