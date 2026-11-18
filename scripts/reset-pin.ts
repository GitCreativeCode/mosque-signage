/**
 * Admin PIN & Authentication Recovery CLI Proxy
 * MosqueSignage (TV)
 */

export {
  resetPinCore,
  resetPasswordCore,
  runInteractiveCli,
  type ResetPinOptions,
  type ResetPinResult,
  type ResetPasswordResult,
} from './reset-auth';

import { runInteractiveCli } from './reset-auth';

const isMain = process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/reset-pin.ts');
if (isMain) {
  runInteractiveCli().catch((err) => {
    console.error('Fatal error resetting auth:', err);
    process.exit(1);
  });
}
