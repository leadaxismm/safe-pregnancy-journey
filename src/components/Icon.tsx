import {
  Activity, Baby, BedDouble, BookHeart, Building2, CalendarCheck, CalendarClock, Droplet, Droplets, Eye,
  Footprints, HeartPulse, Hospital, MapPin, Pill, Salad, ScanLine, ShieldAlert, Siren, Smile, Sparkles,
  Stethoscope, Syringe, TriangleAlert, Waves, Zap, ClipboardList, Route, Leaf, GraduationCap, type LucideIcon
} from 'lucide-react';

const map: Record<string, LucideIcon> = {
  Activity, Baby, BedDouble, BookHeart, Building2, CalendarCheck, CalendarClock, Droplet, Droplets, Eye,
  Footprints, HeartPulse, Hospital, MapPin, Pill, Salad, ScanLine, ShieldAlert, Siren, Smile, Sparkles,
  Stethoscope, Syringe, TriangleAlert, Waves, Zap, ClipboardList, Route, Leaf, GraduationCap
};

export function Icon({ name, className = 'h-6 w-6' }: { name: string; className?: string }) {
  const C = map[name] ?? Sparkles;
  return <C className={className} aria-hidden="true" strokeWidth={2} />;
}
