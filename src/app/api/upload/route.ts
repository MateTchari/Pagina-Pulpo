import { NextResponse } from "next/server";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireAdmin, sameOrigin, AppError } from "@/lib/security";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await requireAdmin();
    if (Number(request.headers.get("content-length") || 0) > 6 * 1024 * 1024)
      throw new AppError("Máximo 5 MB.", 413);
    const file = (await request.formData()).get("file");
    if (
      !(file instanceof File) ||
      file.size > 5 * 1024 * 1024 ||
      !["image/png", "image/jpeg", "image/webp"].includes(file.type)
    )
      throw new AppError("Elegí una imagen JPG, PNG o WebP de hasta 5 MB.");
    const buffer = Buffer.from(await file.arrayBuffer());
    const image = sharp(buffer, { limitInputPixels: 25000000 });
    const metadata = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format ?? ""))
      throw new AppError("Formato no permitido.");
    const output = await image
      .rotate()
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    const name = `${crypto.randomUUID()}.webp`;
    await mkdir(path.join(process.cwd(), "uploads"), { recursive: true });
    await writeFile(path.join(process.cwd(), "uploads", name), output, {
      flag: "wx",
    });
    return NextResponse.json({ url: `/api/media/${name}` });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof AppError ? e.message : "No se pudo procesar la imagen.",
      },
      { status: e instanceof AppError ? e.status : 400 },
    );
  }
}
