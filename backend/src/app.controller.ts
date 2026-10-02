import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";

@Controller()
export class AppController {
  // UptimeRobot이 주기적으로 핑하는 경로라 요청 한도에서 뺀다
  @SkipThrottle()
  @Get("health")
  health() {
    return { status: "ok" };
  }
}
