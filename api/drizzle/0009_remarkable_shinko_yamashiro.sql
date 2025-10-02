ALTER TABLE "treatments" RENAME COLUMN "duration_months" TO "default_interval_months";--> statement-breakpoint
ALTER TABLE "treatments" ALTER COLUMN "default_interval_months" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "treatments" ADD COLUMN "price" integer;