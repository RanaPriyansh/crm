import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Atlantic CRM - Business Directory",
  description: "Manage and discover businesses across Atlantic Canada",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Don't show sidebar on login page
  const showSidebar = user !== null

  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        {showSidebar && <Sidebar />}
        <main className={showSidebar ? "ml-64 min-h-screen p-8" : "min-h-screen"}>
          {children}
        </main>
      </body>
    </html>
  );
}
