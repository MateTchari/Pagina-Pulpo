"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload } from "lucide-react";
import { productSchema, settingsSchema } from "@/lib/validation";
import { labels, transitions } from "@/lib/order-state";
import type { OrderStatus } from "@prisma/client";
import { z } from "zod";
export async function post(path: string, body: unknown) {
  const res = await fetch(`/api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "No se pudo guardar.");
  return data;
}
function message(e: unknown) {
  return e instanceof z.ZodError
    ? e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" · ")
    : e instanceof Error
      ? e.message
      : "Error inesperado";
}
type VariantInput = {
  id?: string;
  color: string;
  size: string;
  sku: string;
  price: number;
  cost: number;
  minStock: number;
  active: boolean;
};
type ProductInput = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  active: boolean;
  featured: boolean;
  variants: VariantInput[];
  images: { url: string; alt: string }[];
};
const emptyVariant = (): VariantInput => ({
  color: "",
  size: "",
  sku: "",
  price: 0,
  cost: 0,
  minStock: 3,
  active: true,
});
async function upload(file: File) {
  const form = new FormData();
  form.set("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.url as string;
}
export function ProductForm({ initial }: { initial?: ProductInput }) {
  const router = useRouter(),
    [data, setData] = useState<ProductInput>(
      initial ?? {
        name: "",
        slug: "",
        description: "",
        active: false,
        featured: false,
        variants: [emptyVariant()],
        images: [],
      },
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false);
  function variant(
    index: number,
    key: keyof VariantInput,
    value: string | number | boolean,
  ) {
    setData((d) => ({
      ...d,
      variants: d.variants.map((v, i) =>
        i === index ? { ...v, [key]: value } : v,
      ),
    }));
  }
  return (
    <form
      className="form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
          const parsed = productSchema.parse(data);
          await post(`products${data.id ? `/${data.id}` : ""}`, parsed);
          router.push("/admin/productos");
          router.refresh();
        } catch (e) {
          setError(message(e));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="panel form-stack">
        <h2>Información del diseño</h2>
        <div className="form-grid">
          <label>
            Nombre
            <input
              required
              maxLength={150}
              value={data.name}
              onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
            />
          </label>
          <label>
            Identificador de URL
            <input
              required
              placeholder="remera-diseno"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={data.slug}
              onChange={(e) => setData((d) => ({ ...d, slug: e.target.value }))}
            />
          </label>
        </div>
        <label>
          Descripción
          <textarea
            rows={4}
            required
            maxLength={5000}
            value={data.description}
            onChange={(e) =>
              setData((d) => ({ ...d, description: e.target.value }))
            }
          />
        </label>
        <div className="inline">
          <label className="check">
            <input
              type="checkbox"
              checked={data.active}
              onChange={(e) =>
                setData((d) => ({ ...d, active: e.target.checked }))
              }
            />
            Publicado en la tienda
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={data.featured}
              onChange={(e) =>
                setData((d) => ({ ...d, featured: e.target.checked }))
              }
            />
            Destacado en inicio
          </label>
        </div>
      </div>
      <div className="panel">
        <h2>Fotografías</h2>
        <p className="muted">
          JPG, PNG o WebP · hasta 5 MB · máximo 10 fotografías.
        </p>
        <div className="image-editor">
          {data.images.map((im, i) => (
            <div key={im.url}>
              <img src={im.url} alt={im.alt} />
              <label>
                Texto alternativo
                <input
                  maxLength={200}
                  value={im.alt}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      images: d.images.map((x, idx) =>
                        idx === i ? { ...x, alt: e.target.value } : x,
                      ),
                    }))
                  }
                />
              </label>
              <button
                type="button"
                className="text-link"
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    images: d.images.filter((_, idx) => idx !== i),
                  }))
                }
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
        <label className="upload-label">
          <Upload size={18} />
          {uploading ? "Procesando…" : "Subir fotografía"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading || data.images.length >= 10}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true);
              setError("");
              try {
                const url = await upload(file);
                setData((d) => ({
                  ...d,
                  images: [...d.images, { url, alt: d.name }],
                }));
              } catch (e) {
                setError(message(e));
              } finally {
                setUploading(false);
              }
            }}
          />
        </label>
      </div>
      <div className="panel">
        <h2>Variantes, precios y costos</h2>
        <p className="muted">
          Una fila por combinación. La carga inicial de unidades se realiza en
          Inventario; las variantes existentes conservan su historial.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Color</th>
                <th>Talle</th>
                <th>SKU único</th>
                <th>Precio</th>
                <th>Costo</th>
                <th>Mínimo</th>
                <th>Activa</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.variants.map((v, i) => (
                <tr key={v.id ?? i}>
                  {(
                    [
                      "color",
                      "size",
                      "sku",
                      "price",
                      "cost",
                      "minStock",
                    ] as const
                  ).map((k) => (
                    <td key={k}>
                      <input
                        aria-label={`${k} variante ${i + 1}`}
                        required
                        type={
                          ["price", "cost", "minStock"].includes(k)
                            ? "number"
                            : "text"
                        }
                        min="0"
                        step={k === "price" || k === "cost" ? ".01" : "1"}
                        value={v[k]}
                        onChange={(e) =>
                          variant(
                            i,
                            k,
                            ["price", "cost", "minStock"].includes(k)
                              ? Number(e.target.value)
                              : e.target.value,
                          )
                        }
                      />
                    </td>
                  ))}
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Variante ${i + 1} activa`}
                      checked={v.active}
                      onChange={(e) => variant(i, "active", e.target.checked)}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      aria-label={`Quitar variante ${i + 1}`}
                      className="icon-button"
                      disabled={data.variants.length === 1}
                      onClick={() =>
                        setData((d) => ({
                          ...d,
                          variants: d.variants.filter((_, idx) => i !== idx),
                        }))
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          className="button secondary"
          onClick={() =>
            setData((d) => ({
              ...d,
              variants: [...d.variants, emptyVariant()],
            }))
          }
        >
          <Plus size={17} />
          Agregar variante
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="inline">
        <button className="button" disabled={busy || uploading}>
          {busy ? "Guardando…" : "Guardar producto"}
        </button>
        <a href="/admin/productos">Cancelar</a>
      </div>
    </form>
  );
}
export function StockForm({
  variants,
}: {
  variants: { id: string; label: string }[];
}) {
  const [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false),
    router = useRouter();
  return (
    <form
      className="panel form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setBusy(true);
        const form = e.currentTarget,
          f = new FormData(form);
        try {
          await post("inventory", {
            variantId: f.get("variantId"),
            quantity: Number(f.get("quantity")),
            reason: f.get("reason"),
          });
          setSuccess("Movimiento registrado. Stock actualizado.");
          form.reset();
          router.refresh();
        } catch (e) {
          setError(message(e));
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>Registrar movimiento</h2>
      <div className="form-grid">
        <div>
          <label htmlFor="stock-variant">Variante</label>
          <select id="stock-variant" name="variantId" required>
            <option value="">Seleccioná una variante</option>
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <label>
          Unidades (+ ingreso / − baja)
          <input
            type="number"
            name="quantity"
            required
            min="-100000"
            max="100000"
            step="1"
          />
        </label>
        <label>
          Motivo
          <input
            name="reason"
            required
            minLength={3}
            maxLength={300}
            placeholder="Compra, ajuste, merma…"
          />
        </label>
      </div>
      <div>
        <button className="button" disabled={busy}>
          {busy ? "Registrando…" : "Registrar movimiento"}
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="success" role="status">
          {success}
        </p>
      )}
    </form>
  );
}
export function OrderActions({
  id,
  status,
}: {
  id: string;
  status: OrderStatus;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    router = useRouter();
  return (
    <div>
      <div className="inline">
        {transitions[status].map((next) => (
          <button
            key={next}
            disabled={busy}
            className={`button ${next === "CANCELLED" ? "danger" : ""}`}
            onClick={async () => {
              if (
                next === "CANCELLED" &&
                !window.confirm(
                  "¿Cancelar el pedido? Si descontó inventario, se reintegrarán las unidades.",
                )
              )
                return;
              setBusy(true);
              setError("");
              try {
                await post(`orders/${id}`, { status: next });
                router.refresh();
              } catch (e) {
                setError(message(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            {next === "CONFIRMED"
              ? "Confirmar y descontar stock"
              : labels[next]}
          </button>
        ))}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function ArchiveButton({ id }: { id: string }) {
  const router = useRouter(),
    [error, setError] = useState("");
  return (
    <>
      <button
        className="text-link"
        onClick={async () => {
          if (!confirm("¿Despublicar este producto de la tienda?")) return;
          try {
            await post(`archive/${id}`, {});
            router.refresh();
          } catch (e) {
            setError(message(e));
          }
        }}
      >
        Despublicar
      </button>
      {error && <span className="error">{error}</span>}
    </>
  );
}
export function SettingsForm({
  initial,
}: {
  initial: {
    name: string;
    description: string;
    currency: string;
    accent: string;
    logoUrl: string | null;
    ordersEnabled: boolean;
  };
}) {
  const [data, setData] = useState({
      ...initial,
      logoUrl: initial.logoUrl ?? "",
    }),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false),
    router = useRouter();
  return (
    <form
      className="panel form-stack narrow"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setBusy(true);
        try {
          await post("settings", settingsSchema.parse(data));
          setSuccess("Configuración guardada.");
          router.refresh();
        } catch (e) {
          setError(message(e));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Nombre comercial
        <input
          required
          value={data.name}
          onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
        />
      </label>
      <label>
        Descripción
        <textarea
          value={data.description}
          onChange={(e) =>
            setData((d) => ({ ...d, description: e.target.value }))
          }
        />
      </label>
      <div className="form-grid">
        <label>
          Moneda ISO (ARS, USD, EUR…)
          <input
            required
            maxLength={3}
            pattern="[A-Z]{3}"
            value={data.currency}
            onChange={(e) =>
              setData((d) => ({ ...d, currency: e.target.value.toUpperCase() }))
            }
          />
        </label>
        <label>
          Color de acento
          <input
            type="color"
            value={data.accent}
            onChange={(e) => setData((d) => ({ ...d, accent: e.target.value }))}
          />
        </label>
      </div>
      <label>
        Logo (JPG, PNG o WebP)
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={async (e) => {
            if (!e.target.files?.[0]) return;
            setBusy(true);
            try {
              const url = await upload(e.target.files[0]);
              setData((d) => ({ ...d, logoUrl: url }));
            } catch (e) {
              setError(message(e));
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {data.logoUrl && (
        <div className="inline">
          <img src={data.logoUrl} alt="Logo" width={80} />
          <button
            type="button"
            onClick={() => setData((d) => ({ ...d, logoUrl: "" }))}
          >
            Quitar logo
          </button>
        </div>
      )}
      <label className="check">
        <input
          type="checkbox"
          checked={data.ordersEnabled}
          onChange={(e) =>
            setData((d) => ({ ...d, ordersEnabled: e.target.checked }))
          }
        />
        Habilitar pedidos con confirmación, pago y entrega coordinados
        manualmente.
      </label>
      <p className="notice">
        No se reserva stock. Confirmar descuenta inventario; cancelar lo
        reintegra una vez. Los pedidos no acreditan cobros. La moneda queda
        bloqueada al existir pedidos.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="success">{success}</p>}
      <button className="button" disabled={busy}>
        {busy ? "Guardando…" : "Guardar configuración"}
      </button>
    </form>
  );
}
