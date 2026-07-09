"use client";

type IconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

const Base = ({ size = 20, className = "", strokeWidth = 2, children }: IconProps & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

export const SearchIcon = (p: IconProps) => (
  <Base {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Base>
);

export const UsersIcon = (p: IconProps) => (
  <Base {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Base>
);

export const SettingsIcon = (p: IconProps) => (
  <Base {...p}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></Base>
);

export const ArrowLeftIcon = (p: IconProps) => (
  <Base {...p}><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></Base>
);

export const SmileIcon = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" x2="9.01" y1="9" y2="9" /><line x1="15" x2="15.01" y1="9" y2="9" /></Base>
);

export const PaperclipIcon = (p: IconProps) => (
  <Base {...p}><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></Base>
);

export const MicIcon = (p: IconProps) => (
  <Base {...p}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></Base>
);

export const StopIcon = (p: IconProps) => (
  <Base {...p}><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" /></Base>
);

export const SendIcon = (p: IconProps) => (
  <Base {...p}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></Base>
);

export const XIcon = (p: IconProps) => (
  <Base {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Base>
);

export const TrashIcon = (p: IconProps) => (
  <Base {...p}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></Base>
);

export const BanIcon = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" /></Base>
);

export const MessageIcon = (p: IconProps) => (
  <Base {...p}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></Base>
);

export const CheckIcon = (p: IconProps) => (
  <Base {...p}><path d="M20 6 9 17l-5-5" /></Base>
);

export const LoaderIcon = (p: IconProps) => (
  <Base {...p} className={`animate-spin ${p.className || ""}`}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></Base>
);

export const StarIcon = (p: IconProps & { filled?: boolean }) => (
  <Base {...p}>
    <path
      d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8-5.4 2.8 1-6L3.2 9.4l6.1-.9L12 3z"
      fill={p.filled ? "currentColor" : "none"}
    />
  </Base>
);

export const BlockIcon = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="12" r="9" /><path d="m5.7 5.7 12.6 12.6" /></Base>
);

export const UserMinusIcon = (p: IconProps) => (
  <Base {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="22" x2="16" y1="11" y2="11" /></Base>
);

export const UnlockIcon = (p: IconProps) => (
  <Base {...p}><rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></Base>
);

export const VerifiedIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#0088cc">
    <path d="M12 2l2.4 2.4 3.4-.5 1 3.3 3 1.7-1.3 3.1 1.3 3.1-3 1.7-1 3.3-3.4-.5L12 22l-2.4-2.4-3.4.5-1-3.3-3-1.7 1.3-3.1L2.2 8.9l3-1.7 1-3.3 3.4.5L12 2z" />
    <path d="M10.5 14.5l-2-2-1 1 3 3 6-6-1-1-5 5z" fill="white" />
  </svg>
);
