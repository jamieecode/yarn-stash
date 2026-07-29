import { createParamDecorator, ExecutionContext } from "@nestjs/common";

// 컨트롤러에서 @CurrentUser() user: { userId: string } 형태로 바로 꺼내 쓰기 위한 데코레이터.
// AuthGuard/OptionalAuthGuard가 req.user에 미리 심어둔 값을 그대로 반환한다.
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
