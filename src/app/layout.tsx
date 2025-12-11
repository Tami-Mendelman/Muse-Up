import "./globals.css";
import type { ReactNode } from "react";
import ReactQueryProvider from "./ReactQueryProvider";
import LayoutClient from "./LayoutClient";

export const metadata = {
  title: "MuseUp",
  icons: {
    icon: [
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    shortcut: "/favicon-32x32.png",
    apple: "/favicon-32x32.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="layout-body">
        <ReactQueryProvider>
          <LayoutClient>{children}</LayoutClient>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
