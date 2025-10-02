ALTER TABLE "treatments" ADD COLUMN IF NOT EXISTS "is_deleted" boolean DEFAULT false NOT NULL;


