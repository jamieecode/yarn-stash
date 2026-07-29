import { IsIn, IsInt, IsNumber, IsOptional, IsString } from "class-validator";

export class CreatePatternDto {
  @IsString() name: string;
  @IsOptional() @IsString() designer?: string;

  @IsIn(["KNITTING", "CROCHET", "BOTH"])
  craftType: "KNITTING" | "CROCHET" | "BOTH";

  @IsString() weightCategory: string;

  @IsNumber() requiredMinM: number;
  @IsOptional() @IsNumber() requiredMaxM?: number;
  @IsIn(["METRIC", "IMPERIAL"]) requiredUnit: "METRIC" | "IMPERIAL";

  @IsOptional() @IsNumber() gaugeStitches?: number;
  @IsOptional() @IsString() sourceUrl?: string;

  @IsIn(["RAVELRY", "LINK", "USER"])
  sourceType: "RAVELRY" | "LINK" | "USER";

  @IsOptional() @IsInt() ravelryId?: number;
  @IsOptional() @IsString() originalYarnCatalogId?: string;
  @IsOptional() @IsString() originalYarnBrand?: string;
  @IsOptional() @IsString() originalYarnLine?: string;
}
