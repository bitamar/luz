import { z } from 'zod';
import {
  nonEmptyString,
  nullableNumber,
  okResponseSchema,
  optionalNullableNumber,
  uuidSchema,
} from './common.js';

export const treatmentSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  name: nonEmptyString,
  defaultIntervalMonths: nullableNumber,
  price: nullableNumber,
});

export const treatmentsListResponseSchema = z.object({
  treatments: z.array(treatmentSchema),
});

export const createTreatmentBodySchema = z
  .object({
    name: nonEmptyString,
    defaultIntervalMonths: optionalNullableNumber,
    price: optionalNullableNumber,
  })
  .strict();

export const treatmentResponseSchema = z.object({
  treatment: treatmentSchema,
});

export const updateTreatmentParamsSchema = z.object({
  id: uuidSchema,
});

export const updateTreatmentBodySchema = z
  .object({
    name: nonEmptyString.optional(),
    defaultIntervalMonths: optionalNullableNumber,
    price: optionalNullableNumber,
  })
  .strict()
  .superRefine((data, ctx) => {
    if (!Object.values(data).some((value) => value !== undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one field must be provided',
        path: [],
      });
    }
  });

export const treatmentParamsSchema = z.object({
  id: uuidSchema,
});

export const deleteTreatmentResponseSchema = okResponseSchema;

export type Treatment = z.infer<typeof treatmentSchema>;
export type TreatmentsListResponse = z.infer<typeof treatmentsListResponseSchema>;
export type CreateTreatmentBody = z.infer<typeof createTreatmentBodySchema>;
export type TreatmentResponse = z.infer<typeof treatmentResponseSchema>;
export type UpdateTreatmentParams = z.infer<typeof updateTreatmentParamsSchema>;
export type UpdateTreatmentBody = z.infer<typeof updateTreatmentBodySchema>;
export type TreatmentParams = z.infer<typeof treatmentParamsSchema>;
export type DeleteTreatmentResponse = z.infer<typeof deleteTreatmentResponseSchema>;
