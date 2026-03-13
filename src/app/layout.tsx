import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jamal the Marketing Agent",
  description: "AI-powered marketing content for DDEG engineering",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-[#f8f9fa]">
          <nav className="w-full bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
              <div className="bg-[#0b1f5c] w-8 h-8 rounded-lg text-white flex items-center justify-center font-semibold">
                D
              </div>
              <div className="leading-tight">
                <div className="font-bold text-[#0b1f5c]">DDEG</div>
                <div className="text-sm text-gray-500">Jamal the Marketing Agent</div>
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
