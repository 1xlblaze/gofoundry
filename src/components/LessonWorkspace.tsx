"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { InlineLabRunner } from "@/components/InlineLabRunner";
import { presetForTrack } from "@/lib/etch-diagram";

const EtchCanvas = dynamic(
  () => import("@/components/EtchCanvas").then((mod) => mod.EtchCanvas),
  {
    ssr: false,
    loading: () => <div className="etch-canvas-loading">Loading drawing canvas…</div>,
  },
);

export type WorkspaceMode = "lab" | "etch" | "playground";

type WorkspaceOpenState = {
  mode: WorkspaceMode;
  problemId?: string;
  code?: string;
  fullPageHref?: string;
};

type LessonWorkspaceContextValue = {
  openLab: (options?: { problemId?: string; code?: string; fullPageHref?: string }) => void;
  openEtch: () => void;
  openPlayground: (code: string) => void;
  close: () => void;
  isOpen: boolean;
};

const LessonWorkspaceContext = createContext<LessonWorkspaceContextValue | null>(null);

export function useLessonWorkspace() {
  const ctx = useContext(LessonWorkspaceContext);
  if (!ctx) {
    return {
      openLab: () => {},
      openEtch: () => {},
      openPlayground: () => {},
      close: () => {},
      isOpen: false,
    };
  }
  return ctx;
}

export function LessonWorkspaceProvider({
  lessonSlug,
  trackId,
  children,
}: {
  lessonSlug: string;
  trackId: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState<WorkspaceOpenState | null>(null);
  const storageKey = `gofoundry-lesson-etch-${lessonSlug}`;
  const preset = presetForTrack(trackId);

  const close = useCallback(() => setOpen(null), []);

  const openLab = useCallback(
    (options?: { problemId?: string; code?: string; fullPageHref?: string }) => {
      setOpen({ mode: "lab", ...options });
    },
    [],
  );

  const openEtch = useCallback(() => {
    setOpen({ mode: "etch" });
  }, []);

  const openPlayground = useCallback((code: string) => {
    setOpen({ mode: "playground", code, fullPageHref: "/lab" });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    document.body.classList.add("lesson-workspace-open");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("lesson-workspace-open");
    };
  }, [open, close]);

  const value = useMemo(
    () => ({
      openLab,
      openEtch,
      openPlayground,
      close,
      isOpen: Boolean(open),
    }),
    [openLab, openEtch, openPlayground, close, open],
  );

  return (
    <LessonWorkspaceContext.Provider value={value}>
      {children}
      {open ? (
        <div className="lesson-workspace-backdrop" onClick={close} aria-hidden />
      ) : null}
      <aside
        className={`lesson-workspace-drawer${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal={open ? true : undefined}
        aria-hidden={!open}
        aria-label="Inline learning workspace"
      >
        {open ? (
          <>
            <header className="lesson-workspace-drawer-head">
              <div>
                <p className="type-label">Inline workspace</p>
                <h2 className="lesson-workspace-drawer-title">
                  {open.mode === "etch"
                    ? "HEAT Etch canvas"
                    : open.mode === "lab"
                      ? "Staff Lab runner"
                      : "Go playground"}
                </h2>
              </div>
              <button type="button" className="icon-btn" onClick={close} aria-label="Close workspace">
                ✕
              </button>
            </header>

            <div className="lesson-workspace-drawer-body">
              {open.mode === "etch" ? (
                <>
                  <p className="lesson-workspace-note">
                    Sketch architecture here without leaving the lesson. Autosaves in this browser.
                  </p>
                  <EtchCanvas storageKey={storageKey} preset={preset} height={420} compact />
                  <Link href="/heat" className="ghost-btn lesson-workspace-full-link">
                    Open full HEAT canvas →
                  </Link>
                </>
              ) : null}

              {open.mode === "lab" ? (
                <InlineLabRunner
                  problemId={open.problemId}
                  initialCode={open.code}
                  fullPageHref={open.fullPageHref ?? "/problems"}
                />
              ) : null}

              {open.mode === "playground" ? (
                <InlineLabRunner initialCode={open.code} fullPageHref="/lab" />
              ) : null}
            </div>
          </>
        ) : null}
      </aside>
    </LessonWorkspaceContext.Provider>
  );
}

type WorkspaceActionProps = {
  action: WorkspaceMode;
  problemId?: string;
  code?: string;
  fullPageHref?: string;
  children: ReactNode;
  className?: string;
};

export function WorkspaceAction({
  action,
  problemId,
  code,
  fullPageHref,
  children,
  className = "",
}: WorkspaceActionProps) {
  const workspace = useLessonWorkspace();

  function onClick() {
    if (action === "lab") workspace.openLab({ problemId, code, fullPageHref });
    else if (action === "etch") workspace.openEtch();
    else workspace.openPlayground(code ?? "");
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {children}
    </button>
  );
}
