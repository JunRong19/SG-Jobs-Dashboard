// Deterministic per-company color so the same company always renders the
// same tile, and adjacent rows in the list are easy to tell apart at a
// glance. Muted (50-tint bg, 700 text) rather than the brighter 100-tint,
// and teal is excluded since that's the app's main accent color.
const TILE_STYLES = [
  "bg-rose-50 text-rose-700",
  "bg-amber-50 text-amber-700",
  "bg-sky-50 text-sky-700",
  "bg-violet-50 text-violet-700",
  "bg-blue-50 text-blue-700",
  "bg-pink-50 text-pink-700",
  "bg-stone-100 text-stone-700",
  "bg-slate-100 text-slate-700",
];

function styleForCompany(company: string) {
  let hash = 0;
  for (let i = 0; i < company.length; i++) {
    hash = (hash << 5) - hash + company.charCodeAt(i);
    hash |= 0;
  }
  return TILE_STYLES[Math.abs(hash) % TILE_STYLES.length];
}

function initialsForCompany(company: string) {
  const words = company.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

interface CompanyAvatarProps {
  company: string;
  size?: "sm" | "lg";
}

export default function CompanyAvatar({
  company,
  size = "sm",
}: CompanyAvatarProps) {
  const dimension = size === "sm" ? "h-10 w-10 text-sm" : "h-14 w-14 text-lg";

  return (
    <div
      className={`flex-shrink-0 ${dimension} rounded-xl flex items-center justify-center font-semibold tracking-wide ${styleForCompany(
        company
      )}`}
      aria-hidden="true"
    >
      {initialsForCompany(company)}
    </div>
  );
}
