export const AVATAR_COLORS = [
  {
    bg: "bg-rose-100",
    text: "text-rose-600",
    border: "border border-rose-400",
  },
  {
    bg: "bg-pink-100",
    text: "text-pink-600",
    border: "border border-pink-400",
  },
  {
    bg: "bg-fuchsia-100",
    text: "text-fuchsia-600",
    border: "border border-fuchsia-400",
  },
  {
    bg: "bg-purple-100",
    text: "text-purple-600",
    border: "border border-purple-400",
  },
  {
    bg: "bg-violet-100",
    text: "text-violet-600",
    border: "border border-violet-400",
  },
  {
    bg: "bg-indigo-100",
    text: "text-indigo-600",
    border: "border border-indigo-400",
  },
  {
    bg: "bg-blue-100",
    text: "text-blue-600",
    border: "border border-blue-400",
  },
  {
    bg: "bg-sky-100",
    text: "text-sky-600",
    border: "border border-sky-400",
  },
  {
    bg: "bg-cyan-100",
    text: "text-cyan-600",
    border: "border border-cyan-400",
  },
  {
    bg: "bg-teal-100",
    text: "text-teal-600",
    border: "border border-teal-400",
  },
  {
    bg: "bg-emerald-100",
    text: "text-emerald-600",
    border: "border border-emerald-400",
  },
  {
    bg: "bg-green-100",
    text: "text-green-600",
    border: "border border-green-400",
  },
  {
    bg: "bg-lime-100",
    text: "text-lime-600",
    border: "border border-lime-400",
  },
  {
    bg: "bg-amber-100",
    text: "text-amber-600",
    border: "border border-amber-400",
  },
  {
    bg: "bg-orange-100",
    text: "text-orange-600",
    border: "border border-orange-400",
  },
  {
    bg: "bg-red-100",
    text: "text-red-600",
    border: "border border-red-400",
  },
];

export function getAvatarColor(name = "") {
  const hash = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
