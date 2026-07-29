import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

// 토큰이 없거나 유효하지 않으면 401을 던지는 가드.
// 게스트도 User 레코드라 로그인 자체는 아니지만, 게스트가 발급받은 JWT도 유효한 토큰이므로 통과함
// (예: 실 등록은 게스트도 가능해야 하니까). "로그인(카카오/구글)까지 요구"가 아니라 "유효한 세션 요구"가 이 가드의 역할.
// 공유 데이터(도안/실카탈로그) 등록·수정처럼 "게스트는 막고 진짜 로그인만 허용"해야 하는 곳은
// 이 가드 통과 후 서비스 레이어에서 request.user.provider !== 'GUEST'를 추가로 체크한다.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = extractToken(request);
    if (!token) {
      throw new UnauthorizedException("로그인이 필요해요");
    }
    try {
      request.user = this.jwtService.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException("세션이 만료됐어요, 다시 로그인해주세요");
    }
  }
}

function extractToken(request: any): string | null {
  const header = request.headers?.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

export { extractToken };
