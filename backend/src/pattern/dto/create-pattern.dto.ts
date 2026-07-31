import { IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { IsGteProperty } from "../../common/validators/is-gte-property.validator";

export class CreatePatternDto {
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() designer?: string;

  @IsIn(["KNITTING", "CROCHET", "BOTH"])
  craftType: "KNITTING" | "CROCHET" | "BOTH";

  @IsString() @IsNotEmpty() weightCategory: string;

  @IsNumber() @IsPositive() requiredMinM: number;
  @IsOptional() @IsNumber() @IsPositive() @IsGteProperty("requiredMinM") requiredMaxM?: number;
  @IsIn(["METRIC", "IMPERIAL"]) requiredUnit: "METRIC" | "IMPERIAL";

  @IsOptional() @IsNumber() @IsPositive() gaugeStitches?: number;
  @IsOptional() @IsString() sourceUrl?: string;

  @IsIn(["RAVELRY", "LINK", "USER"])
  sourceType: "RAVELRY" | "LINK" | "USER";

  @IsOptional() @IsInt() ravelryId?: number;
  @IsOptional() @IsString() originalYarnCatalogId?: string;
  @IsOptional() @IsString() originalYarnBrand?: string;
  @IsOptional() @IsString() originalYarnLine?: string;
}
