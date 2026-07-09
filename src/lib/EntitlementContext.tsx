import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  type EffectiveEntitlement,
  type EntitlementFeature,
  type EntitlementRecord,
  grantMembership,
  hasFeature,
  loadEntitlement,
  parsePurchaseReturn,
  stripPurchaseReturnParams,
  trialFootline,
} from './entitlement';
import { openPurchaseCheckout } from './purchaseConfig';
import { runWhenIdle } from './deferredWork';

type EntitlementContextValue = {
  record: EntitlementRecord | null;
  effective: EffectiveEntitlement;
  loading: boolean;
  isMember: boolean;
  can: (feature: EntitlementFeature) => boolean;
  footline: string | null;
  purchaseJustCompleted: boolean;
  dismissPurchaseSuccess: () => void;
  startPurchase: () => void;
  refresh: () => Promise<void>;
};

const EntitlementContext = createContext<EntitlementContextValue | null>(null);

export function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const [record, setRecord] = useState<EntitlementRecord | null>(null);
  const [effective, setEffective] = useState<EffectiveEntitlement>('trial');
  const [loading, setLoading] = useState(true);
  const [purchaseJustCompleted, setPurchaseJustCompleted] = useState(false);

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
    const outcome = parsePurchaseReturn(window.location.search);
    if (outcome !== 'success') return;

    void (async () => {
      await grantMembership();
      const clean = stripPurchaseReturnParams(window.location.search);
      window.history.replaceState({}, '', `${window.location.pathname}${clean}`);
      setPurchaseJustCompleted(true);
      await refresh();
    })();
  }, [refresh]);

  const startPurchase = useCallback(() => {
    openPurchaseCheckout();
  }, []);

  const dismissPurchaseSuccess = useCallback(() => {
    setPurchaseJustCompleted(false);
  }, []);

  const value = useMemo<EntitlementContextValue>(
    () => ({
      record,
      effective,
      loading,
      isMember: effective === 'member',
      can: (feature: EntitlementFeature) => hasFeature(effective, feature),
      footline: record ? trialFootline(record) : null,
      purchaseJustCompleted,
      dismissPurchaseSuccess,
      startPurchase,
      refresh,
    }),
    [record, effective, loading, purchaseJustCompleted, dismissPurchaseSuccess, startPurchase, refresh],
  );

  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}

export function useEntitlement(): EntitlementContextValue {
  const ctx = useContext(EntitlementContext);
  if (!ctx) throw new Error('useEntitlement requires EntitlementProvider');
  return ctx;
}
