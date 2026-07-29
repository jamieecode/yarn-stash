import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { extractToken } from "./auth.guard";

// 토큰이 있으면 검증해서 request.user를 채우고, 없거나 잘못돼도 막지 않고 그냥 통과시키는 가드.
// 도안/실 검색·조회처럼 "게스트도 볼 수 있지만, 로그인했으면 내 찜 여부 같은 걸 같이 보여주고 싶은" 곳에 사용.
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = extractToken(request);
    if (token) {
      try {
        request.user = this.jwtService.verify(token);
      } catch {
        // 토큰이 이상해도 조회 자체는 막지 않음 - request.user만 비워둠
      }
    }
    return true;
  }
}
