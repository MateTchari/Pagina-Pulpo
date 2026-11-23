"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import {
  LayoutDashboard,
  Shirt,
  Boxes,
  ShoppingBag,
  ChartNoAxesCombined,
  Calculator,
  Settings,
  ArrowUpRight,
  RotateCcw,
  Plus,
  Trash2,
} from "lucide-react";
import { Brand } from "./brand";
import { Badge, Empty } from "./ui";
import { SalesChart } from "./charts";
import { useDemoBusiness } from "./demo-business-provider";
import { useCart } from "./cart-provider";
import {
  demoVariants,
  demoStatistics,
  demoProductSchema,
  demoBusinessSettingsSchema,
  type DemoBusiness,
  type DemoProduct,
  type DemoVariant,
  type DemoOrder,
  type DemoAction,
  type DemoStatus,
} from "@/lib/demo-business";
import { labels, transitions } from "@/lib/order-state";
import { money, margins } from "@/lib/money";

const base = "/admin/demo";
const nav = [
  ["", "Resumen", LayoutDashboard],
  ["productos", "Productos", Shirt],
  ["inventario", "Inventario", Boxes],
  ["ventas", "Pedidos y ventas", ShoppingBag],
  ["estadisticas", "Estadísticas", ChartNoAxesCombined],
  ["costos", "Costos y márgenes", Calculator],
  ["configuracion", "Configuración", Settings],
] as const;
const date = (value: string) =>
  new Date(value).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "short",
    timeStyle: "short",
  });
const percent = (value: number | null) =>
  value === null ? "No definido" : `${value.toFixed(1)} %`;
function problem(error: unknown) {
  return error instanceof z.ZodError
    ? error.issues.map((i) => i.message).join(" · ")
    : error instanceof Error
      ? error.message
      : "No se pudo completar la prueba.";
}
function Title({
  title,
  eyebrow = "ADMINISTRACIÓN DE PRUEBA",
  children,
}: {
  title: string;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="admin-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
      </div>
      {children}
    </div>
  );
}
type Actions = { act: (action: DemoAction) => DemoBusiness };
export function DemoAdmin({ section = [] }: { section?: string[] }) {
  const demo = useDemoBusiness(),
    cart = useCart();
  if (!demo?.state)
    return (
      <main className="section" role="status">
        Cargando tu panel de prueba…
      </main>
    );
  const state = demo.state,
    key = section[0] ?? "";
  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link href={base} className="admin-brand">
          <Brand name={state.settings.name} />
          <small>PANEL DE PRUEBA</small>
        </Link>
        <span className="nav-label">EXPLORÁ TU NEGOCIO</span>
        <nav aria-label="Administración de prueba">
          {nav.map(([path, name, Icon]) => (
            <Link
              key={path}
              href={`${base}${path ? `/${path}` : ""}`}
              aria-current={path === key ? "page" : undefined}
            >
              <Icon size={19} />
              {name}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/">
            Abrir tienda <ArrowUpRight size={16} />
          </Link>
          <button
            className="logout"
            onClick={() => {
              if (
                confirm(
                  "¿Restablecer los datos de ejemplo de este navegador? Se perderán tus cambios de prueba.",
                )
              ) {
                demo.reset();
                cart.clear();
              }
            }}
          >
            <RotateCcw size={13} />
            Restablecer demo
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <span>
            SANTOS <span className="muted">/ Panel de prueba</span>
          </span>
          <span className="badge">Invitado · Demo</span>
        </header>
        <div className="demo-banner demo-admin-banner" role="note">
          <strong>Demostración interactiva</strong>
          <span>
            Datos de ejemplo. Tus cambios se guardan solo en este navegador y
            también se reflejan en la tienda de prueba.
          </span>
        </div>
        <main
          className="admin-content"
          style={{ "--accent": state.settings.accent } as React.CSSProperties}
        >
          {demo.storageWarning && (
            <p className="notice" role="status">
              {demo.storageWarning}
            </p>
          )}
          {key === "" ? (
            <Overview state={state} />
          ) : key === "productos" ? (
            section[1] ? (
              <ProductEditor
                key={section[1]}
                state={state}
                product={state.products.find((p) => p.id === section[1])}
                isNew={section[1] === "nuevo"}
                act={demo.act}
              />
            ) : (
              <Products state={state} act={demo.act} />
            )
          ) : key === "inventario" ? (
            <Inventory state={state} act={demo.act} />
          ) : key === "ventas" ? (
            section[1] ? (
              <OrderDetail
                state={state}
                order={state.orders.find((o) => o.id === section[1])}
                act={demo.act}
              />
            ) : (
              <Orders state={state} />
            )
          ) : key === "estadisticas" ? (
            <Overview state={state} statistics />
          ) : key === "costos" ? (
            <Costs state={state} />
          ) : key === "configuracion" ? (
            <Configuration state={state} act={demo.act} />
          ) : (
            <Empty title="No encontramos esta sección">
              <Link href={base}>Volver al resumen</Link>
            </Empty>
          )}
        </main>
      </div>
    </div>
  );
}
function Overview({
  state,
  statistics = false,
}: {
  state: DemoBusiness;
  statistics?: boolean;
}) {
  const [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const stats = demoStatistics(state, from, to),
    variants = demoVariants(state),
    low = variants.filter((v) => v.active && v.stock <= v.minStock),
    pending = state.orders.filter((o) => o.status === "PENDING");
  const currency = state.settings.currency;
  return (
    <>
      <Title
        title={
          statistics
            ? "Estadísticas de tu prueba."
            : "Tu estudio, en un vistazo."
        }
      >
        {!statistics && (
          <Link className="button" href={`${base}/productos/nuevo`}>
            Nuevo producto <Plus size={17} />
          </Link>
        )}
      </Title>
      <div className="date-filter">
        <label>
          Desde
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          Hasta
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button
          className="button secondary"
          onClick={() => {
            setFrom("");
            setTo("");
          }}
        >
          Todo el período
        </button>
      </div>
      {from && to && from > to && (
        <p className="error">La fecha inicial es posterior a la final.</p>
      )}
      <div className="metrics">
        {[
          {
            label: "Ingresos de ejemplo",
            value: money(stats.revenue, currency),
            note: `${stats.orders} ventas confirmadas de prueba`,
          },
          {
            label: "Costos de mercadería",
            value: money(stats.cost, currency),
            note: "Según el costo histórico de cada pedido",
          },
          {
            label: "Ganancia bruta estimada",
            value: money(stats.profit, currency),
            note: `Margen ${percent(stats.margin)}`,
          },
          {
            label: "Unidades vendidas",
            value: stats.units,
            note: `${variants.reduce((sum, v) => sum + v.stock, 0)} unidades en inventario de prueba`,
          },
        ].map((m) => (
          <div className="metric" key={m.label}>
            <span>{m.label}</span>
            <strong>{m.value}</strong>
            <small>{m.note}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <h2>Evolución de ventas de ejemplo</h2>
          <SalesChart data={stats.daily} currency={currency} />
        </section>
        <section className="panel">
          <h2>Para seguir probando</h2>
          <Link className="action-card" href={`${base}/ventas`}>
            <span className="action-number">{pending.length}</span>
            <div>
              <h3>Pedidos pendientes</h3>
              <p>Confirmalos y mirá cómo baja el stock.</p>
            </div>
            <ArrowUpRight size={18} />
          </Link>
          <Link className="action-card" href={`${base}/inventario`}>
            <span className="action-number">{low.length}</span>
            <div>
              <h3>Variantes con stock bajo</h3>
              <p>Cargá unidades y revisá la tienda.</p>
            </div>
            <ArrowUpRight size={18} />
          </Link>
          <p className="fine-print">
            No se registran cobros ni dinero real. La ganancia bruta no incluye
            gastos operativos, impuestos, envíos ni comisiones.
          </p>
        </section>
      </div>
      {statistics ? (
        <>
          <section className="panel">
            <h2>Productos más vendidos</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Producto / variante</th>
                    <th>Unidades</th>
                    <th>Ingresos</th>
                    <th>Costo</th>
                    <th>Ganancia bruta</th>
                    <th>Margen</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.products.map((p) => (
                    <tr key={p.name}>
                      <td>{p.name}</td>
                      <td>{p.units}</td>
                      <td>{money(p.revenue, currency)}</td>
                      <td>{money(p.cost, currency)}</td>
                      <td>{money(p.revenue - p.cost, currency)}</td>
                      <td>{percent(margins(p.revenue, p.cost).margin)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!stats.products.length && (
              <Empty title="No hay ventas confirmadas en este período" />
            )}
          </section>
          <section className="panel">
            <h2>Detalle diario del gráfico</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Fecha de confirmación</th>
                    <th>Ingresos</th>
                    <th>Costos</th>
                    <th>Ganancia bruta</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.daily.map((d) => (
                    <tr key={d.date}>
                      <td>{d.date}</td>
                      <td>{money(d.revenue, currency)}</td>
                      <td>{money(d.cost, currency)}</td>
                      <td>{money(d.revenue - d.cost, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <section className="panel">
          <div className="section-heading">
            <h2>Últimos pedidos de prueba</h2>
            <Link href={`${base}/ventas`}>Ver todos ↗</Link>
          </div>
          <OrderTable orders={state.orders.slice(0, 6)} />
        </section>
      )}
      <p className="notice">
        Todos los importes provienen de datos de ejemplo de este navegador.
        Pendientes y cancelados se excluyen de ventas; no representan resultados
        reales del negocio.
      </p>
    </>
  );
}
function Products({ state, act }: { state: DemoBusiness } & Actions) {
  const [q, setQ] = useState(""),
    [error, setError] = useState("");
  const products = state.products.filter((p) =>
    p.name.toLocaleLowerCase("es").includes(q.toLocaleLowerCase("es")),
  );
  return (
    <>
      <Title title="Tus productos de prueba.">
        <Link className="button" href={`${base}/productos/nuevo`}>
          <Plus size={17} />
          Nuevo producto
        </Link>
      </Title>
      <label className="demo-search">
        Buscar producto
        <input
          placeholder="Nombre del diseño"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Estado</th>
                <th>Variantes</th>
                <th>Stock</th>
                <th>Desde</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="table-product">
                      <img src={p.image} alt="" />
                      <div>
                        <strong>{p.name}</strong>
                        <small>/{p.slug}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge>{p.active ? "Publicado" : "Inactivo"}</Badge>
                  </td>
                  <td>{p.variants.filter((v) => v.active).length}</td>
                  <td>{p.variants.reduce((s, v) => s + v.stock, 0)}</td>
                  <td>
                    {money(
                      Math.min(...p.variants.map((v) => v.price)),
                      state.settings.currency,
                    )}
                  </td>
                  <td>
                    <div className="inline">
                      <Link href={`${base}/productos/${p.id}`}>Editar ↗</Link>
                      <button
                        className="text-link"
                        onClick={() => {
                          try {
                            act({
                              type: "save-product",
                              product: { ...p, active: !p.active },
                            });
                            setError("");
                          } catch (e) {
                            setError(problem(e));
                          }
                        }}
                      >
                        {p.active ? "Despublicar" : "Publicar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!products.length && <Empty title="No hay productos para mostrar" />}
      </section>
      <p className="notice">
        Probá crear un diseño, cambiarle el precio o despublicarlo. Abrí la
        tienda en este mismo navegador para ver el resultado.
      </p>
    </>
  );
}
const newVariant = (): DemoVariant => ({
  id: crypto.randomUUID(),
  color: "",
  size: "",
  sku: "",
  price: 0,
  cost: 0,
  stock: 0,
  minStock: 3,
  active: true,
});
function ProductEditor({
  state,
  product,
  isNew,
  act,
}: { state: DemoBusiness; product?: DemoProduct; isNew: boolean } & Actions) {
  const router = useRouter(),
    [data, setData] = useState<DemoProduct>(() =>
      product
        ? structuredClone(product)
        : {
            id: crypto.randomUUID(),
            name: "",
            slug: "",
            description: "",
            image: "/brand/santos-shirts-v2.webp",
            active: true,
            featured: true,
            variants: [newVariant()],
          },
    ),
    [error, setError] = useState("");
  if (!isNew && !product)
    return (
      <Empty title="Producto de prueba inexistente">
        <Link href={`${base}/productos`}>Ver productos</Link>
      </Empty>
    );
  const field = (
    i: number,
    key: keyof DemoVariant,
    value: string | number | boolean,
  ) =>
    setData((d) => ({
      ...d,
      variants: d.variants.map((v, index) =>
        index === i ? { ...v, [key]: value } : v,
      ),
    }));
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      act({ type: "save-product", product: demoProductSchema.parse(data) });
      router.push(`${base}/productos`);
    } catch (e) {
      setError(problem(e));
    }
  }
  return (
    <>
      <Title
        title={isNew ? "Creá un diseño de prueba." : `Editar ${product!.name}`}
      />
      <form onSubmit={submit} className="form-stack">
        <section className="panel form-stack">
          <h2>Información del producto</h2>
          <div className="form-grid">
            <label>
              Nombre
              <input
                required
                minLength={2}
                maxLength={150}
                value={data.name}
                onChange={(e) =>
                  setData((d) => ({ ...d, name: e.target.value }))
                }
              />
            </label>
            <label>
              Identificador de URL
              <input
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                value={data.slug}
                onChange={(e) =>
                  setData((d) => ({ ...d, slug: e.target.value }))
                }
                placeholder="remera-prueba"
              />
            </label>
          </div>
          <label>
            Descripción
            <textarea
              required
              maxLength={5000}
              rows={3}
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
              Publicado en la tienda de prueba
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={data.featured}
                onChange={(e) =>
                  setData((d) => ({ ...d, featured: e.target.checked }))
                }
              />
              Destacado
            </label>
          </div>
        </section>
        <section className="panel">
          <h2>Fotografía de muestra</h2>
          <div className="demo-photo-editor">
            <img src={data.image} alt="Vista previa del producto" />
            <div>
              <label>
                Elegir imagen de prueba
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (
                      file.size > 1000000 ||
                      !["image/jpeg", "image/png", "image/webp"].includes(
                        file.type,
                      )
                    ) {
                      setError(
                        "Usá JPG, PNG o WebP de hasta 1 MB para la demo.",
                      );
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      setData((d) => ({ ...d, image: String(reader.result) }));
                      setError("");
                    };
                    reader.onerror = () =>
                      setError("No se pudo leer la imagen.");
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              <p className="fine-print">
                La imagen se conserva solo en este navegador. Máximo 1 MB para
                no ocupar demasiado espacio.
              </p>
              <button
                type="button"
                className="text-link"
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    image: "/brand/santos-shirts-v2.webp",
                  }))
                }
              >
                Usar imagen SANTOS
              </button>
            </div>
          </div>
        </section>
        <section className="panel">
          <h2>Variantes, costos y precios ({state.settings.currency})</h2>
          <p className="muted">
            El stock se carga después desde Inventario; editar precios conserva
            los importes históricos de los pedidos.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Color</th>
                  <th>Talle</th>
                  <th>SKU</th>
                  <th>Precio</th>
                  <th>Costo</th>
                  <th>Mínimo</th>
                  <th>Activa</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.variants.map((v, i) => (
                  <tr key={v.id}>
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
                          max={
                            ["price", "cost"].includes(k)
                              ? 999999999
                              : undefined
                          }
                          step={k === "price" || k === "cost" ? ".01" : "1"}
                          value={v[k]}
                          onChange={(e) =>
                            field(
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
                        onChange={(e) => field(i, "active", e.target.checked)}
                      />
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        type="button"
                        disabled={data.variants.length === 1}
                        aria-label={`Quitar variante ${i + 1}`}
                        onClick={() =>
                          setData((d) => ({
                            ...d,
                            variants: d.variants.filter((x) => x.id !== v.id),
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
                variants: [...d.variants, newVariant()],
              }))
            }
          >
            <Plus size={16} />
            Agregar variante
          </button>
        </section>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="inline">
          <button className="button">Guardar producto de prueba</button>
          <Link href={`${base}/productos`}>Cancelar</Link>
        </div>
      </form>
    </>
  );
}
function Inventory({ state, act }: { state: DemoBusiness } & Actions) {
  const [q, setQ] = useState(""),
    [low, setLow] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    variants = demoVariants(state),
    shown = variants.filter(
      (v) =>
        (!q ||
          `${v.productName} ${v.sku}`
            .toLocaleLowerCase("es")
            .includes(q.toLocaleLowerCase("es"))) &&
        (!low || v.stock <= v.minStock),
    );
  return (
    <>
      <Title title="Inventario de prueba conectado." />
      <form
        className="panel form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget,
            fields = new FormData(form);
          try {
            act({
              type: "adjust-stock",
              variantId: String(fields.get("variantId")),
              quantity: Number(fields.get("quantity")),
              reason: String(fields.get("reason")),
            });
            setSuccess(
              "Movimiento de prueba registrado. La tienda ya muestra el nuevo stock.",
            );
            setError("");
            form.reset();
          } catch (e) {
            setError(problem(e));
            setSuccess("");
          }
        }}
      >
        <h2>Registrar movimiento de prueba</h2>
        <div className="form-grid">
          <div>
            <label htmlFor="demo-variant">Variante</label>
            <select id="demo-variant" name="variantId" required>
              <option value="">Seleccioná una variante</option>
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.productName} · {v.color}/{v.size} · {v.stock} uds.
                </option>
              ))}
            </select>
          </div>
          <label>
            Unidades (+ ingreso / − baja)
            <input
              name="quantity"
              type="number"
              min="-100000"
              max="100000"
              step="1"
              required
            />
          </label>
          <label>
            Motivo
            <input
              name="reason"
              minLength={3}
              maxLength={300}
              required
              placeholder="Ingreso, ajuste, merma…"
            />
          </label>
        </div>
        <div>
          <button className="button">Registrar movimiento</button>
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
      <div className="filters">
        <label>
          Buscar producto o SKU
          <input value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={low}
            onChange={(e) => setLow(e.target.checked)}
          />
          Solo stock mínimo
        </label>
      </div>
      <section className="panel">
        <h2>Stock por variante</h2>
        <p className="muted">
          Total mostrado: {shown.reduce((s, v) => s + v.stock, 0)} unidades de
          ejemplo
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Variante</th>
                <th>SKU</th>
                <th>Stock</th>
                <th>Mínimo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((v) => (
                <tr key={v.id}>
                  <td>{v.productName}</td>
                  <td>
                    {v.color}/{v.size}
                  </td>
                  <td>{v.sku}</td>
                  <td>
                    <strong>{v.stock}</strong>
                  </td>
                  <td>{v.minStock}</td>
                  <td>
                    <Badge>
                      {!v.active
                        ? "Inactiva"
                        : !v.stock
                          ? "Agotada"
                          : v.stock <= v.minStock
                            ? "Stock bajo"
                            : "Disponible"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <h2>Últimos movimientos de prueba</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto / variante</th>
                <th>Unidades</th>
                <th>Motivo</th>
                <th>Referencia</th>
              </tr>
            </thead>
            <tbody>
              {state.movements.slice(0, 100).map((m) => {
                const v = variants.find((v) => v.id === m.variantId);
                return (
                  <tr key={m.id}>
                    <td>{date(m.at)}</td>
                    <td>
                      {v?.productName}
                      <small>
                        {v?.color}/{v?.size}
                      </small>
                    </td>
                    <td className={m.quantity > 0 ? "positive" : "negative"}>
                      {m.quantity > 0 ? "+" : ""}
                      {m.quantity}
                    </td>
                    <td>{m.reason}</td>
                    <td>
                      {m.orderId ? (
                        <Link href={`${base}/ventas/${m.orderId}`}>
                          {m.orderId.slice(0, 18)} ↗
                        </Link>
                      ) : (
                        "Ajuste local"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
function OrderTable({ orders }: { orders: DemoOrder[] }) {
  return orders.length ? (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Pedido / fecha</th>
            <th>Cliente de ejemplo</th>
            <th>Productos</th>
            <th>Total</th>
            <th>Estado</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <strong>{o.id.slice(0, 18)}</strong>
                <small>{date(o.createdAt)}</small>
              </td>
              <td>
                {o.customerName}
                <small>{o.customerEmail}</small>
              </td>
              <td>
                {o.items
                  .map(
                    (i) =>
                      `${i.quantity} × ${i.productName} (${i.color}/${i.size})`,
                  )
                  .join(", ")}
              </td>
              <td>{money(o.total, o.currency)}</td>
              <td>
                <Badge>{labels[o.status]}</Badge>
              </td>
              <td>
                <Link href={`${base}/ventas/${o.id}`}>Ver detalle ↗</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty title="No hay pedidos para mostrar" />
  );
}
function Orders({ state }: { state: DemoBusiness }) {
  const [status, setStatus] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    shown = state.orders.filter(
      (o) =>
        (!status || o.status === status) &&
        (!from || o.createdAt.slice(0, 10) >= from) &&
        (!to || o.createdAt.slice(0, 10) <= to),
    );
  return (
    <>
      <Title title="Pedidos y ventas de prueba.">
        <Link className="button secondary" href="/tienda">
          Crear uno desde la tienda ↗
        </Link>
      </Title>
      <div className="filters">
        <label>
          Desde
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          Hasta
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <div>
          <label htmlFor="demo-order-status">Estado</label>
          <select
            id="demo-order-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos</option>
            {Object.entries(labels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>
      <section className="panel">
        <OrderTable orders={shown} />
      </section>
      <p className="notice">
        Confirmar un pedido de prueba descuenta stock y actualiza las
        estadísticas de este navegador. Cancelarlo reintegra las unidades una
        sola vez.
      </p>
    </>
  );
}
function OrderDetail({
  state,
  order,
  act,
}: { state: DemoBusiness; order?: DemoOrder } & Actions) {
  const [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  if (!order)
    return (
      <Empty title="Pedido de prueba inexistente">
        <Link href={`${base}/ventas`}>Ver pedidos</Link>
      </Empty>
    );
  return (
    <>
      <Title title={`Pedido ${order.id.slice(0, 18)}`}>
        <Badge>{labels[order.status]}</Badge>
      </Title>
      <div className="dashboard-grid">
        <section className="panel">
          <h2>{order.customerName}</h2>
          <p>{order.customerEmail}</p>
          <p className="description">{order.note}</p>
          <p className="muted">Creado: {date(order.createdAt)}</p>
          <div className="inline">
            {transitions[order.status].map((status) => (
              <button
                className={`button ${status === "CANCELLED" ? "danger" : ""}`}
                key={status}
                onClick={() => {
                  if (
                    status === "CANCELLED" &&
                    !confirm(
                      "¿Cancelar este pedido de prueba y reintegrar su stock si corresponde?",
                    )
                  )
                    return;
                  try {
                    act({ type: "change-status", id: order.id, status });
                    setError("");
                    setSuccess("Estado de prueba actualizado.");
                  } catch (e) {
                    setError(problem(e));
                  }
                }}
              >
                {status === "CONFIRMED"
                  ? "Confirmar y descontar stock"
                  : status === "CANCELLED"
                    ? "Cancelar pedido"
                    : labels[status]}
              </button>
            ))}
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
          <p className="fine-print">
            Esta operación es simulada. No registra cobros ni afecta una base de
            datos real.
          </p>
        </section>
        <section className="panel">
          <h2>Historial de estados</h2>
          <ol className="timeline">
            {order.history.map((h, i) => (
              <li key={i}>
                <strong>{labels[h.status]}</strong>
                <span>{date(h.at)} · Prueba local</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <section className="panel">
        <h2>Productos e importes históricos</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Variante</th>
                <th>Cantidad</th>
                <th>Precio unitario</th>
                <th>Costo unitario</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i) => (
                <tr key={i.variantId}>
                  <td>{i.productName}</td>
                  <td>
                    {i.color}/{i.size}
                  </td>
                  <td>{i.quantity}</td>
                  <td>{money(i.unitPrice, order.currency)}</td>
                  <td>{money(i.unitCost, order.currency)}</td>
                  <td>{money(i.unitPrice * i.quantity, order.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="summary-row">
          <strong>Total de ejemplo</strong>
          <strong>{money(order.total, order.currency)}</strong>
        </div>
        <p>Inventario descontado: {order.stockDeducted ? "Sí" : "No"}</p>
      </section>
      <Link className="back" href={`${base}/ventas`}>
        ← Volver a pedidos
      </Link>
    </>
  );
}
function Costs({ state }: { state: DemoBusiness }) {
  const variants = demoVariants(state),
    currency = state.settings.currency;
  return (
    <>
      <Title title="Costos y márgenes de prueba." />
      <p className="notice">
        Ganancia bruta = precio − costo. Margen = ganancia / precio. Recargo =
        ganancia / costo. Son datos de ejemplo y no incluyen impuestos,
        comisiones, envíos ni gastos operativos.
      </p>
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto / variante</th>
                <th>Costo</th>
                <th>Precio</th>
                <th>Ganancia bruta</th>
                <th>Margen</th>
                <th>Recargo</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => {
                const m = margins(v.price, v.cost);
                return (
                  <tr key={v.id}>
                    <td>
                      {v.productName}
                      <small>
                        {v.color}/{v.size}
                      </small>
                    </td>
                    <td>{money(v.cost, currency)}</td>
                    <td>{money(v.price, currency)}</td>
                    <td>{money(m.profit, currency)}</td>
                    <td>{percent(m.margin)}</td>
                    <td>{percent(m.markup)}</td>
                    <td>
                      <Link href={`${base}/productos/${v.productId}`}>
                        Editar ↗
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <h2>Cambios de precios realizados en esta prueba</h2>
        {!state.priceHistory.length ? (
          <Empty title="Todavía no cambiaste precios ni costos">
            Editá un producto para probar el historial.
          </Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Variante</th>
                  <th>Precio</th>
                  <th>Costo</th>
                </tr>
              </thead>
              <tbody>
                {state.priceHistory.slice(0, 50).map((h) => {
                  const v = variants.find((v) => v.id === h.variantId);
                  return (
                    <tr key={h.id}>
                      <td>{date(h.at)}</td>
                      <td>
                        {v?.productName} · {v?.color}/{v?.size}
                      </td>
                      <td>{money(h.price, currency)}</td>
                      <td>{money(h.cost, currency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
function Configuration({ state, act }: { state: DemoBusiness } & Actions) {
  const [data, setData] = useState(state.settings),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  return (
    <>
      <Title title="Configuración de prueba." />
      <form
        className="panel form-stack narrow"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            act({
              type: "settings",
              settings: demoBusinessSettingsSchema.parse(data),
            });
            setError("");
            setSuccess(
              "Configuración de prueba guardada. Revisá la tienda en este navegador.",
            );
          } catch (e) {
            setError(problem(e));
            setSuccess("");
          }
        }}
      >
        <label>
          Nombre comercial
          <input
            required
            minLength={2}
            maxLength={100}
            value={data.name}
            onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
          />
        </label>
        <label>
          Descripción
          <textarea
            maxLength={1000}
            rows={3}
            value={data.description}
            onChange={(e) =>
              setData((d) => ({ ...d, description: e.target.value }))
            }
          />
        </label>
        <div className="form-grid">
          <label>
            Moneda
            <input value={data.currency} readOnly />
          </label>
          <label>
            Color de acento
            <input
              type="color"
              value={data.accent}
              onChange={(e) =>
                setData((d) => ({ ...d, accent: e.target.value }))
              }
            />
          </label>
        </div>
        <p className="fine-print">
          La moneda se conserva para no mezclar los importes de los pedidos de
          ejemplo. Los logos originales SANTOS están aplicados en toda la demo.
        </p>
        <p className="notice">
          No necesitás contraseña para este panel: solo administra datos de
          prueba de tu navegador. La administración real mantiene su inicio de
          sesión y permisos del servidor.
        </p>
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
        <button className="button">Guardar configuración de prueba</button>
      </form>
    </>
  );
}
