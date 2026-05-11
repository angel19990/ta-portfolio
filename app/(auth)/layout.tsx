import Image from "next/image";
import Link from "next/link";
import taLogo from "@/assets/ta-logo.png";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-navbar-bg text-navbar-fg border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={taLogo}
              alt="Truthful Acting Studios"
              height={36}
              width={150}
              priority
              className="h-9 w-auto"
            />
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
