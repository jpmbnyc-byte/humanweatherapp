import React from 'react';
import type { ConditionsData } from '../../lib/conditions';
import type { KeeperId } from '../../lib/kokoro';
import { KIKI_VOICES } from '../../lib/kokoro';

interface ConditionsPanelProps {
  conditions: ConditionsData;
  keeper?: KeeperId;
  isLoading?: boolean;
  isSpeaking?: boolean;
  onListen?: () => void;
  prescriptionAction?: React.ReactNode;
}

export default function ConditionsPanel({
  conditions,
  keeper = 'joan',
  isLoading,
  isSpeaking,
  onListen,
  prescriptionAction,
}: ConditionsPanelProps) {
  const keeperName = KIKI_VOICES[keeper].name;

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto px-6">
      <p className="hw-designation mb-2">Current Conditions</p>
      <h2 className="hw-conditions-header text-center mb-6">{conditions.header}</h2>

      <hr className="hw-hairline w-full" />

      <p className="hw-register text-center mt-6 hw-dissolve-enter">{conditions.felt}</p>
      <hr className="hw-hairline w-full" />
      <p className="hw-register text-center hw-dissolve-enter" style={{ animationDelay: '200ms' }}>
        {conditions.fact}
      </p>
      <hr className="hw-hairline w-full" />
      <p className="hw-register text-center hw-dissolve-enter" style={{ animationDelay: '400ms' }}>
        {conditions.faith}
      </p>

      <div className="mt-8 flex flex-col items-center gap-4">
        {onListen && (
          <button
            type="button"
            className="hw-voice-chip"
            onClick={onListen}
            disabled={isLoading || isSpeaking}
          >
            {isLoading
              ? 'Preparing the voice — one-time download'
              : isSpeaking
                ? `${keeperName} speaking`
                : `Listen · ${keeperName}`}
          </button>
        )}
        {prescriptionAction}
      </div>
    </div>
  );
}
