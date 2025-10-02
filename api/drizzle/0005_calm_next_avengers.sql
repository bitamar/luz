ALTER TABLE "customers" DROP CONSTRAINT "customers_phone_unique";--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "user_id" uuid;--> statement-breakpoint

-- Backfill existing rows to the provided default vet/user id
UPDATE "customers" SET "user_id" = '3f66b1a1-c20d-4712-b045-074947f8598d' WHERE "user_id" IS NULL;--> statement-breakpoint

-- Enforce NOT NULL after backfill
ALTER TABLE "customers" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "customers_user_id_phone_unique" ON "customers" USING btree ("user_id","phone");