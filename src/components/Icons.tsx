// Icons.tsx —— 手绘线性 SVG（lucide 风格简化版）：不引入图标库（红线）
interface IconProps { size?: number; className?: string }

function svgProps(size: number, className: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    className,
  } as const;
}

export function PlayIcon({ size = 14, className = "" }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PauseIcon({ size = 14, className = "" }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M9 5v14" />
      <path d="M15 5v14" />
    </svg>
  );
}

export function ActivityIcon({ size = 14, className = "" }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

export function AlertCircleIcon({ size = 14, className = "" }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

export function CpuIcon({ size = 14, className = "" }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3" /><path d="M15 1v3" /><path d="M9 20v3" /><path d="M15 20v3" />
      <path d="M20 9h3" /><path d="M20 14h3" /><path d="M1 9h3" /><path d="M1 14h3" />
    </svg>
  );
}

export function ClockIcon({ size = 14, className = "" }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export function BotIcon({ size = 14, className = "" }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M12 8V4H8" />
      <rect x="4" y="8" width="16" height="12" rx="2" />
      <path d="M2 14h2" /><path d="M20 14h2" />
      <path d="M15 13v2" /><path d="M9 13v2" />
    </svg>
  );
}

export function ExternalLinkIcon({ size = 14, className = "" }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 14, className = "" }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function LockIcon({ size = 14, className = "" }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function PlusIcon({ size = 14, className = "" }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

export function HistoryIcon({ size = 14, className = "" }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

export function VolumeIcon({ size = 14, className = "" }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M11 5 6 9H2v6h4l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 5a10 10 0 0 1 0 14" />
    </svg>
  );
}

export function MoonIcon({ size = 14, className = "" }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
    </svg>
  );
}

export function TrashIcon({ size = 14, className = "" }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 14, className = "" }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

export function RefreshCwIcon({ size = 14, className = "" }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

export function SendIcon({ size = 14, className = "" }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="m22 2-7 20-4-9-9-4z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

export function PaperclipIcon({ size = 14, className = "" }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

export function FileTextIcon({ size = 14, className = "" }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}

export function FolderIcon({ size = 14, className = "" }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

export function Maximize2Icon({ size = 14, className = "" }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}

export function CloseIcon({ size = 14, className = "" }: IconProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
