import React from 'react';

export default function PastelBackground({ className = 'absolute inset-0 -z-30' }) {
  return (
    <div className={`${className} pointer-events-none`} aria-hidden="true">
      <div className="pastel-bg" />
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="overlay-vignette" />
    </div>
  );
}