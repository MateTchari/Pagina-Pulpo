"use client";
import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { useCart } from "./cart-provider";
import { money } from "@/lib/money";
type Variant = {
  id: string;
  color: string;
  size: string;
  price: number;
  stock: number;
};
export function ProductDetail({
  name,
  description,
  images,
  variants,
  currency,
  demo = false,
}: {
  name: string;
  description: string;
  images: { url: string; alt: string }[];
  variants: Variant[];
  currency: string;
  demo?: boolean;
}) {
  const [color, setColor] = useState(variants[0]?.color ?? ""),
    [size, setSize] = useState(""),
    [quantity, setQuantity] = useState(1),
    [added, setAdded] = useState(false),
    [image, setImage] = useState(0);
  const { add } = useCart(),
    selected = variants.find((v) => v.color === color && v.size === size);
  return (
    <div className="detail-grid">
      <div>
        <div className="detail-image">
          {images[image] ? (
            <img src={images[image].url} alt={images[image].alt || name} />
          ) : (
            <img
              src="/brand/santos-shirts-v2.webp"
              alt="Imagen provisoria de referencia: remeras SANTOS con el logo de la marca"
            />
          )}
        </div>
        {!images.length && (
          <p className="fine-print">
            Imagen de referencia provisoria. La fotografía del diseño se
            actualizará próximamente.
          </p>
        )}
        <div className="thumbnails">
          {images.map((im, i) => (
            <button
              key={im.url}
              onClick={() => setImage(i)}
              aria-label={`Ver imagen ${i + 1}`}
              aria-pressed={image === i}
            >
              <img src={im.url} alt={im.alt} />
            </button>
          ))}
        </div>
      </div>
      <div className="detail-copy">
        <span className="eyebrow">DISEÑADO PARA EXPRESARTE</span>
        <h1>{name}</h1>
        <p className="detail-price">
          {selected
            ? money(selected.price, currency)
            : variants.length
              ? `Desde ${money(Math.min(...variants.map((v) => v.price)), currency)}`
              : "Sin variantes disponibles"}
        </p>
        <p className="description">{description}</p>
        <fieldset>
          <legend>
            01 / Color <strong>{color}</strong>
          </legend>
          <div className="choices">
            {[...new Set(variants.map((v) => v.color))].map((c) => (
              <button
                key={c}
                className={color === c ? "selected" : ""}
                onClick={() => {
                  setColor(c);
                  setSize("");
                  setAdded(false);
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>02 / Talle</legend>
          <div className="choices">
            {variants
              .filter((v) => v.color === color)
              .map((v) => (
                <button
                  key={v.id}
                  disabled={!v.stock}
                  className={size === v.size ? "selected" : ""}
                  onClick={() => {
                    setSize(v.size);
                    setQuantity(1);
                    setAdded(false);
                  }}
                >
                  {v.size}
                  {!v.stock ? " · agotado" : ""}
                </button>
              ))}
          </div>
        </fieldset>
        <p className="availability" aria-live="polite">
          {selected
            ? `${selected.stock} unidades ${demo ? "de ejemplo" : "disponibles"}`
            : "Elegí un color y talle para consultar disponibilidad."}
        </p>
        <label>
          Cantidad
          <input
            type="number"
            min="1"
            max={Math.min(100, selected?.stock ?? 1)}
            value={quantity}
            onChange={(e) => {
              setQuantity(
                Math.max(1, Math.min(100, Number(e.target.value) || 1)),
              );
              setAdded(false);
            }}
            className="quantity"
          />
        </label>
        <button
          className="button wide"
          disabled={!selected || quantity > selected.stock}
          onClick={() => {
            if (selected) {
              add({
                variantId: selected.id,
                name,
                color,
                size,
                quantity,
                price: selected.price,
                image: images[0]?.url,
              });
              setAdded(true);
            }
          }}
        >
          {added ? (
            <>
              <Check size={18} />
              Agregado al carrito
            </>
          ) : (
            <>
              <ShoppingBag size={18} />
              Agregar al carrito
            </>
          )}
        </button>
        <p className="fine-print">
          {demo
            ? "Precio y stock de muestra para probar la página. No se registran compras."
            : "El stock y el precio se verifican al crear el pedido. La disponibilidad se asegura al confirmar la venta."}
        </p>
      </div>
    </div>
  );
}
