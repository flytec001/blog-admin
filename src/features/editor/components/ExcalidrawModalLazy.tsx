import { Suspense, lazy } from "react";
import type { ComponentProps } from "react";

const Modal = lazy(() => import("./ExcalidrawModal"));

export type ExcalidrawModalLazyProps = ComponentProps<typeof Modal>;

export function ExcalidrawModalLazy(props: ExcalidrawModalLazyProps) {
  return (
    <Suspense
      fallback={
        <div className="excalidraw-modal" role="dialog" aria-modal="true">
          <div className="excalidraw-modal-backdrop" aria-hidden="true" />
          <div className="excalidraw-modal-body">
            <div className="excalidraw-loading">加载画板中...</div>
          </div>
        </div>
      }
    >
      <Modal {...props} />
    </Suspense>
  );
}
