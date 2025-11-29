import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AISettingsProvider } from "@/contexts/AISettingsContext";
import { PromptTemplateProvider } from "@/contexts/PromptTemplateContext";
import { EnhancedErrorBoundary } from "@/components/error-boundary/enhanced-error-boundary-system";
import { AccessibilityProvider } from "@/providers/AccessibilityProvider";
import { ErrorProvider } from "@/contexts/ErrorContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Caldas AI Analytics Platform",
  description: "AI-powered analytics dashboard with intelligent chat and RAG functionality",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
      >
        <EnhancedErrorBoundary feature="Application Root" maxRetries={2}>
          <ErrorProvider>
            <AccessibilityProvider>
              <ThemeProvider>
                <SettingsProvider>
                  <AISettingsProvider>
                    <PromptTemplateProvider>
                      {children}
                    </PromptTemplateProvider>
                  </AISettingsProvider>
                </SettingsProvider>
              </ThemeProvider>
            </AccessibilityProvider>
          </ErrorProvider>
        </EnhancedErrorBoundary>
      </body>
    </html>
  );
}
