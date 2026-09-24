// @ts-expect-error Next.js processes this global stylesheet import at build time.
import "@/app/ui/global.css";
// import { inter } from "@/app/ui/fonts";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={"${inter.className} antialiased"}>{children}</body>
    </html>
  );
}
