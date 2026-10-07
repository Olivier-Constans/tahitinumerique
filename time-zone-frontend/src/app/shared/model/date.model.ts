import * as z from 'zod/mini';
import { toDate } from '../util/date.util';

export const isoDate = z.pipe(z.string(), z.transform(toDate));
