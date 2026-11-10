import { z } from "zod";

export const exampleValidationBodySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  price: z.number().positive("Price must be a positive number."),
  quantity: z
    .number()
    .int("Quantity must be a whole number.")
    .positive("Quantity must be a positive integer."),
});

export const exampleValidationQuerySchema = z.object({
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter uppercase code.")
    .optional(),
});

export const exampleItemParamsSchema = z.object({
  itemCode: z
    .string()
    .regex(
      /^[a-z0-9-]{2,40}$/i,
      "Item code must be 2-40 letters, numbers, or hyphens.",
    ),
});

export type ExampleValidationBody = z.infer<typeof exampleValidationBodySchema>;
export type ExampleValidationQuery = z.infer<
  typeof exampleValidationQuerySchema
>;
export type ExampleItemParams = z.infer<typeof exampleItemParamsSchema>;
