import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { GlobalSearch } from "@/components/GlobalSearch";
import { createClient } from "@/lib/supabase/server";
import { QueryProvider } from "@/components/QueryProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Atlantic CRM - Business Directory",
  description: "Manage and discover businesses across Atlantic Canada",
};

// Check dev mode inline
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const isDevMode = !supabaseUrl || supabaseUrl.includes('your-project') || !supabaseUrl.startsWith('https://')

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let showSidebar = false

  if (isDevMode) {
    // In dev mode, always show sidebar (we're "logged in")
    showSidebar = true
  } else {
    // Production: check actual auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    showSidebar = user !== null
  }

  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <QueryProvider>
          {showSidebar && <Sidebar />}
          <main className={showSidebar ? "ml-64 min-h-screen" : "min-h-screen"}>
            {showSidebar && (
              <header className="sticky top-0 z-40 bg-[hsl(var(--background))]/80 backdrop-blur-sm border-b border-[hsl(var(--border))] px-8 py-4">
                <GlobalSearch />
              </header>
            )}
            <div className={showSidebar ? "p-8" : ""}>
              {children}
            </div>
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}
