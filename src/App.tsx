import { useEffect, useState, useRef } from 'react';
import { Eye, Grid2X2, SlidersHorizontal, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { artworks, catalog } from './content';
import {
  initialState,
  readState,
  reducer,
  STORAGE_KEY,
  type Action,
} from './model';
import { ArtworkStage } from './components/ArtworkStage';
import { BottomDock } from './components/BottomDock';
import {
  CollectionDrawer,
  SettingsPanel,
  SourcesPanel,
  HeightForm,
} from './components/GalleryPanels';
const ids = artworks.map((a) => a.id);
function load() {
  try {
    return readState(window.localStorage, ids);
  } catch {
    return null;
  }
}
export default function App() {
  const [generation, setGeneration] = useState(0);
  return (
    <Gallery key={generation} onReset={() => setGeneration((g) => g + 1)} />
  );
}
function Gallery({ onReset }: { onReset: () => void }) {
  const [initial] = useState(
    () => load() ?? initialState(artworks[0]?.id ?? ''),
  );
  const [state, setState] = useState(initial);
  const [returning, setReturning] = useState(initial.onboarded);
  const [collection, setCollection] = useState(false),
    [settings, setSettings] = useState(false),
    [sources, setSources] = useState(false),
    [heightPrompt, setHeightPrompt] = useState(false);
  const [justLook, setJustLook] = useState(false),
    [mode, setMode] = useState<'full' | 'beside'>('full'),
    [setup, setSetup] = useState(false),
    [storageAvailable, setStorageAvailable] = useState(true);
  const dock = useRef<HTMLDivElement>(null);
  const [dockHeight, setDockHeight] = useState(160);
  useEffect(() => {
    if (!dock.current) return;
    const observer = new ResizeObserver(([e]) =>
      setDockHeight(e.contentRect.height),
    );
    observer.observe(dock.current);
    return () => observer.disconnect();
  }, []);
  const currentIndex = Math.max(
    0,
    artworks.findIndex((a) => a.id === state.current.artworkId),
  );
  const artwork = artworks[currentIndex];
  const dispatch = (action: Action) => {
    const nextState = reducer(state, action);
    setState(nextState);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  };
  useEffect(() => {
    if (!artwork) return;
    const next = artworks[(currentIndex + 1) % artworks.length];
    if (next.id === artwork.id) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = next.image.src;
    document.head.appendChild(link);
    return () => link.remove();
  }, [currentIndex, artwork]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setJustLook(false);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  const select = (id: string) => {
    dispatch({ type: 'next', artworkId: id });
    setMode('full');
    setCollection(false);
    setReturning(false);
    setJustLook(false);
  };
  const next = () => select(artworks[(currentIndex + 1) % artworks.length].id);
  const clear = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
    onReset();
  };
  if (!artwork)
    return (
      <main className="empty-collection">
        <h1>There are no reviewed paintings available yet.</h1>
        <p>Add approved entries to the local collection to begin.</p>
      </main>
    );
  return (
    <main
      style={{ '--dock-height': `${dockHeight}px` } as React.CSSProperties}
      className={`gallery ${justLook ? 'just-looking' : ''} stage-${state.current.stage}`}
    >
      <a className="skip-link" href="#interaction">
        Skip to interaction
      </a>
      <header className="topbar">
        <div className="wordmark">
          <Eye size={24} aria-hidden="true" /> Second Look
          <span className="wordmark-period">.</span>
        </div>
        <p className="gallery-motto">A little more time with art.</p>
        <nav aria-label="Gallery">
          <button
            aria-label="Explore collection"
            onClick={() => setCollection(true)}
          >
            <Grid2X2 />
            <span>Explore collection</span>
          </button>
          <button
            className="icon-button"
            aria-label="Settings"
            onClick={() => setSettings(true)}
          >
            <SlidersHorizontal />
          </button>
        </nav>
      </header>
      <ArtworkStage
        key={artwork.id}
        artwork={artwork}
        revealed={state.current.stage !== 'first'}
        justLook={justLook}
        onJustLook={() => setJustLook((v) => !v)}
        mode={mode}
        onMode={(m) => {
          setMode(m);
          if (m === 'beside' && state.heightCm === null) setHeightPrompt(true);
        }}
        heightCm={state.heightCm}
        onHeight={() => setHeightPrompt(true)}
        onNext={next}
        onCredits={() => setSources(true)}
      />
      <div
        ref={dock}
        id="interaction"
        className="interaction-layer"
        hidden={justLook}
      >
        {!state.onboarded ? (
          <section className="welcome-dock">
            <div>
              <span className="eyebrow">WELCOME TO SECOND LOOK</span>
              <h1>Look before you know. Then look again.</h1>
              {setup ? (
                <div className="welcome-height">
                  <h2>How tall are you?</h2>
                  <p>This helps us show the artwork’s size beside you.</p>
                  <HeightForm
                    initial={null}
                    units={state.units}
                    saveLabel="Begin"
                    onSave={(h, u) =>
                      dispatch({ type: 'begin', heightCm: h, units: u })
                    }
                    onSkip={() => dispatch({ type: 'begin' })}
                  />
                </div>
              ) : (
                <button className="text-button" onClick={() => setSetup(true)}>
                  Add your height for a size comparison <span>Optional</span>
                </button>
              )}
            </div>
            {!setup && (
              <div className="welcome-actions">
                <button
                  className="primary-button"
                  onClick={() => dispatch({ type: 'begin' })}
                >
                  Begin <ArrowRight />
                </button>
                <button
                  className="outline-button"
                  onClick={() => dispatch({ type: 'begin' })}
                >
                  Skip
                </button>
              </div>
            )}
          </section>
        ) : returning ? (
          <section className="welcome-dock returning-dock">
            <div>
              <span className="eyebrow">WELCOME BACK</span>
              <h1>A little space to look again.</h1>
            </div>
            <div className="welcome-actions">
              <button
                className="primary-button"
                onClick={() => setReturning(false)}
              >
                Continue where you left off <ArrowRight />
              </button>
              <button className="outline-button" onClick={next}>
                Something new
              </button>
            </div>
          </section>
        ) : (
          <BottomDock
            key={`${state.current.id}-${state.current.stage}`}
            visit={state.current}
            artwork={artwork}
            dispatch={dispatch}
            onNext={next}
            saved={state.savedIds.includes(artwork.id)}
            onSources={() => setSources(true)}
          />
        )}
      </div>
      {!storageAvailable && (
        <output className="storage-notice">
          Browser storage is unavailable. Your responses will last for this
          session only.
        </output>
      )}
      <CollectionDrawer
        open={collection}
        onOpenChange={setCollection}
        artworks={artworks}
        state={state}
        onSelect={select}
        onBookmark={(id) => dispatch({ type: 'bookmark', artworkId: id })}
        pendingCount={catalog.length - artworks.length}
      />
      <SettingsPanel
        open={settings}
        onOpenChange={setSettings}
        state={state}
        onHeight={(h, u) => dispatch({ type: 'height', heightCm: h, units: u })}
        onClear={clear}
        storageAvailable={storageAvailable}
      />
      <SourcesPanel
        open={sources}
        onOpenChange={setSources}
        artwork={artwork}
      />
      <Dialog open={heightPrompt} onOpenChange={setHeightPrompt}>
        <DialogContent className="gallery-dialog">
          <DialogTitle className="panel-title">
            See its size beside you.
          </DialogTitle>
          <DialogDescription>
            How tall are you? This stays only in your browser.
          </DialogDescription>
          <HeightForm
            key={`${state.heightCm}-${heightPrompt}`}
            initial={state.heightCm}
            units={state.units}
            onSave={(h, u) => {
              dispatch({ type: 'height', heightCm: h, units: u });
              setHeightPrompt(false);
            }}
            onSkip={() => setHeightPrompt(false)}
            saveLabel="Use this height"
          />
          <p className="muted">
            If you skip, the diagram uses a clearly labeled 170 cm reference
            person.
          </p>
        </DialogContent>
      </Dialog>
    </main>
  );
}
