import { forwardRef } from "react";
import { createPortal } from "react-dom";
import { classNames } from "./classNames.js";

export const Dialog = forwardRef(function Dialog({ children, className = "", labelledBy, overlayClassName = "", ...props }, ref) {
  return createPortal(
    <div
      className={classNames("fixed inset-0 z-[2000] grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md", overlayClassName)}
      role="presentation"
    >
      <section
        ref={ref}
        className={classNames(
          "relative max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-chris-dialog bg-chris-panel text-white shadow-chris-dialog",
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        {...props}
      >
        {children}
      </section>
    </div>,
    document.body,
  );
});
