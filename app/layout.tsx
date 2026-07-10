import type { Metadata, Viewport } from "next";
import "./globals.css";
import ConfirmModalHost from "@/components/ConfirmModal";
import DeleteModalHost from "@/components/DeleteModal";
import Shortcuts from "@/components/Shortcuts";

export const metadata: Metadata = {
  title: "AwMu",
  description: "AwMu — private messenger",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0088cc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("awmu-theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
      </head>
      <body className="antialiased">{children}<ConfirmModalHost /><DeleteModalHost /><Shortcuts /></body>
    </html>
  );
}
