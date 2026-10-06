'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

export function ScreenshotProtection() {
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isWindowObscured, setIsWindowObscured] = useState(false);

  function triggerWarning(msg = 'Screenshots and screen captures are prohibited for competition integrity.') {
    setWarningMessage(msg);
    // Overwrite clipboard to clear any captured image bytes
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText('⚠️ Screenshots and image duplication are strictly prohibited on ACM AI Image Judge.').catch(() => {});
    }
  }

  useEffect(() => {
    if (!warningMessage) return;
    const timer = setTimeout(() => {
      setWarningMessage(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [warningMessage]);

  useEffect(() => {
    // 1. Prevent right-click context menu (blocks "Save Image As", "Copy Image", "Inspect")
    function handleContextMenu(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      // If clicking inside inputs or textareas, permit normal context menu
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      e.preventDefault();
      triggerWarning('Right-click context menu and saving images are disabled on this site.');
    }

    // 2. Intercept keyboard shortcuts for screenshots, print, and developer tools
    function handleKeyDown(e: KeyboardEvent) {
      // PrintScreen key
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault();
        triggerWarning('Screenshot detected. Screen capture is prohibited for competition integrity.');
        return;
      }

      // Windows Snipping tool / Edge screenshot: Ctrl + Shift + S
      if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        triggerWarning('Screen clipping shortcut is prohibited.');
        return;
      }

      // Mac screenshot shortcuts: Command + Shift + 3 / 4 / 5
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        triggerWarning('Screen clipping shortcut is prohibited.');
        return;
      }

      // Print dialog: Ctrl + P / Meta + P
      if ((e.ctrlKey || e.metaKey) && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        triggerWarning('Printing page to PDF or printer is disabled.');
        return;
      }

      // Save page: Ctrl + S / Meta + S
      if ((e.ctrlKey || e.metaKey) && (e.key === 'S' || e.key === 's') && !e.shiftKey) {
        e.preventDefault();
        return;
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        triggerWarning('Screenshot detected. Clipboard has been cleared.');
      }
    }

    // 3. Obscure page when window loses focus (blocks external snipping tool overlays)
    function handleWindowBlur() {
      setIsWindowObscured(true);
    }

    function handleWindowFocus() {
      setIsWindowObscured(false);
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        setIsWindowObscured(true);
      } else {
        setIsWindowObscured(false);
      }
    }

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <>
      {/* Warning Toast */}
      {warningMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-[90%] bg-rose-950/95 border border-rose-500 text-rose-200 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-white">Screenshot Prohibited</p>
            <p className="text-[11px] text-rose-300 leading-tight mt-0.5">{warningMessage}</p>
          </div>
        </div>
      )}

      {/* Protective privacy veil when user switches to external snipping tools */}
      {isWindowObscured && (
        <div className="fixed inset-0 z-[9990] bg-zinc-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none">
          <ShieldAlert className="h-10 w-10 text-sky-400 mb-2 opacity-80" />
          <h2 className="text-base font-bold text-white tracking-tight">ACM Anti-Cheat Content Protection</h2>
          <p className="text-xs text-zinc-400 max-w-xs mt-1">
            Window content is concealed while inactive to maintain competition integrity. Click back to resume.
          </p>
        </div>
      )}
    </>
  );
}
