import { Icon, type IconName } from "./Icon";

const items: { label: string; icon: IconName }[] = [
  { label: "Study abroad support", icon: "graduation" },
  { label: "Visa documentation", icon: "stamp" },
  { label: "Financial guidance", icon: "wallet" },
  { label: "Translation & notarization", icon: "languages" },
  { label: "Relocation assistance", icon: "luggage" },
];

export function TrustStrip() {
  return (
    <div className="border-b border-line bg-white">
      <ul className="container grid grid-cols-2 gap-x-4 gap-y-4 py-7 sm:grid-cols-3 lg:flex lg:justify-between">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-2.5 text-[0.95rem] font-medium text-ink">
            <Icon name={it.icon} className="h-5 w-5 shrink-0 text-brandorange" />
            {it.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
