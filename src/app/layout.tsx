import type { Metadata } from "next";
import { CartProvider } from "@/components/cart-provider";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "SANTOS · Remeras con identidad", template: "%s · SANTOS" },
  description: "SANTOS. Remeras y diseños con identidad propia.",
  icons: {
    icon: "/brand/santos-mark-black.png",
    apple: "/brand/santos-mark-black.png",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR" data-scroll-behavior="smooth">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
