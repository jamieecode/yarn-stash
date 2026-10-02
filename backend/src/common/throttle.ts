import { Throttle } from "@nestjs/throttler";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

// 모든 엔드포인트 기본값(IP 기준) - 일반 사용으로는 닿지 않을 만큼 넉넉하게, 스크립트로 두드리는 것만 막는 용도
export const DEFAULT_THROTTLE = { ttl: MINUTE, limit: 120 };

// 로그인 없이 누구나 호출할 수 있어 DB에 유저 행을 무한히 만들 수 있는 유일한 경로.
// 학교/회사처럼 IP를 공유하는 곳에서도 막히지 않도록 시간당 20개로 둔다
export const ThrottleGuestCreation = () => Throttle({ default: { ttl: HOUR, limit: 20 } });

// Ravelry로 그대로 프록시되는 경로 - 우리 쪽 남용이 Ravelry API 키 한도/차단으로 이어지므로 따로 묶는다.
// 검색은 자동완성(300ms 디바운스)에서 연달아 불리므로 상세 조회보다 여유를 둔다
export const ThrottleRavelrySearch = () => Throttle({ default: { ttl: MINUTE, limit: 60 } });
export const ThrottleRavelryDetail = () => Throttle({ default: { ttl: MINUTE, limit: 30 } });
