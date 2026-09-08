// ko/en 번역 파일 쌍의 키 집합이 정확히 일치하는지 검사 - 번역 누락/오타를 빌드 타임이 아닌 시점에 잡아내기 위한 스크립트
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const LOCALES_DIR = join(import.meta.dirname, "..", "src", "locales");

function flattenKeys(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return [prefix];
  return Object.entries(obj).flatMap(([key, value]) => flattenKeys(value, prefix ? `${prefix}.${key}` : key));
}

function loadNamespace(lang: string, namespace: string): Set<string> | null {
  try {
    const raw = readFileSync(join(LOCALES_DIR, lang, namespace), "utf-8");
    return new Set(flattenKeys(JSON.parse(raw)));
  } catch {
    return null;
  }
}

// 한쪽 언어에만 존재하는 네임스페이스 파일도 놓치지 않도록 두 디렉터리의 파일 목록을 합집합으로 순회한다
const namespaces = new Set([...readdirSync(join(LOCALES_DIR, "ko")), ...readdirSync(join(LOCALES_DIR, "en"))]);
let hasError = false;

for (const namespace of namespaces) {
  const koKeys = loadNamespace("ko", namespace);
  const enKeys = loadNamespace("en", namespace);

  if (koKeys === null || enKeys === null) {
    hasError = true;
    console.error(`[${namespace}] ${koKeys === null ? "ko" : "en"}에 파일이 없어요`);
    continue;
  }

  const missingInEn = [...koKeys].filter((k) => !enKeys.has(k));
  const missingInKo = [...enKeys].filter((k) => !koKeys.has(k));

  if (missingInEn.length > 0) {
    hasError = true;
    console.error(`[${namespace}] en에 없는 키:`, missingInEn);
  }
  if (missingInKo.length > 0) {
    hasError = true;
    console.error(`[${namespace}] ko에 없는 키:`, missingInKo);
  }
}

if (hasError) {
  console.error("\n번역 키 불일치가 발견됐어요.");
  process.exit(1);
} else {
  console.log(`번역 키 일치 확인 완료 (${namespaces.size}개 네임스페이스).`);
}
