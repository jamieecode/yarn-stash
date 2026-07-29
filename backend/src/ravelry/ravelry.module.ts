import { Module } from "@nestjs/common";
import { RavelryService } from "./ravelry.service";

@Module({
  providers: [RavelryService],
  exports: [RavelryService],
})
export class RavelryModule {}
