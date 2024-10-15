import { SetMetadata } from '@nestjs/common';

import { SKIP_AUTH_METADATA_KEY } from '../constants';

export function SkipAuth(): ClassDecorator & MethodDecorator {
  return SetMetadata(SKIP_AUTH_METADATA_KEY, true);
}
