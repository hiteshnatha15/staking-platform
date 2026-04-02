/**
 * Professional filled SVG icons - clean, modern, finance/crypto style
 */

interface IconProps {
  className?: string;
  size?: number;
}

const sizeAttr = (s: number) => ({ width: s, height: s });

export const IconWallet = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v12h16V6H4zm4 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm8 0h4v4h-4v-4z" />
  </svg>
);

export const IconCoins = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
  </svg>
);

export const IconChart = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
  </svg>
);

export const IconClock = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z" />
  </svg>
);

export const IconLink = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
  </svg>
);

export const IconCopy = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
  </svg>
);

export const IconCheck = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
  </svg>
);

export const IconShare = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z" />
  </svg>
);

export const IconUsers = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
);

export const IconUserPlus = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

export const IconDollar = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
  </svg>
);

export const IconLayers = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z" />
  </svg>
);

export const IconChevronDown = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
  </svg>
);

export const IconChevronUp = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
  </svg>
);

export const IconArrowDown = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
);

export const IconArrowRight = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
  </svg>
);

export const IconCheckCircle = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

export const IconXCircle = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
  </svg>
);

export const IconAlert = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
  </svg>
);

export const IconGift = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z" />
  </svg>
);

export const IconHistory = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
  </svg>
);

export const IconExternalLink = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
  </svg>
);

export const IconArrowUpRight = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M19 19H5V5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zm-4.5-14l2.3 2.3-2.89 2.87 1.42 1.42L18.3 9.2l2.3 2.3V5h-6z" />
  </svg>
);

export const IconArrowDownRight = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M5 5h7v2H7.83L18.09 15.26l-1.41 1.41L5.71 8.41V13H3V5z" />
  </svg>
);

export const IconCrown = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M12 2L9 8l-7 2 5 6-2 6h14l-2-6 5-6-7-2-3-6z" />
  </svg>
);

export const IconTrophy = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
  </svg>
);

export const IconDashboard = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
  </svg>
);

export const IconChevronRight = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
  </svg>
);

export const IconArrowDownCircle = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17V8h2v6.17l3.59-3.58L17 12l-5 5z" />
  </svg>
);

export const IconChartTrendingUp = ({ className = '', size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...sizeAttr(size)}>
    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" />
  </svg>
);

// Aliases for backward compatibility
export const Wallet = IconWallet;
export const Coins = IconCoins;
export const ChartTrendingUp = IconChartTrendingUp;
export const TrendingUp = IconChartTrendingUp;
export const Clock = IconClock;
export const ArrowRight = IconArrowRight;
export const Link2 = IconLink;
export const Copy = IconCopy;
export const Check = IconCheck;
export const Share2 = IconShare;
export const Users = IconUsers;
export const UserPlus = IconUserPlus;
export const DollarSign = IconDollar;
export const Layers = IconLayers;
export const ChevronDown = IconChevronDown;
export const ChevronUp = IconChevronUp;
export const ChevronRight = IconChevronRight;
export const ArrowDownCircle = IconArrowDownCircle;
export const CheckCircle = IconCheckCircle;
export const XCircle = IconXCircle;
export const ExclamationCircle = IconAlert;
export const AlertCircle = IconAlert;
export const Gift = IconGift;
export const History = IconHistory;
export const ExternalLink = IconExternalLink;
export const ArrowUpRight = IconArrowUpRight;
export const ArrowDownRight = IconArrowDownRight;
export const Crown = IconCrown;
export const Award = IconTrophy;
export const Trophy = IconTrophy;
export const LayoutDashboard = IconDashboard;
