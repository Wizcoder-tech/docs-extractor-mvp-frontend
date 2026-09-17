import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "check"
  | "x"
  | "alert-triangle"
  | "circle"
  | "upload-cloud"
  | "pencil"
  | "bolt"
  | "file-text"
  | "file-check"
  | "trash"
  | "plus"
  | "chevron-right";

const PATHS: Record<IconName, ReactNode> = {
  check: <path d="M20 6 9 17l-5-5" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  circle: <circle cx={12} cy={12} r={9} />,
  "alert-triangle": (
    <>
      <path d="M10.29 3.86 1.82 18a1.5 1.5 0 0 0 1.28 2.25h17.8a1.5 1.5 0 0 0 1.28-2.25L13.71 3.86a1.5 1.5 0 0 0-2.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 16.5h.01" />
    </>
  ),
  "upload-cloud": (
    <>
      <path d="M7.5 17a4.5 4.5 0 0 1-.5-8.97 6 6 0 0 1 11.5-1.51A4 4 0 0 1 18 17" />
      <path d="M12 12v7M9 15l3-3 3 3" />
    </>
  ),
  pencil: (
    <>
      <path d="M12.5 5.5 18.5 11.5 8 22H2v-6Z" />
      <path d="M15 3l6 6" />
    </>
  ),
  bolt: <path d="M13 2 3 14h7l-1 8 11-14h-7z" fill="currentColor" stroke="none" />,
  "file-text": (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h5" />
    </>
  ),
  "file-check": (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M9 15l2 2 4-4" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  "chevron-right": <path d="M9 6l6 6-6 6" />,
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number | string;
}

export default function Icon({ name, size = "1em", className = "", ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`icon ${className}`.trim()}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
