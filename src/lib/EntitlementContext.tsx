import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  type EffectiveEntitlement,
  type EntitlementFeature,
  type EntitlementRecord,
  formatMembershipExpiry,
  grantMembership,
  hasFeature,
  loadEntitlement,
  parsePurchaseReturn,
  parsePurchaseSessionId,
  stripPurchaseReturnParams,
  trialFootline,
} from './entitlement';
import { isStripeCheckoutUrl, openPurchaseCheckout } from './purchaseConfig';
import { verifyStripeCheckout } from './stripe.functions';
import { runWhenIdle } from './deferredWork';

type EntitlementContextValue = {
  record: EntitlementRecord | null;
  effective: EffectiveEntitlement;
  loading: boolean;
  isMember: boolean;
  can: (feature: EntitlementFeature) => boolean;
  footline: string | null;
  purchaseJustCompleted: boolean;
  purchaseVerifyError: string | null;
  dismissPurchaseSuccess: () => void;
  dismissPurchaseVerifyError: () => void;
  startPurchase: () => void;
  refresh: () => Promise<void>;
  membershipExpiresLabel: string | null;
};

const EntitlementContext = createContext<EntitlementContextValue | null>(null);

export function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const [record, setRecord] = useState<EntitlementRecord | null>(null);
  const [effective, setEffective] = useState<EffectiveEntitlement>('trial');
  const [loading, setLoading] = useState(true);
  const [purchaseJustCompleted, setPurchaseJustCompleted] = useState(false);
  const [purchaseVerifyError, setPurchaseVerifyError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { record: next, effective: eff } = await loadEntitlement();
    setRecord(next);
    setEffective(eff);
    setLoading(false);
  }, []);

  useEffect(() => {
    runWhenIdle(() => {
      void refresh();
    }, 2500);
  }, [refresh]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const search = window.location.search;
    if (parsePurchaseReturn(search) !== 'success') return;

    void (async () => {
      const sessionId = parsePurchaseSessionId(search);
      const stripeCheckout = isStripeCheckoutUrl();

      if (stripeCheckout) {
        if (!sessionId) {
          setPurchaseVerifyError(
            'Stripe did not return a checkout session. Confirm your Payment Link redirect includes session_id.',
          );
          return;
        }

        const result = await verifyStripeCheckout({ data: { sessionId } });
        if (!result.verified) {
          setPurchaseVerifyError(
            'Payment could not be verified. If you were charged, contact support with your receipt.',
          );
          return;
        }

        await grantMembership(new Date(), {
          expiresAt: result.expiresAt,
          stripeSessionId: result.sessionId,
        });
      } else {
        await grantMembership();
      }

      const clean = stripPurchaseReturnParams(search);
      window.history.replaceState({}, '', `${window.location.pathname}${clean}`);
      setPurchaseJustCompleted(true);
      setPurchaseVerifyError(null);
      await refresh();
    })();
  }, [refresh]);

  const startPurchase = useCallback(() => {
    openPurchaseCheckout();
  }, []);

  const dismissPurchaseSuccess = useCallback(() => {
    setPurchaseJustCompleted(false);
  }, []);

  const dismissPurchaseVerifyError = useCallback(() => {
    setPurchaseVerifyError(null);
  }, []);

  const value = useMemo<EntitlementContextValue>(
    () => ({
      record,
      effective,
      loading,
      isMember: effective === 'member',
      can: (feature: EntitlementFeature) => hasFeature(effective, feature),
      footline: record ? trialFootline(record) : null,
      membershipExpiresLabel: record ? formatMembershipExpiry(record) : null,
      purchaseJustCompleted,
      purchaseVerifyError,
      dismissPurchaseSuccess,
      dismissPurchaseVerifyError,
      startPurchase,
      refresh,
    }),
    [
      record,
      effective,
      loading,
      purchaseJustCompleted,
      purchaseVerifyError,
      dismissPurchaseSuccess,
      dismissPurchaseVerifyError,
      startPurchase,
      refresh,
    ],
  );

  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}

export function useEntitlement(): EntitlementContextValue {
  const ctx = useContext(EntitlementContext);
  if (!ctx) throw new Error('useEntitlement requires EntitlementProvider');
  return ctx;
}
