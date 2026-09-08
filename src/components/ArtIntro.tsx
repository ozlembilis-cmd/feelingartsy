import { useEffect, useRef, useState } from 'react';
import { Palette, Pause, Play, Shuffle, Info } from 'lucide-react';
import { IconButton } from './Hint';
import type { Artwork } from '../content/types';

// A small curated constellation. Every tile is a real painting in the collection.
const constellationIds = [
  'girl-with-a-pearl-earring',
  'aic-8991',
  'birth-of-venus',
  'aic-28560',
  'aic-14655',
  'starry-night',
  'aic-11723',
  'guernica',
  'aic-80607',
  'scream',
  'aic-64818',
  'mona-lisa',
  'aic-111436',
  'aic-27992',
  'las-meninas',
  'aic-90048',
  'aic-111442',
  'aic-61128',
];

export function ArtIntro({
  artworks,
  returning,
  onEnter,
  onNew,
  onCredits,
  onHelp,
  onProfile,
}: {
  artworks: Artwork[];
  returning: boolean;
  onEnter: (artworkId?: string) => void;
  onNew: () => void;
  onCredits: () => void;
  onHelp: () => void;
  onProfile: () => void;
}) {
  const tiles = constellationIds.flatMap(
    (id) => artworks.find((a) => a.id === id) ?? [],
  );
  const scene = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const pointer = useRef({ x: 0, y: 0 });
  const angle = useRef(0.25);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const el = scene.current;
    if (!el) return;
    let frame = 0;
    let last = 0;
    let width = el.clientWidth;
    let height = el.clientHeight;
    const draw = () => {
      const rx = Math.min(width * 0.43, 570);
      const ry = Math.min(height * 0.39, 345);
      cards.current.forEach((card, i) => {
        if (!card) return;
        const y = 1 - ((i + 0.5) * 2) / constellationIds.length;
        const ring = Math.sqrt(1 - y * y);
        const theta = i * Math.PI * (3 - Math.sqrt(5)) + angle.current;
        const z = Math.cos(theta) * ring;
        const x = Math.sin(theta) * ring;
        const depth = 0.73 + (z + 1) * 0.22;
        const px = reduced ? 0 : pointer.current.x * (z + 1) * 12;
        const py = reduced ? 0 : pointer.current.y * (z + 1) * 8;
        card.style.transform = `translate(-50%, -50%) translate(${x * rx + px}px, ${y * ry + py}px) scale(${depth})`;
        card.style.opacity = `${0.38 + (z + 1) * 0.31}`;
        card.style.zIndex = `${Math.round((z + 1) * 10) + 2}`;
      });
    };
    const tick = (now: number) => {
      if (last && !document.hidden)
        angle.current += Math.min(now - last, 50) * 0.000055;
      last = now;
      draw();
      frame = requestAnimationFrame(tick);
    };
    const observer = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      draw();
    });
    observer.observe(el);
    draw();
    if (!paused && !reduced) frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [paused, reduced]);

  return (
    <section
      className="art-intro"
      aria-label="Feeling artsy?"
      onPointerMove={(e) => {
        pointer.current = {
          x: e.clientX / window.innerWidth - 0.5,
          y: e.clientY / window.innerHeight - 0.5,
        };
      }}
      onPointerLeave={() => {
        pointer.current = { x: 0, y: 0 };
      }}
    >
      <button
        className="intro-enter"
        aria-label={
          returning ? 'Continue where you left off' : 'Begin exploring art'
        }
        onClick={() => onEnter()}
      />
      <div className="intro-constellation" ref={scene}>
        {tiles.map((artwork, i) => (
          <button
            className={`orbit-card orbit-card-${i % 4}`}
            key={artwork.id}
            ref={(el) => {
              cards.current[i] = el;
            }}
            aria-label={`Start with painting ${i + 1}. ${artwork.image.alt}`}
            onFocus={() => setPaused(true)}
            onClick={() => onEnter(artwork.id)}
          >
            <img
              src={artwork.image.src}
              alt=""
              draggable={false}
              decoding="async"
            />
          </button>
        ))}
      </div>
      <h1 className="intro-title">
        Feeling
        <br />
        artsy?
      </h1>
      <div className="intro-footer">
        <button className="intro-how" onClick={onHelp}>
          How it works
        </button>
        <div className="intro-utilities">
          <IconButton
            className="intro-profile"
            title="Create my art profile"
            aria-label="Create my art profile"
            onClick={onProfile}
          >
            <Palette aria-hidden="true" />
            <span>Create my art profile</span>
          </IconButton>
          {returning && (
            <IconButton
              className="icon-control"
              title="Something new"
              aria-label="Something new"
              onClick={onNew}
            >
              <Shuffle />
            </IconButton>
          )}
          <div className="intro-meta">
            <IconButton
              className="icon-control"
              title="Collection & image credits"
              aria-label="Collection and image credits"
              onClick={onCredits}
            >
              <Info />
            </IconButton>
            {!reduced && (
              <IconButton
                className="icon-control"
                title={paused ? 'Play animation' : 'Pause animation'}
                aria-label={paused ? 'Play animation' : 'Pause animation'}
                onClick={() => setPaused((v) => !v)}
              >
                {paused ? <Play /> : <Pause />}
              </IconButton>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
