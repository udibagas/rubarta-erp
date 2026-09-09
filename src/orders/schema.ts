import { z } from 'zod';

export const OrderItemSchema = z.object({
  lineNo: z.number().int().positive(),
  manufacturer: z.string().nullable(),
  vendorPartNo: z.string().nullable(),
  description: z.string().min(1),
  tariffCode: z.string().nullable(),
  quantity: z.number().positive(),
  unit: z.string().nullable(),
  unitPrice: z.number().nonnegative(),
  discountPercent: z.number().min(0).max(100),
  netUnitPrice: z.number().nonnegative(),
  netAmount: z.number().nonnegative(),
  weight: z.number().nonnegative().nullable(),
  sourcePages: z.array(z.number().int().positive()).min(1),
});
