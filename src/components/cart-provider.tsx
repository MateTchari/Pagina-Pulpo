"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { addLine, type CartLine } from "@/lib/cart";
const Context = createContext<{
  lines: CartLine[];
  ready: boolean;
  add: (line: CartLine) => void;
  quantity: (id: string, q: number) => void;
  clear: () => void;
}>({
  lines: [],
  ready: false,
  add: () => {},
  quantity: () => {},
  clear: () => {},
});
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]),
    [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem("tienda-cart-v1") || "[]");
      if (Array.isArray(parsed))
        setLines(
          parsed
            .filter(
              (l) =>
                typeof l.variantId === "string" &&
                typeof l.name === "string" &&
                Number.isInteger(l.quantity) &&
                l.quantity > 0 &&
                l.quantity <= 100 &&
                Number.isFinite(l.price),
            )
            .slice(0, 50),
        );
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem("tienda-cart-v1", JSON.stringify(lines));
      } catch {}
    }
  }, [lines, ready]);
  return (
    <Context.Provider
      value={{
        lines,
        ready,
        add: (l) => setLines((p) => addLine(p, l)),
        quantity: (id, q) =>
          setLines((p) =>
            p
              .map((l) =>
                l.variantId === id
                  ? {
                      ...l,
                      quantity: Math.max(0, Math.min(100, Math.floor(q) || 0)),
                    }
                  : l,
              )
              .filter((l) => l.quantity > 0),
          ),
        clear: () => setLines([]),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useCart = () => useContext(Context);
