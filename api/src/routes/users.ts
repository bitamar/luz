import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { ensureAuthed } from '../plugins/auth.js';
import { conflict, notFound } from '../lib/app-error.js';
import { settingsResponseSchema, updateSettingsBodySchema, userSchema } from '../schemas/users.js';

type UserDto = z.infer<typeof userSchema>;

function serializeUser(input: {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
}): UserDto {
  return {
    id: input.id,
    email: input.email,
    name: input.name ?? null,
    avatarUrl: input.avatarUrl ?? null,
    phone: input.phone ?? null,
  };
}

const userRoutesPlugin: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/settings',
    {
      preHandler: app.authenticate,
      schema: {
        response: {
          200: settingsResponseSchema,
        },
      },
    },
    async (req) => {
      ensureAuthed(req);
      const { user } = req;
      return {
        user: serializeUser({
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          phone: user.phone,
        }),
      };
    }
  );

  app.put(
    '/settings',
    {
      preHandler: app.authenticate,
      schema: {
        body: updateSettingsBodySchema,
        response: {
          200: settingsResponseSchema,
        },
      },
    },
    async (req) => {
      ensureAuthed(req);
      const userId = req.user.id;

      const { name, phone } = req.body;
      const normalizedPhone = phone;
      const nextName = name ?? null;

      try {
        const [row] = await db
          .update(users)
          .set({ name: nextName, phone: normalizedPhone, updatedAt: new Date() })
          .where(eq(users.id, userId))
          .returning();

        if (!row) throw notFound();

        return {
          user: serializeUser({
            id: row.id,
            email: row.email,
            name: row.name,
            avatarUrl: row.avatarUrl,
            phone: row.phone,
          }),
        };
      } catch (err: unknown) {
        if (
          err &&
          typeof err === 'object' &&
          'code' in err &&
          typeof (err as { code?: unknown }).code === 'string' &&
          (err as { code: string }).code === '23505'
        ) {
          throw conflict({ code: 'duplicate_phone' });
        }
        throw err;
      }
    }
  );
};

export const userRoutes = userRoutesPlugin;
