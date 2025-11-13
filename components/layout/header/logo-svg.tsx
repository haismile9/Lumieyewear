"use client";

import React, { useEffect, useState } from 'react';

export function LogoSvg({ className }: { className?: string }) {
  // Client-side component: pick a logo variant depending on dark mode.
  // Falls back to /LUMI.svg if the alternate file is missing.
  const [isDark, setIsDark] = useState(false);
  const [src, setSrc] = useState('/LUMI.svg');

  useEffect(() => {
    try {
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      const hasDarkClass = document.documentElement.classList.contains('dark');
      const dark = hasDarkClass || prefersDark;
      setIsDark(dark);
    } catch (e) {
      setIsDark(false);
    }
  }, []);

  useEffect(() => {
    // Try to use a light/dark specific logo if available.
    // Convention: /LUMI.svg is the yellow/dark-background logo, /LUMI-dark.svg is a dark logo for light backgrounds.
    const preferred = isDark ? '/LUMI.svg' : '/LUMI-dark.svg';
    setSrc(preferred);
  }, [isDark]);

  return (
    // onError fallback to the primary /LUMI.svg so missing files won't break the header.
    // className is passed through for sizing/responsiveness.
    // Use plain <img> so Next/Image won't try to optimize remote or missing files during SSR.
    <img
      src={src}
      alt="LUMI"
      className={className}
      onError={e => {
        const target = e.currentTarget as HTMLImageElement;
        if (target.src && !target.src.endsWith('/LUMI.svg')) {
          target.src = '/LUMI.svg';
        }
      }}
    />
  );
}
