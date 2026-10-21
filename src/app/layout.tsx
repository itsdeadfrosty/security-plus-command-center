import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import { FileSyncProvider } from "@/lib/storage/fileSync";
import { SyncProvider } from "@/lib/storage/gistSync";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Security+ Command Center",
  description:
    "Adaptive, local-first practice for CompTIA Security+ SY0-701. Not affiliated with CompTIA.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a1020",
};

// Applies the saved theme before first paint to avoid a light/dark flash.
// Static string — contains no user data.
const themeScript = `try{var t=localStorage.getItem("spcc-theme");if(t==="light")document.documentElement.dataset.theme="light"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <AppProvider>
          <FileSyncProvider>
            <SyncProvider>
              <AppShell>{children}</AppShell>
            </SyncProvider>
          </FileSyncProvider>
        </AppProvider>
      </body>
    </html>
  );
}
