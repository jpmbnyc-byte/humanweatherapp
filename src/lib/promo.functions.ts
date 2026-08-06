import { createServerFn } from '@tanstack/react-start';
import { redeemPromoOnServer } from './promo.server';

export const redeemPromo = createServerFn({ method: 'POST' })
  .inputValidator((data: { code: string; deviceKey: string }) => {
    if (!data?.code || typeof data.code !== 'string') {
      throw new Error('code required');
    }
    if (!data?.deviceKey || typeof data.deviceKey !== 'string') {
      throw new Error('deviceKey required');
    }
    return { code: data.code.trim(), deviceKey: data.deviceKey.trim() };
  })
  .handler(async ({ data }) => {
    try {
      return await redeemPromoOnServer(data.code, data.deviceKey);
    } catch (err) {
      console.error('Promo redemption failed:', err);
      return { ok: false as const, reason: 'unknown' as const };
    }
  });
