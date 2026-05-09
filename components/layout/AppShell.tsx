import { Navbar } from "./Navbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:border focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md"
      >
        Skip to content
      </a>
      <Navbar />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-8 focus:outline-none"
      >
        {children}
      </main>
    </div>
  );
}
