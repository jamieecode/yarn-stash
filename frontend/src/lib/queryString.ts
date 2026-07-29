// URLSearchParams는 undefined/false 값을 그대로 문자열화해버리므로, 값이 있는 것만 골라 쿼리스트링을 만든다
export function buildQuery(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, string | number | boolean | undefined>)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
