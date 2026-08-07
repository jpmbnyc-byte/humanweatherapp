import { describe, expect, it } from 'vitest';
import { prescriptionTab, routePrescription } from './prescriptionRouter';

describe('routePrescription', () => {
  it('routes headache to shinrin high_stress with research', () => {
    const rx = routePrescription('frontal_tension_headache');
    expect(rx.target).toBe('shinrin');
    expect(rx.focus?.shinrinProtocolId).toBe('high_stress');
    expect(rx.research).toMatch(/Li et al/i);
  });

  it('routes poor sleep to shinrin sleep protocol', () => {
    const rx = routePrescription('sleep_debt_drift');
    expect(rx.focus?.shinrinProtocolId).toBe('sleep_disruption');
    expect(rx.research).toMatch(/89\.3%/);
  });

  it('routes fog to alpha frequency therapy', () => {
    const rx = routePrescription('cognitive_morning_fog');
    expect(rx.target).toBe('therapy');
    expect(rx.focus?.frequencyId).toBe('alpha');
  });

  it('routes rainy day to solar light wash', () => {
    const rx = routePrescription('barometric_rainy_grey');
    expect(rx.focus?.lightModeId).toBe('bright_yellow');
    expect(rx.research).toMatch(/bright light/i);
  });
});

describe('prescriptionTab', () => {
  it('maps shinrin to rhythms tab', () => {
    expect(prescriptionTab('shinrin')).toBe('rhythms');
  });
});
