import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
