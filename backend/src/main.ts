import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Render는 프록시 뒤에서 돌기 때문에 이게 없으면 req.ip가 전부 프록시 IP가 되어 모든 사용자가 요청 한도(throttler)를
  // 하나로 나눠 쓰게 된다. X-Forwarded-For의 맨 앞(원래 클라이언트)을 쓰므로 헤더를 위조해 한도를 우회할 수는 있지만,
  // 엉뚱한 사용자가 같이 막히는 것보다는 낫다고 판단 (프록시 홉 수를 정확히 고정할 수 없는 환경이라)
  app.set("trust proxy", true);

  // 프론트(Vercel)와 백엔드(Render)가 다른 도메인이라 CORS 필요.
  // 쿠키를 안 쓰고 Authorization 헤더로 JWT를 보내는 방식이라 credentials는 false로 둠.
  const origins = (process.env.FRONTEND_ORIGIN ?? "http://localhost:5173").split(",");
  app.enableCors({
    origin: origins,
    credentials: false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 없는 필드는 자동으로 걸러냄
      transform: true, // 쿼리 파라미터 등을 DTO 타입으로 자동 변환
    }),
  );

  app.setGlobalPrefix("api");

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`실 스태시 트래커 백엔드 실행 중: http://localhost:${port}/api`);
}
bootstrap();
