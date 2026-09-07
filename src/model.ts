export const feelings = [
  'Amused',
  'Uneasy',
  'Curious',
  'Moved',
  'Calm',
  'Nothing in particular',
] as const;
export type Feeling = (typeof feelings)[number];
export type Stage = 'first' | 'story' | 'second' | 'reflect' | 'saved';
export interface Response {
  feelings: Feeling[];
  words: string;
}
export interface Visit {
  id: string;
  artworkId: string;
  startedAt: string;
  stage: Stage;
  first: Response | null;
  second: Response | null;
  guess: string | null;
  understanding: string | null;
  note: string;
  savedAt: string | null;
  leftAt: string | null;
}
export interface GalleryState {
  version: 1;
  onboarded: boolean;
  guideSeen: boolean;
  heightCm: number | null;
  units: 'cm' | 'ft';
  current: Visit;
  visits: Visit[];
  savedIds: string[];
}
export const emptyResponse = (): Response => ({ feelings: [], words: '' });
export const hasResponse = (r: Response | null): boolean =>
  !!r && (r.feelings.length > 0 || !!r.words.trim());
export const cleanResponse = (r: Response | null): Response | null =>
  hasResponse(r)
    ? { feelings: [...r!.feelings], words: r!.words.trim() }
    : null;
export function toggleFeeling(r: Response | null, f: Feeling): Response {
  const answer = r ?? emptyResponse();
  const selected = answer.feelings.includes(f);
  return {
    ...answer,
    feelings: selected
      ? answer.feelings.filter((x) => x !== f)
      : f === 'Nothing in particular'
        ? [f]
        : [...answer.feelings.filter((x) => x !== 'Nothing in particular'), f],
  };
}
export function newVisit(artworkId: string): Visit {
  return {
    id: crypto.randomUUID(),
    artworkId,
    startedAt: new Date().toISOString(),
    stage: 'first',
    first: null,
    second: null,
    guess: null,
    understanding: null,
    note: '',
    savedAt: null,
    leftAt: null,
  };
}
export function initialState(id: string): GalleryState {
  return {
    version: 1,
    onboarded: false,
    guideSeen: false,
    heightCm: null,
    units: 'cm',
    current: newVisit(id),
    visits: [],
    savedIds: [],
  };
}
export type Action =
  | { type: 'guide-seen'; begin?: boolean }
  | { type: 'first'; response: Response }
  | { type: 'second'; response: Response }
  | { type: 'guess'; value: string }
  | { type: 'discover'; skip?: boolean }
  | { type: 'look-again' }
  | { type: 'reflect'; skip?: boolean }
  | { type: 'same' }
  | { type: 'note'; value: string }
  | { type: 'understanding'; value: string | null }
  | { type: 'save-reflection' }
  | { type: 'next'; artworkId: string }
  | { type: 'bookmark'; artworkId: string }
  | { type: 'height'; heightCm: number | null; units: 'cm' | 'ft' }
  | {
      type: 'begin';
      artworkId?: string;
      heightCm?: number | null;
      units?: 'cm' | 'ft';
    };
export function reducer(state: GalleryState, action: Action): GalleryState {
  const v = state.current;
  const update = (patch: Partial<Visit>): GalleryState => ({
    ...state,
    current: { ...v, ...patch },
  });
  switch (action.type) {
    case 'guide-seen':
      return {
        ...state,
        guideSeen: true,
        onboarded: state.onboarded || !!action.begin,
      };
    case 'first':
      return v.stage === 'first' ? update({ first: action.response }) : state;
    case 'second':
      return v.stage === 'second' ? update({ second: action.response }) : state;
    case 'guess':
      return v.stage === 'first' ? update({ guess: action.value }) : state;
    case 'discover':
      return v.stage === 'first'
        ? update({
            stage: 'story',
            first: action.skip ? null : cleanResponse(v.first),
          })
        : state;
    case 'look-again':
      return v.stage === 'story'
        ? update({ stage: 'second', second: null })
        : state;
    case 'same':
      return v.stage === 'second' && hasResponse(v.first)
        ? update({
            second: { feelings: [...v.first!.feelings], words: v.first!.words },
          })
        : state;
    case 'reflect':
      return v.stage === 'second'
        ? update({
            stage: 'reflect',
            second: action.skip ? null : cleanResponse(v.second),
          })
        : state;
    case 'note':
      return v.stage === 'reflect' ? update({ note: action.value }) : state;
    case 'understanding':
      return v.stage === 'reflect'
        ? update({ understanding: action.value })
        : state;
    case 'save-reflection': {
      if (v.stage !== 'reflect') return state;
      const saved = {
        ...v,
        stage: 'saved' as const,
        note: v.note.trim(),
        savedAt: new Date().toISOString(),
      };
      return {
        ...state,
        current: saved,
        visits: [...state.visits.filter((x) => x.id !== v.id), saved],
      };
    }
    case 'next': {
      const previous = { ...v, leftAt: new Date().toISOString() };
      return {
        ...state,
        current: newVisit(action.artworkId),
        visits: [...state.visits.filter((x) => x.id !== v.id), previous],
      };
    }
    case 'bookmark':
      return {
        ...state,
        savedIds: state.savedIds.includes(action.artworkId)
          ? state.savedIds.filter((x) => x !== action.artworkId)
          : [...state.savedIds, action.artworkId],
      };
    case 'height':
      return { ...state, heightCm: action.heightCm, units: action.units };
    case 'begin':
      return {
        ...state,
        onboarded: true,
        current:
          action.artworkId && !state.onboarded
            ? newVisit(action.artworkId)
            : state.current,
        heightCm: action.heightCm ?? null,
        units: action.units ?? state.units,
      };
  }
}
export function responseText(r: Response | null): string {
  return hasResponse(r)
    ? [...r!.feelings, r!.words].filter(Boolean).join(' · ')
    : 'Not recorded';
}
export function fitScale(
  widthCm: number,
  heightCm: number,
  personCm: number,
  availableWidth: number,
  availableHeight: number,
) {
  const personWidth = personCm * 0.28,
    gapCm = personCm * 0.2;
  const scale = Math.max(
    0,
    Math.min(
      availableWidth / (widthCm + personWidth + gapCm),
      availableHeight / Math.max(heightCm, personCm),
    ),
  );
  return {
    scale,
    artWidth: widthCm * scale,
    artHeight: heightCm * scale,
    personHeight: personCm * scale,
    personWidth: personWidth * scale,
    gap: gapCm * scale,
  };
}
export const STORAGE_KEY = 'second-look:v1';
function validResponse(r: unknown): boolean {
  if (r === null) return true;
  if (!r || typeof r !== 'object') return false;
  const a = r as Response;
  return (
    Array.isArray(a.feelings) &&
    a.feelings.every((f) => feelings.includes(f)) &&
    typeof a.words === 'string' &&
    !(a.feelings.includes('Nothing in particular') && a.feelings.length > 1)
  );
}
function validVisit(v: unknown, ids: string[]): v is Visit {
  if (!v || typeof v !== 'object') return false;
  const a = v as Visit;
  return (
    typeof a.id === 'string' &&
    ids.includes(a.artworkId) &&
    ['first', 'story', 'second', 'reflect', 'saved'].includes(a.stage) &&
    validResponse(a.first) &&
    validResponse(a.second) &&
    typeof a.note === 'string' &&
    typeof a.startedAt === 'string' &&
    (a.guess === null || typeof a.guess === 'string') &&
    (a.understanding === null || typeof a.understanding === 'string') &&
    (a.savedAt === null || typeof a.savedAt === 'string') &&
    (a.leftAt === null || typeof a.leftAt === 'string')
  );
}
export function readState(
  storage: Pick<Storage, 'getItem'>,
  ids: string[],
): GalleryState | null {
  try {
    const s = JSON.parse(
      storage.getItem(STORAGE_KEY) ?? 'null',
    ) as GalleryState | null;
    if (
      !s ||
      s.version !== 1 ||
      typeof s.onboarded !== 'boolean' ||
      !(
        s.heightCm === null ||
        (Number.isFinite(s.heightCm) && s.heightCm >= 40 && s.heightCm <= 260)
      ) ||
      !['cm', 'ft'].includes(s.units) ||
      !validVisit(s.current, ids) ||
      !Array.isArray(s.visits) ||
      !s.visits.every((v) => validVisit(v, ids)) ||
      !Array.isArray(s.savedIds) ||
      !s.savedIds.every((id) => typeof id === 'string')
    )
      return null;
    return {
      ...s,
      guideSeen: s.guideSeen === true,
      savedIds: s.savedIds.filter((id) => ids.includes(id)),
    };
  } catch {
    return null;
  }
}
