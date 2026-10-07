import * as z from 'zod/mini';

export const ErrorMessageResponse = z.object({
  message: z.string(),
});

export type ErrorMessageResponse = z.infer<typeof ErrorMessageResponse>;
