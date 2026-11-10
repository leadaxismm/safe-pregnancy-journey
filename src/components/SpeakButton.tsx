import { useEffect, useState } from 'react';
import { Volume2, Square } from 'lucide-react';
import { speak, stopSpeaking, ttsSupported } from '../lib/tts';

/** Reads the given Arabic text aloud. Hidden when the browser has no speech synthesis. */
export function SpeakButton({ text, label = 'استمعي', className = '' }: { text: string; label?: string; className?: string }) {
  const [playing, setPlaying] = useState(false);
  const [supported, setSupported] = useState(false);
  useEffect(() => { setSupported(ttsSupported()); return () => stopSpeaking(); }, []);
  if (!supported) return null;
  return (
    <button
      type="button"
      onClick={() => {
        if (playing) { stopSpeaking(); setPlaying(false); }
        else { setPlaying(speak(text, () => setPlaying(false))); }
      }}
      className={`chip min-h-[40px] border border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-200 ${className}`}
      aria-pressed={playing}
    >
      {playing ? <Square className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}
      {playing ? 'إيقاف' : label}
    </button>
  );
}
