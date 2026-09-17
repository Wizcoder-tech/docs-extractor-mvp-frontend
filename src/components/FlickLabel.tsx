import type { ReactNode } from "react";

/**
 * Wraps button content in two stacked copies so CSS can flick the visible
 * copy up and out on hover while the duplicate flicks up into view from
 * below. See `.flick-label` rules in index.css.
 */
export default function FlickLabel({ children }: { children: ReactNode }) {
  return (
    <span className="flick-label">
      <span className="flick-label__face">{children}</span>
      <span className="flick-label__face flick-label__face--up" aria-hidden="true">
        {children}
      </span>
    </span>
  );
}
