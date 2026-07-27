import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import AdminShell from "./AdminShell";
import "../globals.css";
import "./admin.css";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SMC Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={prompt.variable}>
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
