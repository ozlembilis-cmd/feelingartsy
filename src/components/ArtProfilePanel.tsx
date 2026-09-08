import { useEffect, useRef, useState } from 'react';
import '../profile.css';
import { ArrowRight, Bookmark, LoaderCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Artwork } from '../content/types';
import {
  describeEvidence,
  profileFingerprint,
  validArtProfile,
  PROFILE_TARGET,
  PROFILE_STORAGE_KEY,
  PROFILE_MAX_ARTWORKS,
  type ProfileEvidence,
  type ProfileResult,
} from '../profile';

export function ArtProfilePanel({
  evidence,
  artworks,
  onClose,
  onSelect,
}: {
  evidence: ProfileEvidence[];
  artworks: Artwork[];
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const [includeWords, setIncludeWords] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [storageFailed, setStorageFailed] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const fingerprint = profileFingerprint(evidence);
  const [result, setResult] = useState<ProfileResult | null>(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(PROFILE_STORAGE_KEY) ?? 'null',
      );
      if (
        saved?.fingerprint === fingerprint &&
        typeof saved.model === 'string' &&
        typeof saved.createdAt === 'string' &&
        validArtProfile(
          saved.profile,
          new Set(evidence.map((e) => e.artworkId)),
          new Set(artworks.map((a) => a.id)),
        )
      )
        return saved;
    } catch {
      /* Browser storage is optional. */
    }
    return null;
  });
  useEffect(() => {
    const check = new AbortController();
    fetch('/api/art-profile', { signal: check.signal, cache: 'no-store' })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!check.signal.aborted) setAvailable(data?.available === true);
      })
      .catch(() => {
        if (!check.signal.aborted) setAvailable(false);
      });
    return () => {
      check.abort();
      controller.current?.abort();
    };
  }, []);

  const shared = evidence
    .slice(-PROFILE_MAX_ARTWORKS)
    .map((e) => ({
      ...e,
      reactions: e.reactions
        .map((r) => ({
          first: r.first
            ? { ...r.first, words: includeWords ? r.first.words : '' }
            : null,
          second: r.second
            ? { ...r.second, words: includeWords ? r.second.words : '' }
            : null,
          note: includeWords ? r.note : '',
        }))
        .filter(
          (r) =>
            r.note ||
            r.first?.feelings.length ||
            r.first?.words ||
            r.second?.feelings.length ||
            r.second?.words,
        ),
    }))
    .filter((e) => e.saved || e.reactions.length);
  const hasWords = evidence.some((e) =>
    e.reactions.some((r) => r.note || r.first?.words || r.second?.words),
  );
  const create = async () => {
    if (busy || !available || !shared.length) return;
    setBusy(true);
    setError('');
    const request = new AbortController();
    controller.current = request;
    const timeout = window.setTimeout(() => request.abort(), 35_000);
    try {
      const response = await fetch('/api/art-profile', {
        method: 'POST',
        signal: request.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evidence: shared }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          response.status === 429
            ? 'AI interpretation is unavailable right now. Your first impressions are still here.'
            : response.status === 503
              ? 'AI profiles aren’t available just yet. Your choices are still here.'
              : 'Your profile couldn’t be created this time. Please try again.',
        );
      }
      if (
        !validArtProfile(
          data.profile,
          new Set(shared.map((e) => e.artworkId)),
          new Set(artworks.map((a) => a.id)),
        ) ||
        typeof data.model !== 'string' ||
        typeof data.createdAt !== 'string'
      )
        throw new Error('Your profile couldn’t be read. Please try again.');
      setResult(data);
      try {
        localStorage.setItem(
          PROFILE_STORAGE_KEY,
          JSON.stringify({ ...data, fingerprint }),
        );
      } catch {
        setStorageFailed(true);
      }
    } catch (e) {
      setError(
        request.signal.aborted
          ? 'This is taking longer than expected. Please try again in a moment.'
          : e instanceof Error
            ? e.message
            : 'Please try again in a moment.',
      );
    } finally {
      window.clearTimeout(timeout);
      setBusy(false);
    }
  };
  const observations = describeEvidence(evidence, artworks);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="gallery-dialog art-profile-dialog">
        <span className="guide-kicker">A little about your eye</span>
        <DialogTitle className="panel-title">
          {result ? result.profile.title : 'Your art profile.'}
        </DialogTitle>
        <DialogDescription>
          {evidence.length
            ? 'Built from the pieces you save and the feelings you share.'
            : 'Save a piece or share a feeling. That’s enough to begin.'}
        </DialogDescription>
        <div
          className="profile-progress"
          aria-label={`${evidence.length} different artworks saved or responded to. Five is a suggestion, not a requirement.`}
        >
          <span className="profile-dots" aria-hidden="true">
            {Array.from({ length: PROFILE_TARGET }, (_, i) => (
              <i key={i} className={i < evidence.length ? 'filled' : ''} />
            ))}
          </span>
          <span>
            {evidence.length} {evidence.length === 1 ? 'artwork' : 'artworks'}
            {evidence.length < PROFILE_TARGET
              ? ' · a beginning'
              : ' · a growing picture'}
          </span>
        </div>
        {!result && evidence.length < PROFILE_TARGET && (
          <p className="profile-small">
            Five gives us more to notice. You can start with fewer.
          </p>
        )}
        {result ? (
          <div className="profile-result">
            <p className="profile-summary">{result.profile.summary}</p>
            {result.profile.observations.map((o, i) => (
              <section className="profile-observation" key={i}>
                <p>{o.text}</p>
                <div className="profile-evidence-links">
                  {o.artworkIds.map((id) => {
                    const a = artworks.find((art) => art.id === id);
                    return a ? (
                      <button key={id} onClick={() => onSelect(id)}>
                        {a.title} <ArrowRight size={12} />
                      </button>
                    ) : null;
                  })}
                </div>
              </section>
            ))}
            {result.profile.recommendations.length > 0 && (
              <section className="profile-recommendations">
                <h2>A few pieces to live with?</h2>
                <p className="profile-small">
                  Ideas to explore for your walls. Your space and preferred size
                  come next.
                </p>
                {result.profile.recommendations.map((r) => {
                  const a = artworks.find((art) => art.id === r.artworkId);
                  return a ? (
                    <button
                      className="profile-artwork"
                      key={a.id}
                      onClick={() => onSelect(a.id)}
                    >
                      <img
                        src={a.image.src}
                        alt=""
                        width="72"
                        height="78"
                        loading="lazy"
                      />
                      <span>
                        <strong>{a.title}</strong>
                        <span>{a.artist}</span>
                        <p>{r.reason}</p>
                      </span>
                      <ArrowRight size={16} />
                    </button>
                  ) : null;
                })}
              </section>
            )}
            <p className="profile-small">
              An AI interpretation of this visit, open to change.{' '}
              {storageFailed
                ? 'Available for this session.'
                : 'Saved in this browser.'}
            </p>
          </div>
        ) : (
          <>
            {evidence.length > 0 && (
              <section className="profile-local-summary">
                <h2>Your first impressions</h2>
                {observations.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <span className="profile-small">
                  From your selections · no AI used
                </span>
              </section>
            )}
            {evidence.length === 0 && (
              <div className="profile-empty">
                <Bookmark aria-hidden="true" />
                <p>
                  No forms to finish.
                  <br />
                  Just follow what catches your eye.
                </p>
              </div>
            )}
            {available && evidence.length > PROFILE_MAX_ARTWORKS && (
              <p className="profile-small">
                The AI profile uses your latest {PROFILE_MAX_ARTWORKS} artworks
                with selections.
              </p>
            )}
            {available && evidence.length > 0 && (
              <div className="profile-consent">
                {hasWords && (
                  <label>
                    <input
                      type="checkbox"
                      checked={includeWords}
                      onChange={(e) => setIncludeWords(e.target.checked)}
                      disabled={busy}
                    />{' '}
                    Include my written reflections
                  </label>
                )}
                <p className="profile-small">
                  Creating a profile sends your saved choices and feelings to
                  Mistral. Written reflections are optional. Your height and
                  guesses stay here.
                </p>
                {!shared.length && (
                  <p className="profile-small">
                    Include your words, save a work, or choose a feeling to
                    create a profile.
                  </p>
                )}
              </div>
            )}
            {available === false && evidence.length > 0 && (
              <output className="profile-small">
                AI interpretation is currently unavailable. This summary updates
                as you explore.
              </output>
            )}
            {error && (
              <p className="profile-error" role="alert">
                {error}
              </p>
            )}
          </>
        )}
        <div className="form-actions profile-actions">
          {!result && evidence.length > 0 && available && (
            <button
              className="primary-button"
              onClick={create}
              disabled={busy || !shared.length}
            >
              {busy ? (
                <>
                  <LoaderCircle className="profile-spinner" /> Creating your
                  profile…
                </>
              ) : (
                <>
                  Create my art profile <ArrowRight />
                </>
              )}
            </button>
          )}
          <button
            className={
              evidence.length && available ? 'text-button' : 'outline-button'
            }
            onClick={onClose}
          >
            Keep exploring <ArrowRight size={15} />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
