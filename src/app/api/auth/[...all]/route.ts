import { getAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { isDemoMode } from "@/lib/mode";
async function handler(request: Request) {
  if (isDemoMode())
    return Response.json(
      { error: "La autenticación está deshabilitada en esta demostración." },
      { status: 503 },
    );
  const handlers = toNextJsHandler(getAuth());
  return request.method === "GET"
    ? handlers.GET(request)
    : handlers.POST(request);
}
export const GET = handler;
export const POST = handler;
