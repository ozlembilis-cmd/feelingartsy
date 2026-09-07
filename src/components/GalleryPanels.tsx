import { IconButton } from './Hint';
import { useState } from 'react';
import {
  Search,
  ArrowRight,
  Bookmark,
  Check,
  CircleDot,
  Palette,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import type { Artwork } from '../content/types';
import type { GalleryState } from '../model';
import { ReflectionComparison } from './BottomDock';
export function HeightForm({
  initial,
  units: initialUnits,
  onSave,
  onSkip,
  saveLabel = 'Save height',
}: {
  initial: number | null;
  units: 'cm' | 'ft';
  onSave: (height: number | null, units: 'cm' | 'ft') => void;
  onSkip?: () => void;
  saveLabel?: string;
}) {
  const [units, setUnits] = useState(initialUnits),
    [cm, setCm] = useState(initial?.toString() ?? ''),
    [ft, setFt] = useState(
      initial ? Math.floor(Math.round(initial / 2.54) / 12).toString() : '',
    ),
    [inch, setInch] = useState(
      initial ? (Math.round(initial / 2.54) % 12).toString() : '',
    ),
    [error, setError] = useState('');
  const value =
    units === 'cm'
      ? cm === ''
        ? null
        : Number(cm)
      : ft === '' && inch === ''
        ? null
        : Number(ft || 0) * 30.48 + Number(inch || 0) * 2.54;
  const changeUnits = (next: 'cm' | 'ft') => {
    if (next === units) return;
    if (value && Number.isFinite(value)) {
      if (next === 'cm') setCm((Math.round(value * 10) / 10).toString());
      else {
        setFt(Math.floor(Math.round(value / 2.54) / 12).toString());
        setInch((Math.round(value / 2.54) % 12).toString());
      }
    }
    setUnits(next);
    setError('');
  };
  return (
    <form
      className="height-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (
          value !== null &&
          (!Number.isFinite(value) ||
            value < 40 ||
            value > 260 ||
            (units === 'ft' && (+inch < 0 || +inch >= 12)))
        ) {
          setError(
            'Enter a height from 40 to 260 cm. Inches should be between 0 and 11.',
          );
          return;
        }
        onSave(value === null ? null : Math.round(value * 10) / 10, units);
      }}
    >
      <Tabs value={units} onValueChange={(v) => changeUnits(v as 'cm' | 'ft')}>
        <TabsList className="mode-switch">
          <TabsTrigger value="cm">Centimeters</TabsTrigger>
          <TabsTrigger value="ft">Feet / inches</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="height-inputs">
        {units === 'cm' ? (
          <label>
            Height in centimeters
            <div>
              <input
                type="number"
                inputMode="decimal"
                min="40"
                max="260"
                step="0.1"
                value={cm}
                onChange={(e) => setCm(e.target.value)}
                placeholder="e.g. 170"
                aria-describedby="height-error"
              />
              <span>cm</span>
            </div>
          </label>
        ) : (
          <>
            <label>
              Feet
              <div>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="8"
                  step="1"
                  value={ft}
                  onChange={(e) => setFt(e.target.value)}
                  placeholder="5"
                />
                <span>ft</span>
              </div>
            </label>
            <label>
              Inches
              <div>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="11"
                  step="1"
                  value={inch}
                  onChange={(e) => setInch(e.target.value)}
                  placeholder="7"
                />
                <span>in</span>
              </div>
            </label>
          </>
        )}
      </div>
      {error && (
        <p id="height-error" role="alert">
          {error}
        </p>
      )}
      <p className="muted">Optional. Kept only in this browser.</p>
      <div className="form-actions">
        <button className="primary-button" type="submit">
          {saveLabel}
          <ArrowRight />
        </button>
        {onSkip && (
          <button className="outline-button" type="button" onClick={onSkip}>
            Skip
          </button>
        )}
      </div>
    </form>
  );
}
export function SettingsPanel({
  open,
  onOpenChange,
  state,
  onHeight,
  onClear,
  storageAvailable,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  state: GalleryState;
  onHeight: (h: number | null, u: 'cm' | 'ft') => void;
  onClear: () => void;
  storageAvailable: boolean;
}) {
  const [confirm, setConfirm] = useState(false),
    [saved, setSaved] = useState(false);
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="gallery-dialog">
          <DialogTitle className="panel-title">
            Make yourself at home.
          </DialogTitle>
          <DialogDescription>
            Your gallery is saved in this browser.
          </DialogDescription>
          <div className="settings-section">
            <h2>Your height</h2>
            <p>This helps us show the artwork’s size beside you.</p>
            <HeightForm
              key={`${state.heightCm}-${state.units}`}
              initial={state.heightCm}
              units={state.units}
              onSave={(h, u) => {
                onHeight(h, u);
                setSaved(true);
              }}
            />
            {saved && (
              <output className="muted">Height preference saved.</output>
            )}
            {state.heightCm !== null && (
              <button
                className="text-button underlined"
                onClick={() => {
                  onHeight(null, state.units);
                  setSaved(false);
                }}
              >
                Delete my height
              </button>
            )}
          </div>
          <div className="settings-section">
            <h2>Your space, your data</h2>
            <p>
              No account or analytics. Your height and guesses stay in this
              browser. If you choose to create an AI profile, your saved choices
              and feelings are sent to Mistral. Written reflections are included
              only if you choose.
            </p>
            {!storageAvailable && (
              <output>
                Browser storage is unavailable. Changes will last for this
                session only.
              </output>
            )}
            <button className="outline-button" onClick={() => setConfirm(true)}>
              Clear my data
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent className="gallery-dialog">
          <AlertDialogTitle className="panel-title">
            Clear your gallery data?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This removes your height, saved artwork, art profile, and all visits
            from this browser. This cannot be undone.
          </AlertDialogDescription>
          <div className="form-actions">
            <AlertDialogCancel className="outline-button">
              Keep my data
            </AlertDialogCancel>
            <AlertDialogAction
              className="primary-button"
              onClick={() => {
                setConfirm(false);
                onOpenChange(false);
                onClear();
              }}
            >
              Clear my data
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
export function SourcesPanel({
  open,
  onOpenChange,
  artwork,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  artwork: Artwork;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gallery-dialog sources-dialog">
        <DialogTitle className="panel-title">
          Sources & image credit
        </DialogTitle>
        <DialogDescription>
          Collection records inform the story. Image permissions are reviewed
          for each file.
        </DialogDescription>
        <section>
          <h2>{artwork.title}</h2>
          <p>
            {artwork.artist} · {artwork.date}
            <br />
            {artwork.medium}
            <br />
            {artwork.collection}
          </p>
        </section>
        <section>
          <h2>History & context</h2>
          {artwork.sources.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
              {s.label} ↗
            </a>
          ))}
        </section>
        <section>
          <h2>Image permission</h2>
          <p>{artwork.image.credit}</p>
          <p>
            {artwork.image.license} · Reviewed {artwork.image.reviewedAt}
          </p>
          <a href={artwork.image.source} target="_blank" rel="noreferrer">
            {artwork.image.provenance === 'user-supplied'
              ? 'Supplied photograph ↗'
              : 'Original image record ↗'}
          </a>
          <a
            href={artwork.image.permissionUrl}
            target="_blank"
            rel="noreferrer"
          >
            {artwork.image.provenance === 'user-supplied'
              ? 'Photograph use record ↗'
              : 'Permission evidence ↗'}
          </a>
        </section>
        <section>
          <h2>Size comparison</h2>
          <p>
            {artwork.dimensions
              ? `${artwork.dimensions.widthCm} × ${artwork.dimensions.heightCm} cm (width × height). ${artwork.dimensions.note ?? ''}`
              : artwork.statusNote ||
                'Unavailable until artwork dimensions and the exact image extent are verified.'}
          </p>
          {artwork.dimensions && (
            <a
              href={artwork.dimensions.source}
              target="_blank"
              rel="noreferrer"
            >
              Dimension source ↗
            </a>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}
export function CollectionDrawer({
  open,
  onOpenChange,
  artworks,
  state,
  onSelect,
  onBookmark,
  pendingCount,
  onProfile,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  artworks: Artwork[];
  state: GalleryState;
  onSelect: (id: string) => void;
  onBookmark: (id: string) => void;
  pendingCount: number;
  onProfile: () => void;
}) {
  const [query, setQuery] = useState(''),
    [view, setView] = useState('available');
  const visited = new Set([
    ...state.visits.map((v) => v.artworkId),
    state.current.artworkId,
  ]);
  const list = artworks.filter(
    (a) =>
      (view === 'available' ||
        (view === 'saved' && state.savedIds.includes(a.id)) ||
        (view === 'visited' && visited.has(a.id))) &&
      `${a.title} ${a.artist}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase().trim()),
  );
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="collection-drawer">
        <header>
          <span className="eyebrow">TAKE YOUR TIME</span>
          <SheetTitle className="panel-title">A world to look into.</SheetTitle>
          <SheetDescription>
            {artworks.length} available paintings. A collection, not a ranking.
          </SheetDescription>
        </header>
        <button className="profile-entry" onClick={onProfile}>
          <Palette size={18} /> <span>Create my art profile</span>{' '}
          <ArrowRight size={16} />
        </button>
        <label className="search-field">
          <Search />
          <span className="sr-only">Search by title or artist</span>
          <input
            placeholder="An artwork, an artist…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <Tabs value={view} onValueChange={(v) => setView(v as string)}>
          <TabsList className="collection-tabs" variant="line">
            <TabsTrigger value="available">
              Available <span>{artworks.length}</span>
            </TabsTrigger>
            <TabsTrigger value="saved">
              Saved <span>{state.savedIds.length}</span>
            </TabsTrigger>
            <TabsTrigger value="visited">
              Visited <span>{visited.size}</span>
            </TabsTrigger>
          </TabsList>
          {['available', 'saved', 'visited'].map((tab) => (
            <TabsContent key={tab} value={tab}>
              <div className="collection-list">
                {list.map((a) => {
                  const saved = state.savedIds.includes(a.id),
                    visits = state.visits.filter(
                      (v) => v.artworkId === a.id && v.savedAt,
                    );
                  return (
                    <article className="collection-item" key={a.id}>
                      <button
                        className="artwork-choice"
                        onClick={() => onSelect(a.id)}
                      >
                        <div className="thumbnail">
                          <img
                            src={a.image.src}
                            alt=""
                            loading="lazy"
                            width="100"
                            height="95"
                          />
                        </div>
                        <div>
                          <h2>{a.title}</h2>
                          <p>{a.artist}</p>
                          <span>{a.date}</span>
                          {a.id === state.current.artworkId && (
                            <span className="currently-viewing">
                              <CircleDot size={12} /> Currently viewing
                            </span>
                          )}
                        </div>
                        <ArrowRight />
                      </button>
                      <IconButton
                        className="icon-button bookmark-toggle"
                        aria-label={`${saved ? 'Remove' : 'Save'} ${a.title} ${saved ? 'from' : 'to'} my collection`}
                        aria-pressed={saved}
                        onClick={() => onBookmark(a.id)}
                      >
                        {saved ? <Check /> : <Bookmark />}
                      </IconButton>
                      {view === 'visited' && visits.length > 0 && (
                        <details className="visit-history">
                          <summary>
                            {visits.length} saved{' '}
                            {visits.length === 1 ? 'reflection' : 'reflections'}
                          </summary>
                          {visits.map((v) => (
                            <div key={v.id}>
                              <time>
                                {new Date(v.startedAt).toLocaleDateString(
                                  undefined,
                                  {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  },
                                )}
                              </time>
                              <ReflectionComparison visit={v} />
                            </div>
                          ))}
                        </details>
                      )}
                    </article>
                  );
                })}
                {!list.length && (
                  <div className="empty-collection">
                    <h2>
                      {query
                        ? 'Nothing here by that name.'
                        : view === 'saved'
                          ? 'Room for what stays with you.'
                          : 'Your visits will appear here.'}
                    </h2>
                    <p>
                      {query
                        ? 'Try another title or artist.'
                        : 'Explore a painting and save it whenever you like.'}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        <footer>
          {pendingCount > 0
            ? `${pendingCount} additional ${pendingCount === 1 ? 'work is' : 'works are'} awaiting research or image permission.`
            : 'All catalog entries are available.'}{' '}
          Only reviewed works appear here.
        </footer>
      </SheetContent>
    </Sheet>
  );
}
