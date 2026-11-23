import { NextRequest, NextResponse } from "next/server";
import { Prisma, OrderStatus } from "@prisma/client";
import { ZodError, z } from "zod";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/mode";
import {
  AppError,
  publicRateLimit,
  requireAdmin,
  sameOrigin,
} from "@/lib/security";
import {
  adjustStock,
  changeOrderStatus,
  createOrder,
  saveProduct,
  saveSettings,
} from "@/lib/services";
export const runtime = "nodejs";
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  if (isDemoMode())
    return NextResponse.json(
      {
        error:
          "Esta es una demostración: no se guardan pedidos ni cambios administrativos.",
      },
      { status: 503 },
    );
  try {
    sameOrigin(request);
    if (Number(request.headers.get("content-length") || 0) > 500000)
      throw new AppError("Solicitud demasiado grande.", 413);
    const path = (await ctx.params).path;
    if (path.join("/") === "orders") {
      // Global database bucket: no trust in proxy headers supplied by visitors.
      await publicRateLimit("checkout-global", 60);
      return NextResponse.json(await createOrder(await request.json()));
    }
    const admin = await requireAdmin();
    const raw: unknown = await request.json();
    if (path[0] === "products" && path.length <= 2)
      return NextResponse.json(await saveProduct(raw, admin.id, path[1]));
    if (path.join("/") === "inventory")
      return NextResponse.json(await adjustStock(raw, admin.id));
    if (path[0] === "orders" && path.length === 2) {
      const { status } = z.object({ status: z.enum(OrderStatus) }).parse(raw);
      return NextResponse.json(
        await changeOrderStatus(path[1], status, admin.id),
      );
    }
    if (path.join("/") === "settings")
      return NextResponse.json(await saveSettings(raw));
    if (path[0] === "archive" && path.length === 2)
      return NextResponse.json(
        await db.product.update({
          where: { id: path[1] },
          data: { active: false },
        }),
      );
    throw new AppError("Ruta inexistente.", 404);
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    if (error instanceof ZodError)
      return NextResponse.json(
        { error: error.issues.map((i) => i.message).join(" ") },
        { status: 400 },
      );
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return NextResponse.json(
        { error: "Ya existe ese slug, SKU o combinación." },
        { status: 409 },
      );
    if (error instanceof SyntaxError)
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    console.error(
      "Operación fallida",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json(
      {
        error:
          "No se pudo completar la operación. Revisá los datos y reintentá.",
      },
      { status: 500 },
    );
  }
}
