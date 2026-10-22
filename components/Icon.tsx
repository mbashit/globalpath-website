import {
  GraduationCap, Stamp, Wallet, Handshake, Languages, FileCheck, MailOpen, Luggage, Plane, ShieldCheck,
  Compass, Users, Globe, MessageCircle, Clock, Route, Eye, HeartHandshake, BadgeCheck, MapPin, Phone, Mail,
  CalendarDays, FileText, Building2, BookOpen, ClipboardCheck, Lock, Sparkles, Video, Scale, Landmark, Search,
  type LucideProps,
} from "lucide-react";

const icons = {
  graduation: GraduationCap,
  stamp: Stamp,
  wallet: Wallet,
  handshake: Handshake,
  languages: Languages,
  filecheck: FileCheck,
  mail: MailOpen,
  luggage: Luggage,
  plane: Plane,
  shield: ShieldCheck,
  compass: Compass,
  users: Users,
  globe: Globe,
  chat: MessageCircle,
  clock: Clock,
  route: Route,
  eye: Eye,
  heart: HeartHandshake,
  badge: BadgeCheck,
  pin: MapPin,
  phone: Phone,
  email: Mail,
  calendar: CalendarDays,
  file: FileText,
  building: Building2,
  book: BookOpen,
  clipboard: ClipboardCheck,
  lock: Lock,
  sparkles: Sparkles,
  video: Video,
  scale: Scale,
  bank: Landmark,
  search: Search,
} as const;

export type IconName = keyof typeof icons;

export function Icon({ name, ...props }: { name: IconName } & LucideProps) {
  const Cmp = icons[name];
  return <Cmp aria-hidden="true" strokeWidth={1.75} {...props} />;
}
