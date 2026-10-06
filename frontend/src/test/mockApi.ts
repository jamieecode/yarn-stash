import { vi } from "vitest";

type Handler = (body: unknown) => { status: number; body?: unknown };

// "METHOD /path" → 응답. API 주소 접두사와 쿼리스트링은 떼고 비교한다 - 화면 테스트에서 백엔드 응답을 흉내 내는 용도
export function mockApi(routes: Record<string, Handler>) {
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const { pathname } = new URL(String(input));
    const key = `${init?.method ?? "GET"} ${pathname.replace(/^\/api/, "")}`;
    const handler = routes[key];
    if (!handler) throw new Error(`mockApi: 처리하지 않은 요청 ${key}`);
    const res = handler(init?.body ? JSON.parse(String(init.body)) : undefined);
    return new Response(res.body === undefined ? null : JSON.stringify(res.body), { status: res.status });
  });
  vi.stubGlobal("fetch", fetch);

  // 특정 요청이 보낸 본문들 - 폼이 서버에 무엇을 보냈는지 확인할 때 쓴다
  function bodiesOf(key: string): unknown[] {
    return fetch.mock.calls
      .filter(([input, init]) => `${init?.method ?? "GET"} ${new URL(String(input)).pathname.replace(/^\/api/, "")}` === key)
      .map(([, init]) => (init?.body ? JSON.parse(String(init.body)) : undefined));
  }

  return { fetch, bodiesOf };
}
