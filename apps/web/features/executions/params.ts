import { parseAsInteger, parseAsString } from 'nuqs/server';
import { PAGINATION } from '@/config/constants';

export const executionParams = {
  page: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
  pageSize: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE_SIZE)
    .withOptions({ clearOnDefault: true }),
  search: parseAsString
    .withDefault('')
    .withOptions({ clearOnDefault: true }),
  workflowId: parseAsString
    .withDefault('')
    .withOptions({ clearOnDefault: true }),
  status: parseAsString
    .withDefault('')
    .withOptions({ clearOnDefault: true }),
};
