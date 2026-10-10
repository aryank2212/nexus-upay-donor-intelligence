import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

const Base = ({ size = 16, children, ...p }: P) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    {children}
  </svg>
)

export const IcGrid = (p: P) => (
  <Base {...p}>
    <rect x="2" y="2" width="5" height="5" rx="1.2" />
    <rect x="9" y="2" width="5" height="5" rx="1.2" />
    <rect x="2" y="9" width="5" height="5" rx="1.2" />
    <rect x="9" y="9" width="5" height="5" rx="1.2" />
  </Base>
)

export const IcShieldCheck = (p: P) => (
  <Base {...p}>
    <path d="M8 1.7 13.4 4v4.1c0 3.2-2.2 5.4-5.4 6.2-3.2-.8-5.4-3-5.4-6.2V4L8 1.7Z" />
    <path d="M5.9 8.1 7.4 9.6l2.9-3" />
  </Base>
)

export const IcSpark = (p: P) => (
  <Base {...p}>
    <path d="M8 1.8 9.6 6.4 14.2 8 9.6 9.6 8 14.2 6.4 9.6 1.8 8l4.6-1.6L8 1.8Z" />
  </Base>
)

export const IcUsers = (p: P) => (
  <Base {...p}>
    <circle cx="6.1" cy="5.5" r="2.4" />
    <path d="M1.9 13.4a4.3 4.3 0 0 1 8.4 0" />
    <path d="M10.6 3.4a2.4 2.4 0 0 1 0 4.2M11.8 9.6a4.3 4.3 0 0 1 2.4 3.8" />
  </Base>
)

export const IcUpload = (p: P) => (
  <Base {...p}>
    <path d="M8 10.4V2.2M4.8 5.4 8 2.2l3.2 3.2" />
    <path d="M2.4 10.2v2.2c0 .8.6 1.4 1.4 1.4h8.4c.8 0 1.4-.6 1.4-1.4v-2.2" />
  </Base>
)

export const IcAlertTriangle = (p: P) => (
  <Base {...p}>
    <path d="M8 2.6 14.4 13H1.6L8 2.6Z" />
    <path d="M8 6.6v3M8 11.4h.01" />
  </Base>
)

export const IcCalendar = (p: P) => (
  <Base {...p}>
    <rect x="2" y="3.2" width="12" height="11" rx="1.6" />
    <path d="M2 6.6h12M5.4 1.6v2.6M10.6 1.6v2.6" />
  </Base>
)

export const IcHeartPulse = (p: P) => (
  <Base {...p}>
    <path d="M8 13.7S1.9 10.1 1.9 6a3.3 3.3 0 0 1 6.1-1.8A3.3 3.3 0 0 1 14.1 6c0 4.1-6.1 7.7-6.1 7.7Z" />
  </Base>
)

export const IcLink = (p: P) => (
  <Base {...p}>
    <path d="M6.6 9.4 9.4 6.6" />
    <path d="M7.4 4.6 8.8 3.2a2.4 2.4 0 1 1 3.4 3.4L10.8 8" />
    <path d="M8.6 11.4 7.2 12.8a2.4 2.4 0 1 1-3.4-3.4L5.2 8" />
  </Base>
)

export const IcMail = (p: P) => (
  <Base {...p}>
    <rect x="1.8" y="3.4" width="12.4" height="9.2" rx="1.6" />
    <path d="M2.4 4.4 8 8.8l5.6-4.4" />
  </Base>
)

export const IcCheck = (p: P) => (
  <Base {...p}>
    <path d="M3 8.4l3.2 3.2L13 4.8" />
  </Base>
)

export const IcSearch = (p: P) => (
  <Base {...p}>
    <circle cx="7.1" cy="7.1" r="4.6" />
    <path d="M10.5 10.5 14 14" />
  </Base>
)

export const IcInbox = (p: P) => (
  <Base {...p}>
    <path d="M2 8.6 4 2.6h8l2 6" />
    <path d="M2 8.6h3.6l1 2h2.8l1-2H14v3.4c0 .8-.6 1.4-1.4 1.4H3.4c-.8 0-1.4-.6-1.4-1.4V8.6Z" />
  </Base>
)

export const IcFileWarning = (p: P) => (
  <Base {...p}>
    <path d="M9 1.8H4.4A1.4 1.4 0 0 0 3 3.2v9.6a1.4 1.4 0 0 0 1.4 1.4h7.2a1.4 1.4 0 0 0 1.4-1.4V5.8L9 1.8Z" />
    <path d="M9 1.8v4h4" />
    <path d="M8 7.6v2.4M8 11.6h.01" />
  </Base>
)

export const IcCopy = (p: P) => (
  <Base {...p}>
    <rect x="5.4" y="5.4" width="8.2" height="8.2" rx="1.4" />
    <path d="M10.6 5.4V3.4A1.4 1.4 0 0 0 9.2 2H3.4A1.4 1.4 0 0 0 2 3.4v5.8a1.4 1.4 0 0 0 1.4 1.4h2" />
  </Base>
)

export const IcLandmark = (p: P) => (
  <Base {...p}>
    <path d="M1.8 5.4 8 1.8l6.2 3.6" />
    <path d="M2.4 13.4h11.2M3.4 13.4V6.8M6.4 13.4V6.8M9.6 13.4V6.8M12.6 13.4V6.8" />
  </Base>
)

export const IcChevronRight = (p: P) => (
  <Base {...p}>
    <path d="M6 3.5 10.5 8 6 12.5" />
  </Base>
)

export const IcTrendUp = (p: P) => (
  <Base {...p}>
    <path d="M1.8 11.4 6 7.2l2.6 2.6 5.6-5.6" />
    <path d="M10.4 4.2h3.8V8" />
  </Base>
)

export const IcChevronDown = (p: P) => (
  <Base {...p}>
    <path d="M3.5 6 8 10.5 12.5 6" />
  </Base>
)

export const IcLogout = (p: P) => (
  <Base {...p}>
    <path d="M6.2 14H3.4A1.4 1.4 0 0 1 2 12.6V3.4A1.4 1.4 0 0 1 3.4 2h2.8" />
    <path d="M10.4 11.2 13.6 8l-3.2-3.2M13.6 8H6.2" />
  </Base>
)

export const IcLock = (p: P) => (
  <Base {...p}>
    <rect x="3.2" y="7.2" width="9.6" height="7" rx="1.6" />
    <path d="M5.2 7.2V5a2.8 2.8 0 0 1 5.6 0v2.2" />
  </Base>
)

export const IcEye = (p: P) => (
  <Base {...p}>
    <path d="M1.4 8s2.4-4.6 6.6-4.6S14.6 8 14.6 8s-2.4 4.6-6.6 4.6S1.4 8 1.4 8Z" />
    <circle cx="8" cy="8" r="2.1" />
  </Base>
)

export const IcEyeOff = (p: P) => (
  <Base {...p}>
    <path d="M2 2l12 12" />
    <path d="M6.6 3.9A7.4 7.4 0 0 1 8 3.8c4.2 0 6.6 4.2 6.6 4.2a12 12 0 0 1-2.1 2.7M4.4 5.1A11.6 11.6 0 0 0 1.4 8s2.4 4.2 6.6 4.2a6.6 6.6 0 0 0 2.3-.4" />
    <path d="M9.4 9.4a2.1 2.1 0 0 1-2.9-2.9" />
  </Base>
)

export const IcArrowRight = (p: P) => (
  <Base {...p}>
    <path d="M2.6 8h10.8M9.4 4l4 4-4 4" />
  </Base>
)

export const IcMenu = (p: P) => (
  <Base {...p}>
    <path d="M2.4 4.4h11.2M2.4 8h11.2M2.4 11.6h11.2" />
  </Base>
)

export const IcClose = (p: P) => (
  <Base {...p}>
    <path d="M3.8 3.8l8.4 8.4M12.2 3.8l-8.4 8.4" />
  </Base>
)

export const IcLayers = (p: P) => (
  <Base {...p}>
    <path d="M8 1.8 14.2 5 8 8.2 1.8 5 8 1.8Z" />
    <path d="M1.8 8.2 8 11.4l6.2-3.2" />
    <path d="M1.8 11.4 8 14.6l6.2-3.2" />
  </Base>
)
