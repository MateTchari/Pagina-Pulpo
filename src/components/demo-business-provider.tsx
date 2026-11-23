"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DEMO_BUSINESS_KEY,
  demoBusinessSchema,
  initialDemoBusiness,
  reduceDemoBusiness,
  type DemoAction,
  type DemoBusiness,
} from "@/lib/demo-business";
type DemoContext = {
  state: DemoBusiness | null;
  storageWarning: string;
  act: (action: DemoAction) => DemoBusiness;
  reset: () => void;
};
const Context = createContext<DemoContext | null>(null);
export function DemoBusinessProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoBusiness | null>(null),
    ref = useRef<DemoBusiness | null>(null),
    [storageWarning, setStorageWarning] = useState("");
  const commit = (next: DemoBusiness) => {
    ref.current = next;
    setState(next);
    try {
      localStorage.setItem(DEMO_BUSINESS_KEY, JSON.stringify(next));
      setStorageWarning("");
    } catch {
      setStorageWarning(
        "Los cambios siguen disponibles en esta pestaña, pero el navegador no permitió guardarlos. Podrían perderse al recargar.",
      );
    }
    return next;
  };
  useEffect(() => {
    let initial: DemoBusiness | null = null;
    try {
      const raw = localStorage.getItem(DEMO_BUSINESS_KEY);
      if (raw) {
        const parsed = demoBusinessSchema.safeParse(JSON.parse(raw));
        if (parsed.success) initial = parsed.data;
      }
    } catch {}
    commit(initial ?? initialDemoBusiness());
    const sync = (event: StorageEvent) => {
      if (event.key !== DEMO_BUSINESS_KEY || !event.newValue) return;
      try {
        const parsed = demoBusinessSchema.safeParse(JSON.parse(event.newValue));
        if (parsed.success) {
          ref.current = parsed.data;
          setState(parsed.data);
        }
      } catch {}
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  return (
    <Context.Provider
      value={{
        state,
        storageWarning,
        act: (action) => {
          if (!ref.current) throw new Error("La demo se está cargando.");
          return commit(reduceDemoBusiness(ref.current, action));
        },
        reset: () => commit(initialDemoBusiness()),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useDemoBusiness = () => useContext(Context);
