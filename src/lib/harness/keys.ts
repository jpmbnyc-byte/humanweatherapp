/** IndexedDB / localStorage keys for the HW harness layer. */
export const HW_KEYS = {
  prefsChannel: 'hw.prefs.channel',
  legacyFieldStation: 'hw.legacy.fieldstation',
  readings: 'hw.readings',
  officeOffsets: 'hw.office.offsets',
  pvtResults: 'hw.pvt.results',
  vocabularyProfile: 'hw.vocabulary.profile',
  slowFieldPrefs: 'hw.prefs.slowfield',
  companionPrefs: 'hw.prefs.companion',
  protocolSessions: 'hw.protocol.sessions',
} as const;

/** Legacy V1 keys migrated into hw.legacy.fieldstation. */
export const LEGACY_FIELD_STATION_KEYS = [
  'somatic-state',
  'hw-somatic-grid',
  'hw-last-weather',
  'forming-memento-dates',
] as const;
