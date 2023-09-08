import { GenericContainerSize } from '~/types';

export const getSizeDescription = (size: GenericContainerSize): string =>
  `Limits: ${size.resources.limits?.cpu || '??'} CPU, ` +
  `${size.resources.limits?.memory || '??'} Memory ` +
  `Requests: ${size.resources.requests?.cpu || '??'} CPU, ` +
  `${size.resources.requests?.memory || '??'} Memory`;
