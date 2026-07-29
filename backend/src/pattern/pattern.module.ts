import { Module } from "@nestjs/common";
import { PatternService } from "./pattern.service";
import { PatternController } from "./pattern.controller";
import { AuthModule } from "../auth/auth.module";
import { RavelryModule } from "../ravelry/ravelry.module";

@Module({
  imports: [AuthModule, RavelryModule],
  controllers: [PatternController],
  providers: [PatternService],
})
export class PatternModule {}
