export function appMode() {
  const mode = process.env.APP_MODE || "demo";
  if (mode !== "demo" && mode !== "live")
    throw new Error("APP_MODE debe ser demo o live.");
  return mode;
}
export function isDemoMode() {
  return appMode() === "demo";
}
