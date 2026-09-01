import React from "react";

/**
 * 8 Safe Streets Illustrated Vector Avatars
 * Clean, consistent visual style, diverse appearances, tailored to the Safe Streets palette.
 */
export const AVATAR_OPTIONS = [
  {
    id: "avatar_01",
    name: "Safe Streets Guardian",
    bgColor: "bg-emerald-600",
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Background Circle */}
        <circle cx="50" cy="50" r="50" fill="#059669" />
        {/* Decorative background glow */}
        <circle cx="50" cy="35" r="30" fill="#10B981" opacity="0.3" />
        {/* Body / Shoulders */}
        <path d="M 20 88 C 20 68, 35 62, 50 62 C 65 62, 80 68, 80 88 Z" fill="#0F172A" />
        <path d="M 38 62 L 50 78 L 62 62 Z" fill="#1E293B" />
        {/* Shield emblem on chest */}
        <path d="M 50 66 L 56 70 V 76 L 50 80 L 44 76 V 70 Z" fill="#10B981" />
        {/* Neck */}
        <rect x="44" y="48" width="12" height="16" fill="#F87171" rx="4" />
        {/* Head */}
        <circle cx="50" cy="38" r="18" fill="#F87171" />
        {/* Hair - Stylish short hair */}
        <path d="M 32 36 C 32 24, 42 18, 50 18 C 60 18, 68 24, 68 36 C 68 36, 62 26, 50 26 C 38 26, 32 36, 32 36 Z" fill="#1E293B" />
        {/* Eyes */}
        <circle cx="43" cy="38" r="2.5" fill="#0F172A" />
        <circle cx="57" cy="38" r="2.5" fill="#0F172A" />
        {/* Eyebrows */}
        <path d="M 40 33 Q 44 32 46 34" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M 60 33 Q 56 32 54 34" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        {/* Confident Smile */}
        <path d="M 44 45 Q 50 50 56 45" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: "avatar_02",
    name: "Teal Analyst",
    bgColor: "bg-teal-600",
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="50" fill="#0D9488" />
        <circle cx="50" cy="35" r="30" fill="#14B8A6" opacity="0.3" />
        <path d="M 22 90 C 22 70, 36 64, 50 64 C 64 64, 78 70, 78 90 Z" fill="#134E4A" />
        <rect x="44" y="50" width="12" height="16" fill="#FBBF24" rx="4" />
        <circle cx="50" cy="38" r="18" fill="#FBBF24" />
        {/* Curly Hair Top */}
        <path d="M 30 38 C 28 22, 42 16, 50 16 C 60 16, 72 22, 70 38 C 65 30, 60 26, 50 26 C 40 26, 35 30, 30 38 Z" fill="#451A03" />
        {/* Glasses */}
        <rect x="36" y="34" width="11" height="9" rx="2" stroke="#1E293B" strokeWidth="2" fill="none" />
        <rect x="53" y="34" width="11" height="9" rx="2" stroke="#1E293B" strokeWidth="2" fill="none" />
        <line x1="47" y1="38" x2="53" y2="38" stroke="#1E293B" strokeWidth="2" />
        {/* Eyes inside glasses */}
        <circle cx="41.5" cy="38.5" r="1.8" fill="#1E293B" />
        <circle cx="58.5" cy="38.5" r="1.8" fill="#1E293B" />
        {/* Smile */}
        <path d="M 44 46 Q 50 50 56 46" stroke="#451A03" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: "avatar_03",
    name: "Indigo Navigator",
    bgColor: "bg-indigo-600",
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="50" fill="#4F46E5" />
        <circle cx="50" cy="35" r="30" fill="#6366F1" opacity="0.3" />
        <path d="M 20 88 C 20 68, 35 62, 50 62 C 65 62, 80 68, 80 88 Z" fill="#312E81" />
        <rect x="44" y="48" width="12" height="16" fill="#FB923C" rx="4" />
        <circle cx="50" cy="38" r="18" fill="#FB923C" />
        {/* Side-part hairstyle */}
        <path d="M 31 38 C 30 20, 52 14, 68 24 C 68 28, 62 26, 50 26 C 38 26, 32 36, 31 38 Z" fill="#172554" />
        {/* Headphones */}
        <path d="M 28 36 A 22 22 0 0 1 72 36" fill="none" stroke="#E2E8F0" strokeWidth="4" />
        <rect x="26" y="32" width="6" height="12" rx="3" fill="#E2E8F0" />
        <rect x="68" y="32" width="6" height="12" rx="3" fill="#E2E8F0" />
        {/* Eyes & Smile */}
        <circle cx="43" cy="38" r="2.2" fill="#0F172A" />
        <circle cx="57" cy="38" r="2.2" fill="#0F172A" />
        <path d="M 44 45 Q 50 49 56 45" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: "avatar_04",
    name: "Amber Officer",
    bgColor: "bg-amber-600",
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="50" fill="#D97706" />
        <circle cx="50" cy="35" r="30" fill="#F59E0B" opacity="0.3" />
        <path d="M 20 88 C 20 68, 35 62, 50 62 C 65 62, 80 68, 80 88 Z" fill="#78350F" />
        <rect x="44" y="48" width="12" height="16" fill="#FCA5A5" rx="4" />
        <circle cx="50" cy="38" r="18" fill="#FCA5A5" />
        {/* Beanie Cap */}
        <path d="M 30 35 C 30 20, 40 14, 50 14 C 60 14, 70 20, 70 35 Z" fill="#1E293B" />
        <rect x="28" y="32" width="44" height="6" rx="3" fill="#334155" />
        {/* Eyes */}
        <circle cx="43" cy="40" r="2.2" fill="#0F172A" />
        <circle cx="57" cy="40" r="2.2" fill="#0F172A" />
        {/* Smile */}
        <path d="M 44 46 Q 50 51 56 46" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: "avatar_05",
    name: "Rose Specialist",
    bgColor: "bg-rose-600",
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="50" fill="#E11D48" />
        <circle cx="50" cy="35" r="30" fill="#F43F5E" opacity="0.3" />
        <path d="M 20 88 C 20 68, 35 62, 50 62 C 65 62, 80 68, 80 88 Z" fill="#881337" />
        <rect x="44" y="48" width="12" height="16" fill="#FED7AA" rx="4" />
        <circle cx="50" cy="38" r="18" fill="#FED7AA" />
        {/* Long hair */}
        <path d="M 28 32 C 28 18, 40 14, 50 14 C 60 14, 72 18, 72 32 C 74 46, 70 60, 68 64 C 64 50, 64 36, 50 36 C 36 36, 36 50, 32 64 C 30 60, 26 46, 28 32 Z" fill="#27272A" />
        <circle cx="43" cy="38" r="2.2" fill="#0F172A" />
        <circle cx="57" cy="38" r="2.2" fill="#0F172A" />
        <path d="M 44 46 Q 50 50 56 46" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: "avatar_06",
    name: "Blue Responder",
    bgColor: "bg-blue-600",
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="50" fill="#2563EB" />
        <circle cx="50" cy="35" r="30" fill="#3B82F6" opacity="0.3" />
        <path d="M 20 88 C 20 68, 35 62, 50 62 C 65 62, 80 68, 80 88 Z" fill="#1E3A8A" />
        <rect x="44" y="48" width="12" height="16" fill="#FDE68A" rx="4" />
        <circle cx="50" cy="38" r="18" fill="#FDE68A" />
        {/* Cap with visor */}
        <path d="M 30 34 C 30 20, 42 16, 50 16 C 58 16, 70 20, 70 34 Z" fill="#1E293B" />
        <path d="M 45 28 L 74 34 L 68 38 L 45 32 Z" fill="#0F172A" />
        <circle cx="43" cy="39" r="2.2" fill="#0F172A" />
        <circle cx="57" cy="39" r="2.2" fill="#0F172A" />
        <path d="M 44 46 Q 50 50 56 46" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: "avatar_07",
    name: "Violet Sentinel",
    bgColor: "bg-purple-600",
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="50" fill="#9333EA" />
        <circle cx="50" cy="35" r="30" fill="#A855F7" opacity="0.3" />
        <path d="M 20 88 C 20 68, 35 62, 50 62 C 65 62, 80 68, 80 88 Z" fill="#581C87" />
        <rect x="44" y="48" width="12" height="16" fill="#FECACA" rx="4" />
        <circle cx="50" cy="38" r="18" fill="#FECACA" />
        {/* Afro hairstyle */}
        <circle cx="34" cy="32" r="12" fill="#18181B" />
        <circle cx="66" cy="32" r="12" fill="#18181B" />
        <circle cx="50" cy="24" r="14" fill="#18181B" />
        <circle cx="43" cy="39" r="2.2" fill="#0F172A" />
        <circle cx="57" cy="39" r="2.2" fill="#0F172A" />
        <path d="M 44 46 Q 50 51 56 46" stroke="#991B1B" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  },
  {
    id: "avatar_08",
    name: "Slate Defender",
    bgColor: "bg-slate-700",
    render: () => (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="50" fill="#334155" />
        <circle cx="50" cy="35" r="30" fill="#475569" opacity="0.3" />
        <path d="M 20 88 C 20 68, 35 62, 50 62 C 65 62, 80 68, 80 88 Z" fill="#0F172A" />
        <rect x="44" y="48" width="12" height="16" fill="#E2E8F0" rx="4" />
        <circle cx="50" cy="38" r="18" fill="#E2E8F0" />
        {/* Sleek hairstyle */}
        <path d="M 32 34 C 32 20, 42 16, 50 16 C 60 16, 68 22, 68 34 C 62 26, 54 24, 50 24 C 42 24, 34 28, 32 34 Z" fill="#0F172A" />
        <circle cx="43" cy="39" r="2.2" fill="#0F172A" />
        <circle cx="57" cy="39" r="2.2" fill="#0F172A" />
        <path d="M 44 46 Q 50 50 56 46" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  }
];

export const getAvatarById = (id) => {
  const match = AVATAR_OPTIONS.find((a) => a.id === id);
  return match || AVATAR_OPTIONS[0]; // Default Safe Streets Avatar (avatar_01)
};

export default function UserAvatar({ avatarId, className = "w-full h-full" }) {
  const avatar = getAvatarById(avatarId);
  return (
    <div className={`relative overflow-hidden rounded-full ${className}`}>
      {avatar.render()}
    </div>
  );
}
