export function Brand({
  name = "SANTOS",
  logo,
  light = false,
  mark = false,
  className = "",
}: {
  name?: string;
  logo?: string | null;
  light?: boolean;
  mark?: boolean;
  className?: string;
}) {
  const builtIn = !logo || logo.startsWith("/brand/");
  const source = mark
    ? `/brand/santos-mark-${light ? "white" : "black"}.png`
    : builtIn
      ? `/brand/santos-logo-${light ? "white" : "black"}.png`
      : logo;
  return (
    <img
      src={source}
      alt={name}
      className={`santos-brand ${mark ? "santos-mark" : "santos-wordmark"} ${light && !builtIn ? "custom-brand-light" : ""} ${className}`}
    />
  );
}
