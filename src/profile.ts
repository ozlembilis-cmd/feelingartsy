import { hasResponse, type GalleryState, type Response } from './model.ts';
import type { Artwork } from './content/types.ts';

export const PROFILE_TARGET = 5;
export const PROFILE_STORAGE_KEY = 'feeling-artsy:profile:v1';
export const PROFILE_MAX_ARTWORKS = 20;

export interface ProfileReaction {
  first: Response | null;
  second: Response | null;
  note: string;
}
export interface ProfileEvidence {
  artworkId: string;
  saved: boolean;
  reactions: ProfileReaction[];
}
export interface ArtProfile {
  title: string;
  summary: string;
  observations: { text: string; artworkIds: string[] }[];
  recommendations: { artworkId: string; reason: string }[];
}
export interface ProfileResult {
  profile: ArtProfile;
  model: string;
  createdAt: string;
}

const trimResponse = (response: Response | null): Response | null =>
  hasResponse(response)
    ? {
        feelings: [...response!.feelings],
        words: response!.words.trim().slice(0, 400),
      }
    : null;

// A work counts once. Guesses, page views, height, and skipped drafts do not
// establish taste. The current visit replaces its persisted copy by visit ID.
export function collectProfileEvidence(
  state: GalleryState,
  catalog: Artwork[],
): ProfileEvidence[] {
  const known = new Set(catalog.map((a) => a.id));
  const evidence = new Map<string, ProfileEvidence>();
  for (const id of state.savedIds) {
    if (known.has(id))
      evidence.set(id, { artworkId: id, saved: true, reactions: [] });
  }
  const visits = new Map(state.visits.map((v) => [v.id, v]));
  visits.set(state.current.id, state.current);
  for (const visit of visits.values()) {
    if (!known.has(visit.artworkId)) continue;
    const reaction = {
      first: trimResponse(visit.first),
      second: trimResponse(visit.second),
      note: visit.note.trim().slice(0, 400),
    };
    if (!reaction.first && !reaction.second && !reaction.note) continue;
    const entry = evidence.get(visit.artworkId) ?? {
      artworkId: visit.artworkId,
      saved: false,
      reactions: [],
    };
    entry.reactions.push(reaction);
    // Recent responses retain before/after context while keeping requests small.
    entry.reactions = entry.reactions.slice(-2);
    evidence.delete(visit.artworkId);
    evidence.set(visit.artworkId, entry);
  }
  return [...evidence.values()];
}

export function profileFingerprint(evidence: ProfileEvidence[]): string {
  return JSON.stringify(evidence);
}

export function describeEvidence(
  evidence: ProfileEvidence[],
  catalog: Artwork[],
): string[] {
  const saved = evidence.filter((e) => e.saved);
  const summary: string[] = [];
  if (saved.length)
    summary.push(
      `You saved ${saved.length === 1 ? 'one artwork' : `${saved.length} artworks`} to return to.`,
    );
  const reactions = new Map<string, number>();
  for (const entry of evidence) {
    const selected = new Set(
      entry.reactions.flatMap((r) => [
        ...(r.first?.feelings ?? []),
        ...(r.second?.feelings ?? []),
      ]),
    );
    for (const feeling of selected)
      reactions.set(feeling, (reactions.get(feeling) ?? 0) + 1);
  }
  const most = [...reactions].sort((a, b) => b[1] - a[1])[0];
  if (most)
    summary.push(
      `You chose “${most[0]}” for ${most[1] === 1 ? 'one artwork' : `${most[1]} artworks`}.`,
    );
  const artists = new Map<string, number>();
  for (const entry of saved) {
    const artist = catalog.find((a) => a.id === entry.artworkId)?.artist;
    if (artist && !/unknown|anonymous|unidentified/i.test(artist))
      artists.set(artist, (artists.get(artist) ?? 0) + 1);
  }
  const repeated = [...artists].sort((a, b) => b[1] - a[1])[0];
  if (repeated && repeated[1] > 1)
    summary.push(`${repeated[1]} of your saved works are by ${repeated[0]}.`);
  if (!summary.length && evidence.length)
    summary.push('Your own words are a starting point for your profile.');
  return summary;
}

// Candidate matching uses known catalogue metadata. The model may only choose
// IDs from this shortlist; it never supplies artwork names, images, or links.
export function profileCandidates(
  evidence: ProfileEvidence[],
  catalog: Artwork[],
): Artwork[] {
  const seen = new Set(evidence.map((e) => e.artworkId));
  const reference = evidence.flatMap((e) => {
    const artwork = catalog.find((a) => a.id === e.artworkId);
    return artwork ? [{ artwork, weight: e.saved ? 2 : 1 }] : [];
  });
  const meaningful = (value: string) =>
    value && !/^(unknown|various|not specified|n\/a)$/i.test(value);
  const scores = catalog
    .filter((a) => !seen.has(a.id))
    .map((artwork) => ({
      artwork,
      score: reference.reduce(
        (score, r) =>
          score +
          r.weight *
            ((meaningful(artwork.artist) && artwork.artist === r.artwork.artist
              ? 4
              : 0) +
              (meaningful(artwork.period) && artwork.period === r.artwork.period
                ? 2
                : 0) +
              (meaningful(artwork.culture) &&
              artwork.culture === r.artwork.culture
                ? 1
                : 0)),
        0,
      ),
    }));
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((a) => a.artwork);
}

export function validArtProfile(
  value: unknown,
  evidenceIds: Set<string>,
  candidateIds: Set<string>,
): value is ArtProfile {
  if (!value || typeof value !== 'object') return false;
  const p = value as ArtProfile;
  const text = (v: unknown, max: number): v is string =>
    typeof v === 'string' && !!v.trim() && v.length <= max;
  if (
    !text(p.title, 90) ||
    !text(p.summary, 900) ||
    !Array.isArray(p.observations) ||
    p.observations.length > 3 ||
    !p.observations.length ||
    !Array.isArray(p.recommendations) ||
    p.recommendations.length > 3
  )
    return false;
  if (
    !p.observations.every(
      (o) =>
        o &&
        text(o.text, 450) &&
        Array.isArray(o.artworkIds) &&
        o.artworkIds.length > 0 &&
        o.artworkIds.length <= 3 &&
        o.artworkIds.every((id) => evidenceIds.has(id)),
    )
  )
    return false;
  return (
    new Set(p.recommendations.map((r) => r?.artworkId)).size ===
      p.recommendations.length &&
    p.recommendations.every(
      (r) => r && candidateIds.has(r.artworkId) && text(r.reason, 450),
    )
  );
}
