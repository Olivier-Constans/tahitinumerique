import * as z from "zod/mini";

export function pageOf<T extends z.ZodMiniType>(item: T) {
  return z.object({
    content: z.array(item),
    totalPages: z.number(),
    totalElements: z.number(),
    number: z.number(),
    size: z.number()
  });
}

// Dérivé du schéma pour qu'un champ ajouté ou renommé dans pageOf se répercute sur le type
export type Page<T> = Omit<z.infer<ReturnType<typeof pageOf>>, 'content'> & { content: T[] };
