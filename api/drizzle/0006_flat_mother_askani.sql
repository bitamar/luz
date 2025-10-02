ALTER TABLE "treatments" ADD COLUMN IF NOT EXISTS "user_id" uuid;--> statement-breakpoint
-- Backfill existing rows to the provided default vet/user id
UPDATE "treatments" SET "user_id" = '3f66b1a1-c20d-4712-b045-074947f8598d' WHERE "user_id" IS NULL;--> statement-breakpoint
-- Enforce NOT NULL after backfill
ALTER TABLE "treatments" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "treatments" ADD CONSTRAINT "treatments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "treatments_user_id_name_unique" ON "treatments" USING btree ("user_id","name");