import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, ValidateIf } from "class-validator";
import { IsGteProperty } from "../../common/validators/is-gte-property.validator";

// 보내지 않은 필드만 건너뛴다 - @IsOptional은 null도 통과시키므로, 비울 수 없는 필드에 null이 오면 400으로 막기 위해 사용
const IsPresent = () => ValidateIf((_, value) => value !== undefined);

// 화면설계서 6-1(도안 수정) - ravelryId/sourceType은 수정 대상에서 제외 (출처는 불변으로 유지)
// 필드를 보내지 않으면(undefined) 변경 없음, 선택 항목에 null을 보내면 값을 비운다
export class UpdatePatternDto {
  @IsPresent() @IsString() @IsNotEmpty() name?: string;
  @IsOptional() @IsString() designer?: string | null;

  @IsPresent()
  @IsIn(["KNITTING", "CROCHET", "BOTH"])
  craftType?: "KNITTING" | "CROCHET" | "BOTH";

  @IsPresent() @IsString() @IsNotEmpty() weightCategory?: string;

  @IsPresent() @IsNumber() @IsPositive() requiredMinM?: number;
  @IsOptional() @IsNumber() @IsPositive() @IsGteProperty("requiredMinM") requiredMaxM?: number | null;
  @IsPresent() @IsIn(["METRIC", "IMPERIAL"]) requiredUnit?: "METRIC" | "IMPERIAL";

  @IsOptional() @IsNumber() @IsPositive() gaugeStitches?: number | null;
  @IsOptional() @IsString() sourceUrl?: string | null;

  @IsOptional() @IsString() originalYarnCatalogId?: string | null;
  @IsOptional() @IsString() originalYarnBrand?: string | null;
  @IsOptional() @IsString() originalYarnLine?: string | null;
}
