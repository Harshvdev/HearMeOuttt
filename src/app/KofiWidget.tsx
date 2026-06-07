'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function KofiWidget() {
  useEffect(() => {
    return () => {
      const existingButton = document.getElementById('kofi-widget-overlay');
      if (existingButton) existingButton.remove();
    };
  }, []);

  const handleScriptLoad = () => {
    if (typeof window !== 'undefined' && (window as any).kofiWidgetOverlay) {
      (window as any).kofiWidgetOverlay.draw('harshvdev', {
        'type': 'floating-chat',
        'floating-chat.donateButton.text': 'Support me',
        'floating-chat.donateButton.background-color': '#0866ff', // Matches your custom primary brand blue
        'floating-chat.donateButton.text-color': '#ffffff',
      });
    }
  };

  return (
    <Script
      src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"
      strategy="afterInteractive"
      onLoad={handleScriptLoad}
    />
  );
}