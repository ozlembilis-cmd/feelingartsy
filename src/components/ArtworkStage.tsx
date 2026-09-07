/* oxlint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- The labeled group is an intentionally focusable zoom/pan canvas; native HTML has no equivalent. Inline SVG uses an explicit accessible image role. */
import { useState, useRef, useEffect } from 'react';
import {
  Info,
  Image,
  Minimize,
  Minus,
  Plus,
  Scan,
  Expand,
  RotateCcw,
  ArrowRight,
  Ruler,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Artwork } from '../content/types';
import { fitScale } from '../model';
export function ScaleDiagram({
  artwork,
  heightCm,
  onHeight,
  onLoad,
  onError,
}: {
  artwork: Artwork;
  heightCm: number | null;
  onHeight: () => void;
  onLoad: () => void;
  onError: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 500, h: 300 });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const personCm = heightCm ?? 170;
  const d = artwork.dimensions!;
  const s = fitScale(
    d.widthCm,
    d.heightCm,
    personCm,
    Math.max(0, size.w - 28),
    Math.max(0, size.h - 55),
  );
  return (
    <div className="scale-view">
      <div className="scale-canvas" ref={box}>
        <div className="scale-objects" style={{ gap: s.gap }}>
          <figure style={{ width: s.artWidth }}>
            <img
              src={artwork.image.src}
              alt={artwork.image.alt}
              onLoad={onLoad}
              onError={onError}
              style={{
                width: s.artWidth,
                height: s.artHeight,
                objectFit: 'contain',
              }}
            />
            <figcaption>
              {d.widthCm} × {d.heightCm} cm
            </figcaption>
          </figure>
          <figure style={{ width: s.personWidth }}>
            <svg
              className="person-outline"
              role="img"
              aria-label={`${heightCm ? 'Your height' : 'Generic reference person'}: ${personCm} centimetres`}
              viewBox="0 0 48 170"
              width={s.personWidth}
              height={s.personHeight}
            >
              <circle cx="24" cy="10" r="10" />
              <path d="M17 24c-7 1-9 5-11 13L1 73c-1 6 6 7 7 1l7-32-1 40-4 82q0 6 6 6t5-6l3-59 3 59q0 6 5 6t6-6l-4-82-1-40 7 32c1 6 8 5 7-1l-5-36c-2-8-4-12-11-13Z" />
            </svg>
            <figcaption>
              {heightCm ? 'You' : 'Reference'}
              <br />
              {personCm} cm
            </figcaption>
          </figure>
        </div>
      </div>
      <div className="scale-caption">
        <p>Proportional size comparison—not actual size on your screen.</p>
        <button className="text-button" onClick={onHeight}>
          {heightCm ? 'Edit your height' : 'Use your height'}
        </button>
      </div>
      {!heightCm && (
        <p className="scale-note">
          Generic reference person · 170 cm. This is not your recorded height.
        </p>
      )}
      {/fresco|wall|mural/i.test(artwork.medium) && (
        <p className="scale-note">
          Dimensions only; this does not reproduce the original viewing position
          or hanging height.
        </p>
      )}
    </div>
  );
}
export function ArtworkStage({
  artwork,
  justLook,
  onJustLook,
  mode,
  onMode,
  heightCm,
  onHeight,
  onNext,
  onCredits,
}: {
  artwork: Artwork;
  justLook: boolean;
  onJustLook: () => void;
  mode: 'full' | 'beside';
  onMode: (v: 'full' | 'beside') => void;
  heightCm: number | null;
  onHeight: () => void;
  onNext: () => void;
  onCredits: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [retry, setRetry] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null,
  );
  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const adjust = (z: number) => {
    const n = Math.max(1, Math.min(4, z));
    setZoom(n);
    if (n === 1) setPan({ x: 0, y: 0 });
  };
  const move = (x: number, y: number) => {
    const r = viewport.current?.getBoundingClientRect();
    const maxX = ((r?.width ?? 100) * (zoom - 1)) / 2,
      maxY = ((r?.height ?? 100) * (zoom - 1)) / 2;
    setPan({
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    });
  };
  return (
    <section
      className={`artwork-stage ${justLook ? 'quiet-stage' : ''}`}
      aria-label="Artwork viewing area"
    >
      {justLook && (
        <div className="stage-top">
          <button
            className="icon-control"
            aria-label="Show controls"
            title="Show controls"
            onClick={onJustLook}
          >
            <Minimize />
          </button>
        </div>
      )}
      <div
        className={`painting-viewport ${zoom > 1 ? 'can-pan' : ''}`}
        ref={viewport}
        tabIndex={0}
        role="group"
        aria-label="Painting. Use zoom buttons to enlarge. When enlarged, use arrow keys or drag to pan; press zero to reset."
        onKeyDown={(e) => {
          if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            adjust(zoom + 0.25);
          } else if (e.key === '-') {
            e.preventDefault();
            adjust(zoom - 0.25);
          } else if (e.key === '0') reset();
          else if (zoom > 1 && e.key.startsWith('Arrow')) {
            e.preventDefault();
            move(
              pan.x +
                (e.key === 'ArrowLeft' ? 40 : e.key === 'ArrowRight' ? -40 : 0),
              pan.y +
                (e.key === 'ArrowUp' ? 40 : e.key === 'ArrowDown' ? -40 : 0),
            );
          }
        }}
        onPointerDown={(e) => {
          if (zoom === 1 || mode === 'beside') return;
          drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current)
            move(
              drag.current.px + e.clientX - drag.current.x,
              drag.current.py + e.clientY - drag.current.y,
            );
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        {mode === 'beside' && artwork.dimensions ? (
          <ScaleDiagram
            key={`${artwork.id}-${retry}`}
            onLoad={() => setStatus('ready')}
            onError={() => setStatus('error')}
            artwork={artwork}
            heightCm={heightCm}
            onHeight={onHeight}
          />
        ) : (
          <img
            key={`${artwork.id}-${retry}`}
            className="painting"
            src={artwork.image.src}
            alt={artwork.image.alt}
            draggable={false}
            style={{
              transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
              opacity: status === 'ready' ? 1 : 0,
            }}
            onLoad={() => setStatus('ready')}
            onError={() => setStatus('error')}
          />
        )}
        {status === 'loading' && (
          <output className="image-state">
            <span className="loading-ring" />
            <p>Bringing the painting into view…</p>
          </output>
        )}
        {status === 'error' && (
          <div className="image-state" role="alert">
            <h2>This painting couldn’t load.</h2>
            <p>Your place and responses are still here.</p>
            <div>
              <button
                className="outline-button"
                onClick={() => {
                  setStatus('loading');
                  setRetry((r) => r + 1);
                }}
              >
                <RotateCcw /> Try again
              </button>
              <button className="text-button" onClick={onNext}>
                Next artwork <ArrowRight />
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="stage-bottom">
        <Tabs
          className="view-tabs"
          value={mode}
          onValueChange={(v) => {
            reset();
            onMode(v as 'full' | 'beside');
          }}
        >
          <TabsList className="mode-switch">
            <TabsTrigger
              value="full"
              aria-label="Full artwork"
              title="Full artwork"
            >
              <Image />
            </TabsTrigger>
            <TabsTrigger
              value="beside"
              aria-label="Beside you"
              disabled={!artwork.dimensions}
              title={
                !artwork.dimensions
                  ? 'Size comparison unavailable: verified dimensions must match the image.'
                  : 'Beside you'
              }
            >
              <Ruler />
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <button
          className="image-credit icon-control"
          aria-label="Image credit & permissions"
          title="Image credit & permissions"
          onClick={onCredits}
        >
          <Info />
        </button>
        <div className="zoom-tools">
          <button
            title="Zoom out"
            aria-label="Zoom out"
            disabled={zoom === 1 || mode === 'beside'}
            onClick={() => adjust(zoom - 0.25)}
          >
            <Minus />
          </button>
          <span className="zoom-value sr-only" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button
            title="Zoom in"
            aria-label="Zoom in"
            disabled={zoom === 4 || mode === 'beside'}
            onClick={() => adjust(zoom + 0.25)}
          >
            <Plus />
          </button>
          <button title="Reset view" aria-label="Reset view" onClick={reset}>
            <Scan />
          </button>
          <button title="Just look" aria-label="Just look" onClick={onJustLook}>
            <Expand />
          </button>
        </div>
      </div>
      {justLook && (
        <button
          className="quiet-credit icon-control"
          aria-label="Image credit & permissions"
          title="Image credit & permissions"
          onClick={onCredits}
        >
          <Info />
        </button>
      )}
    </section>
  );
}
