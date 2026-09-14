import { z } from 'zod';

export const PackedItemSchema = z.object({
  lineNo: z.number().int().positive(),
  packedPartNo: z.string().min(1),
  packedQty: z.number().positive(),
  description: z.string().min(1),
  sourcePages: z.array(z.number().int().positive()).min(1),
});
