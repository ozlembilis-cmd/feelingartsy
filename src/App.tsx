import { useEffect, useState, useRef } from 'react';
import {
  Grid2X2,
  SlidersHorizontal,
  ArrowLeft,
  CircleHelp,
} from 'lucide-react';
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
import { TooltipProvider } from '@/components/ui/tooltip';
import { IconButton } from './components/Hint';
import { HowItWorks } from './components/HowItWorks';
import { ArtIntro } from './components/ArtIntro';
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
    <TooltipProvider delay={250}>
      <Gallery key={generation} onReset={() => setGeneration((g) => g + 1)} />
    </TooltipProvider>
  );
}
function Gallery({ onReset }: { onReset: () => void }) {
  const [initial] = useState(
    () =>
      load() ??
      initialState(
        artworks.find((a) => a.id === 'guernica')?.id ?? artworks[0]?.id ?? '',
      ),
  );
  const [state, setState] = useState(initial);
  const [intro, setIntro] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);
  const [collection, setCollection] = useState(false),
    [settings, setSettings] = useState(false),
    [sources, setSources] = useState(false),
    [heightPrompt, setHeightPrompt] = useState(false);
  const [justLook, setJustLook] = useState(false),
    [mode, setMode] = useState<'full' | 'beside'>('full'),
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
  }, [intro]);
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
    if (!artwork || intro) return;
    const next = artworks[(currentIndex + 1) % artworks.length];
    if (next.id === artwork.id) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = next.image.src;
    document.head.appendChild(link);
    return () => link.remove();
  }, [currentIndex, artwork, intro]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setJustLook(false);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  const select = (id: string) => {
    if (intro && !state.guideSeen) setGuideOpen(true);
    dispatch({ type: state.onboarded ? 'next' : 'begin', artworkId: id });
    setMode('full');
    setCollection(false);
    setIntro(false);
    setJustLook(false);
  };
  const enter = (id?: string) => {
    if (!state.guideSeen) setGuideOpen(true);
    if (!state.onboarded) {
      dispatch({ type: 'begin', artworkId: id });
    } else if (id) {
      dispatch({ type: 'next', artworkId: id });
    }
    setMode('full');
    setJustLook(false);
    setIntro(false);
  };
  const closeGuide = (start = false) => {
    dispatch({ type: 'guide-seen', begin: start });
    setGuideOpen(false);
    if (start) setIntro(false);
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
      className={`gallery immersive-gallery ${intro ? 'showing-intro' : ''} ${justLook ? 'just-looking' : ''} stage-${state.current.stage}`}
    >
      {intro ? (
        <ArtIntro
          artworks={artworks}
          returning={state.onboarded}
          onEnter={enter}
          onNew={() => enter(artworks[(currentIndex + 1) % artworks.length].id)}
          onCredits={() => setCollection(true)}
          onHelp={() => setGuideOpen(true)}
        />
      ) : (
        <>
          <div
            className="ambient-backdrop"
            aria-hidden="true"
            style={{ backgroundImage: `url("${artwork.image.src}")` }}
          />
          <div className="ambient-shade" aria-hidden="true" />
          <a className="skip-link" href="#interaction">
            Skip to interaction
          </a>
          <header className="topbar">
            <IconButton
              className="icon-control"
              aria-label="Back to intro"
              title="Back to intro"
              onClick={() => {
                setIntro(true);
                setJustLook(false);
              }}
            >
              <ArrowLeft />
            </IconButton>
            <nav aria-label="Gallery">
              <IconButton
                className="icon-control"
                aria-label="How it works"
                hint="A quick guide to looking, guessing, and feeling."
                onClick={() => setGuideOpen(true)}
              >
                <CircleHelp />
              </IconButton>
              <IconButton
                className="icon-control"
                aria-label="Explore collection"
                hint="Browse paintings, saved works, and past visits."
                title="Explore collection"
                onClick={() => setCollection(true)}
              >
                <Grid2X2 />
              </IconButton>
              <IconButton
                className="icon-control"
                aria-label="Settings"
                hint="Your height and browser data."
                title="Settings"
                onClick={() => setSettings(true)}
              >
                <SlidersHorizontal />
              </IconButton>
            </nav>
          </header>
          <ArtworkStage
            key={artwork.id}
            artwork={artwork}
            justLook={justLook}
            onJustLook={() => setJustLook((v) => !v)}
            mode={mode}
            onMode={(m) => {
              setMode(m);
              if (m === 'beside' && state.heightCm === null)
                setHeightPrompt(true);
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
            <BottomDock
              key={`${state.current.id}-${state.current.stage}`}
              visit={state.current}
              artwork={artwork}
              dispatch={dispatch}
              onNext={next}
              saved={state.savedIds.includes(artwork.id)}
              onSources={() => setSources(true)}
            />
          </div>
        </>
      )}
      {!storageAvailable && (
        <output className="storage-notice">
          Browser storage is unavailable. Your responses will last for this
          session only.
        </output>
      )}
      <HowItWorks
        open={guideOpen}
        onDismiss={() => closeGuide()}
        onStart={() => closeGuide(true)}
        onHeight={() => {
          closeGuide(true);
          setHeightPrompt(true);
          if (artwork.dimensions) setMode('beside');
        }}
      />
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
            Enter your height to compare the artwork’s dimensions with a person
            your size. Your height stays in this browser.
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
            This shows proportions, not actual size on your screen. Skip to use
            a 170 cm reference person.
          </p>
        </DialogContent>
      </Dialog>
    </main>
  );
}
