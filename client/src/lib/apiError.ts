export function parseApiError(err: unknown): string {
  if (!(err instanceof Error)) return "Error desconocido";
  try {
    const match = err.message?.match(/\d{3}: (.*)/s);
    if (match) {
      const parsed = JSON.parse(match[1]);
      return parsed.error || parsed.message || err.message;
    }
  } catch {}
  return err.message || "Error desconocido";
}
