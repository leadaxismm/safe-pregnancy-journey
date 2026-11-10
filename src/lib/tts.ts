/** Arabic text-to-speech using the browser's built-in Web Speech API (no data leaves the device). */
let voices: SpeechSynthesisVoice[] = [];

function loadVoices() {
  if (!('speechSynthesis' in window)) return;
  voices = window.speechSynthesis.getVoices();
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}

export function ttsSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function arabicVoice(): SpeechSynthesisVoice | undefined {
  if (!voices.length) loadVoices();
  return (
    voices.find(v => v.lang === 'ar-SA') ||
    voices.find(v => v.lang?.toLowerCase().startsWith('ar'))
  );
}

export function speak(text: string, onEnd?: () => void): boolean {
  if (!ttsSupported()) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = arabicVoice();
  if (v) u.voice = v;
  u.lang = v?.lang || 'ar-SA';
  u.rate = 0.9; // slightly slower for clarity
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  synth.speak(u);
  return true;
}

export function stopSpeaking() {
  if (ttsSupported()) window.speechSynthesis.cancel();
}
