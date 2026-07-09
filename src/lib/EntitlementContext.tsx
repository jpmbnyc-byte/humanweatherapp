import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  type EffectiveEntitlement,
  type EntitlementFeature,
  type EntitlementRecord,
  hasFeature,
  loadEntitlement,
  trialFootline,
} from './entitlement';

type EntitlementContextValue = {
  record: EntitlementRecord | null;
  effective: EffectiveEntitlement;
  loading: boolean;
  can: (feature: EntitlementFeature) => boolean;
  footline: string | null;
  refresh: () => Promise<void>;
};

const EntitlementContext = createContext<EntitlementContextValue | null>(null);

export function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const [record, setRecord] = useState<EntitlementRecord | null>(null);
  const [effective, setEffective] = useState<EffectiveEntitlement>('trial');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { record: next, effective: eff } = await loadEntitlement();
    setRecord(next);
    setEffective(eff);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<EntitlementContextValue>(
    () => ({
      record,
      effective,
      loading,
      can: (feature: EntitlementFeature) => hasFeature(effective, feature),
      footline: record ? trialFootline(record) : null,
      refresh,
    }),
    [record, effective, loading, refresh],
  );

  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}

export function useEntitlement(): EntitlementContextValue {
  const ctx = useContext(EntitlementContext);
  if (!ctx) throw new Error('useEntitlement requires EntitlementProvider');
  return ctx;
}
