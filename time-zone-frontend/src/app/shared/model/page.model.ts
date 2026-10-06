import * as z from "zod/mini";

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export function pageOf<T extends z.ZodMiniType>(item: T) {
  return z.object({
    content: z.array(item),
    totalPages: z.number(),
    totalElements: z.number(),
    number: z.number(),
    size: z.number()
  });
}
