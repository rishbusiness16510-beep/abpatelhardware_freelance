ALTER TABLE "products" DROP CONSTRAINT "products_sku_unique";
--> statement-breakpoint
ALTER TABLE "products" RENAME COLUMN "sku" TO "product_code";
--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "product_code" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_product_code_unique" UNIQUE("product_code");
--> statement-breakpoint
ALTER TABLE "product_variants" RENAME COLUMN "sku" TO "product_code";
--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "product_code" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "order_items" RENAME COLUMN "sku" TO "product_code";
--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "product_code" DROP NOT NULL;
--> statement-breakpoint
UPDATE "products" SET "product_code" = NULL WHERE btrim("product_code") = '';
--> statement-breakpoint
UPDATE "product_variants" SET "product_code" = NULL WHERE btrim("product_code") = '';
--> statement-breakpoint
ALTER TABLE "product_images" DROP CONSTRAINT "product_images_variant_id_product_variants_id_fk";
--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;