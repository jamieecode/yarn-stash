import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { IsGteProperty } from "../../common/validators/is-gte-property.validator";

// 화면설계서 6-1(도안 수정) - ravelryId/sourceType은 수정 대상에서 제외 (출처는 불변으로 유지)
export class UpdatePatternDto {
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @IsOptional() @IsString() designer?: string;

  @IsOptional()
  @IsIn(["KNITTING", "CROCHET", "BOTH"])
  craftType?: "KNITTING" | "CROCHET" | "BOTH";

  @IsOptional() @IsString() @IsNotEmpty() weightCategory?: string;

  @IsOptional() @IsNumber() @IsPositive() requiredMinM?: number;
  @IsOptional() @IsNumber() @IsPositive() @IsGteProperty("requiredMinM") requiredMaxM?: number;
  @IsOptional() @IsIn(["METRIC", "IMPERIAL"]) requiredUnit?: "METRIC" | "IMPERIAL";

  @IsOptional() @IsNumber() @IsPositive() gaugeStitches?: number;
  @IsOptional() @IsString() sourceUrl?: string;

  @IsOptional() @IsString() originalYarnCatalogId?: string;
  @IsOptional() @IsString() originalYarnBrand?: string;
  @IsOptional() @IsString() originalYarnLine?: string;
}
