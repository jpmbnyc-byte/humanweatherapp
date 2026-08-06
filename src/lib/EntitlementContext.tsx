import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  type EffectiveEntitlement,
  type EntitlementFeature,
  type EntitlementRecord,
  applyStripeCheckout,
  formatMembershipExpiry,
  hasFeature,
  isLifetimeMember,
  isStripeSessionRedeemed,
  loadEntitlement,
  parsePurchaseReturn,
  parsePurchaseSessionId,
  redeemPromoCode,
  stripPurchaseReturnParams,
  trialFootline,
} from './entitlement';
import { isShareablePromoCode } from './promoCodes';
import { parsePromoFromSearch, shareAnnualPromoLink, stripPromoFromSearch, type PromoShareResult } from './promoShare';
import { isPurchaseConfigured, isStripeCheckoutUrl, openPurchaseCheckout } from './purchaseConfig';
import { verifyStripeCheckout } from './stripe.functions';

type EntitlementContextValue = {
  record: EntitlementRecord | null;
  effective: EffectiveEntitlement;
  loading: boolean;
  isMember: boolean;
  can: (feature: EntitlementFeature) => boolean;
  footline: string | null;
  purchaseJustCompleted: boolean;
  purchaseVerifyError: string | null;
  promoMessage: string | null;
  dismissPurchaseSuccess: () => void;
  dismissPurchaseVerifyError: () => void;
  dismissPromoMessage: () => void;
  startPurchase: () => void;
  redeemPromo: (code: string) => Promise<{ ok: boolean; message: string }>;
  refresh: () => Promise<void>;
  membershipExpiresLabel: string | null;
  isLifetimeMember: boolean;
  pendingPromoCode: string | null;
  shareAnnualPromo: () => Promise<PromoShareResult>;
};

const EntitlementContext = createContext<EntitlementContextValue | null>(null);

export function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const [record, setRecord] = useState<EntitlementRecord | null>(null);
  const [effective, setEffective] = useState<EffectiveEntitlement>('trial');
  const [loading, setLoading] = useState(true);
  const [purchaseJustCompleted, setPurchaseJustCompleted] = useState(false);
  const [purchaseVerifyError, setPurchaseVerifyError] = useState<string | null>(null);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [pendingPromoCode, setPendingPromoCode] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { record: next, effective: eff } = await loadEntitlement();
    setRecord(next);
    setEffective(eff);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const search = window.location.search;
    if (parsePurchaseReturn(search) !== 'success') return;

    const stripReturnParams = () => {
      const clean = stripPurchaseReturnParams(search);
      window.history.replaceState({}, '', `${window.location.pathname}${clean}`);
    };

    void (async () => {
      try {
        if (!isPurchaseConfigured() || !isStripeCheckoutUrl()) {
          setPurchaseVerifyError(
            'Checkout is not configured. Set VITE_PURCHASE_URL to your Stripe Payment Link.',
          );
          return;
        }

        const sessionId = parsePurchaseSessionId(search);
        if (!sessionId) {
          setPurchaseVerifyError(
            'Stripe did not return a checkout session. Confirm your Payment Link redirect includes session_id.',
          );
          return;
        }

        const { record: current } = await loadEntitlement();
        if (isLifetimeMember(current)) {
          setPurchaseJustCompleted(true);
          setPurchaseVerifyError(null);
          return;
        }

        if (await isStripeSessionRedeemed(sessionId)) {
          await refresh();
          setPurchaseJustCompleted(true);
          setPurchaseVerifyError(null);
          return;
        }

        const result = await verifyStripeCheckout({ data: { sessionId } });
        if (!result.verified) {
          setPurchaseVerifyError(
            'Payment could not be verified. If you were charged, contact support with your receipt.',
          );
          return;
        }

        await applyStripeCheckout(result.sessionId, result.expiresAt);
        setPurchaseJustCompleted(true);
        setPurchaseVerifyError(null);
        await refresh();
      } finally {
        stripReturnParams();
      }
    })();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === 'undefined' || loading) return;
    const search = window.location.search;
    const code = parsePromoFromSearch(search);
    if (!code) return;

    const clean = stripPromoFromSearch(search);
    window.history.replaceState({}, '', `${window.location.pathname}${clean}`);

    if (!isShareablePromoCode(code)) return;
    if (effective === 'member') return;

    void (async () => {
      const result = await redeemPromoCode(code);
      if (result.ok) {
        await refresh();
        setPromoMessage('Complimentary 1 year of access activated on this device.');
        setPendingPromoCode(null);
        return;
      }
      if (result.reason === 'already_redeemed') {
        await refresh();
        return;
      }
      setPendingPromoCode(code);
    })();
  }, [loading, effective, refresh]);

  const dismissPromoMessage = useCallback(() => {
    setPromoMessage(null);
  }, []);

  const redeemPromo = useCallback(
    async (code: string) => {
      const result = await redeemPromoCode(code);
      if (result.ok) {
        await refresh();
        const msg =
          result.definition.grant === 'lifetime'
            ? 'Lifetime access activated on this device.'
            : 'Complimentary 1 year of access activated on this device.';
        setPromoMessage(msg);
        return { ok: true, message: msg };
      }
      const message =
        result.reason === 'invalid'
          ? 'Enter a valid code (7–17 letters or numbers).'
          : result.reason === 'already_redeemed'
            ? 'This code was already used on this device.'
            : 'That code is not recognized.';
      return { ok: false, message };
    },
    [refresh],
  );

  const startPurchase = useCallback(() => {
    openPurchaseCheckout();
  }, []);

  const shareAnnualPromo = useCallback(async () => shareAnnualPromoLink(), []);

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
      isLifetimeMember: isLifetimeMember(record),
      pendingPromoCode,
      shareAnnualPromo,
      purchaseJustCompleted,
      purchaseVerifyError,
      promoMessage,
      dismissPurchaseSuccess,
      dismissPurchaseVerifyError,
      dismissPromoMessage,
      startPurchase,
      redeemPromo,
      refresh,
    }),
    [
      record,
      effective,
      loading,
      purchaseJustCompleted,
      purchaseVerifyError,
      promoMessage,
      dismissPurchaseSuccess,
      dismissPurchaseVerifyError,
      dismissPromoMessage,
      startPurchase,
      redeemPromo,
      refresh,
      pendingPromoCode,
      shareAnnualPromo,
    ],
  );

  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}

export function useEntitlement(): EntitlementContextValue {
  const ctx = useContext(EntitlementContext);
  if (!ctx) throw new Error('useEntitlement requires EntitlementProvider');
  return ctx;
}
