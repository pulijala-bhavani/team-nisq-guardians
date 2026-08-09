import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ABTalks Interview Agent",
  description: "A curriculum-aware AI technical interviewer for the ABTalks 31-day Enterprise AI Engineering cohort.",
  other: { "codex-preview": "development" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.dataset.theme=localStorage.getItem('abtalks-theme')||'light'}catch(e){document.documentElement.dataset.theme='light'}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
