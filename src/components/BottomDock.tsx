import { IconButton } from './Hint';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  PencilLine,
  BookOpen,
  MessageCircle,
  SkipForward,
  CircleHelp,
  Smile,
  Activity,
  Search,
  Heart,
  Waves,
  CircleMinus,
} from 'lucide-react';
import type { Artwork } from '../content/types';
import {
  feelings,
  toggleFeeling,
  emptyResponse,
  hasResponse,
  responseText,
  type Response,
  type Visit,
  type Action,
} from '../model';
const feelingIcons = [Smile, Activity, Search, Heart, Waves, CircleMinus];
export function ReactionControls({
  value,
  onChange,
}: {
  value: Response | null;
  onChange: (v: Response) => void;
}) {
  return (
    <fieldset
      className="reaction-chips"
      aria-label="Feelings, choose any that fit"
    >
      {feelings.map((f, i) => {
        const Icon = feelingIcons[i];
        return (
          <button
            key={f}
            aria-pressed={value?.feelings.includes(f) ?? false}
            onClick={() => onChange(toggleFeeling(value, f))}
          >
            <Icon aria-hidden="true" /> {f}
          </button>
        );
      })}
    </fieldset>
  );
}
export function ReflectionComparison({ visit }: { visit: Visit }) {
  return (
    <dl className="comparison">
      <div>
        <dt>At first</dt>
        <dd>{responseText(visit.first)}</dd>
      </div>
      <div>
        <dt>Now</dt>
        <dd>{responseText(visit.second)}</dd>
      </div>
      {visit.understanding && (
        <div>
          <dt>Your perspective</dt>
          <dd>{visit.understanding}</dd>
        </div>
      )}
      {visit.note && (
        <div>
          <dt>Your note</dt>
          <dd>{visit.note}</dd>
        </div>
      )}
    </dl>
  );
}
export function StorySheet({
  artwork,
  guess,
  onAgain,
  onNext,
  onSources,
}: {
  artwork: Artwork;
  guess: string | null;
  onAgain: () => void;
  onNext: () => void;
  onSources: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section className="bottom-dock story-sheet" aria-label="The story">
      <div className="story-title">
        <h1 tabIndex={-1} ref={heading}>
          {artwork.title}
        </h1>
        <p>
          {artwork.artist} <span>·</span> {artwork.date}
        </p>
        <div className="story-links">
          <button className="text-button" onClick={onSources}>
            Sources <ArrowUpRight size={14} />
          </button>
          <details>
            <summary>Read more</summary>
            <div className="read-more">
              <p>
                {artwork.medium} · {artwork.collection}
              </p>
              {artwork.story.more && <p>{artwork.story.more}</p>}
              <p>
                {artwork.period} · {artwork.culture}
              </p>
              {artwork.dimensions ? (
                <p>
                  {artwork.dimensions.widthCm} × {artwork.dimensions.heightCm}{' '}
                  cm (width × height)
                </p>
              ) : (
                <p>Size comparison unavailable for this image.</p>
              )}
              <p>
                Context offers one way into a painting. Your response can be
                different.
              </p>
              <a href={artwork.sources[0].url} target="_blank" rel="noreferrer">
                Continue at the museum ↗
              </a>
            </div>
          </details>
        </div>
        {guess && (
          <p className="guess-reveal">
            {guess === 'I already know this work'
              ? 'You already knew this work.'
              : guess === 'Not sure'
                ? 'You left the attribution open.'
                : `You wondered about ${guess}.`}
            <br />
            Attributed to {artwork.artist}.
          </p>
        )}
      </div>
      <div className="story-sections">
        {[
          ['Behind the painting', artwork.story.behind],
          ['Why it matters', artwork.story.matters],
          ['Look closer', artwork.story.closer],
        ].map(([label, text]) => (
          <section key={label}>
            <h2>{label}</h2>
            <p>{text}</p>
          </section>
        ))}
      </div>
      <div className="dock-actions">
        <button className="primary-button" onClick={onAgain}>
          Look again <ArrowRight />
        </button>
        <IconButton
          className="text-button next-button icon-control"
          aria-label="Next artwork"
          hint="Move on whenever you like."
          title="Next artwork"
          onClick={onNext}
        >
          <ArrowRight />
        </IconButton>
      </div>
    </section>
  );
}
export function BottomDock({
  visit,
  artwork,
  dispatch,
  onNext,
  saved,
  onSources,
}: {
  visit: Visit;
  artwork: Artwork;
  dispatch: (a: Action) => void;
  onNext: () => void;
  saved: boolean;
  onSources: () => void;
}) {
  const [own, setOwn] = useState(false),
    [guessOpen, setGuessOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [visit.stage, visit.id]);
  const first = visit.stage === 'first',
    answer = first ? visit.first : visit.second;
  if (visit.stage === 'story')
    return (
      <StorySheet
        artwork={artwork}
        guess={visit.guess}
        onAgain={() => dispatch({ type: 'look-again' })}
        onNext={onNext}
        onSources={onSources}
      />
    );
  const next = (
    <IconButton
      className="text-button next-button icon-control"
      aria-label="Next artwork"
      hint="Move on whenever you like."
      title="Next artwork"
      onClick={onNext}
    >
      <ArrowRight />
    </IconButton>
  );
  if (visit.stage === 'saved')
    return (
      <section className="bottom-dock saved-dock">
        <div className="dock-question">
          <h1 tabIndex={-1} ref={heading}>
            A moment, kept.
          </h1>
          <p>Saved in this browser.</p>
        </div>
        <ReflectionComparison visit={visit} />
        <div className="dock-actions">
          <button
            className="outline-button"
            aria-pressed={saved}
            onClick={() =>
              dispatch({ type: 'bookmark', artworkId: artwork.id })
            }
          >
            {saved ? <Check /> : <Bookmark />}
            {saved ? 'In your collection' : 'Save to my collection'}
          </button>
          {next}
        </div>
      </section>
    );
  if (visit.stage === 'reflect')
    return (
      <section className="bottom-dock reflection-dock">
        <div className="dock-question">
          <h1 tabIndex={-1} ref={heading}>
            Did anything change?
          </h1>
        </div>
        <div className="reflection-fields">
          <fieldset
            className="understanding-options"
            aria-label="Change in perspective"
          >
            {[
              'I see it differently',
              'I understand more, but feel the same',
              'Nothing changed',
            ].map((v) => (
              <button
                key={v}
                aria-pressed={visit.understanding === v}
                onClick={() =>
                  dispatch({
                    type: 'understanding',
                    value: visit.understanding === v ? null : v,
                  })
                }
              >
                {v}
              </button>
            ))}
          </fieldset>
          <label className="sr-only" htmlFor="reflection-note">
            What stands out now?
          </label>
          <textarea
            id="reflection-note"
            rows={2}
            maxLength={1500}
            placeholder="What stands out now?"
            value={visit.note}
            onChange={(e) => dispatch({ type: 'note', value: e.target.value })}
          />
        </div>
        <div className="dock-actions">
          <button
            className="primary-button"
            onClick={() => dispatch({ type: 'save-reflection' })}
          >
            Save reflection <ArrowRight />
          </button>
          {next}
        </div>
      </section>
    );
  return (
    <section className="bottom-dock">
      <div className="dock-question">
        <h1 tabIndex={-1} ref={heading}>
          {first ? 'First feeling?' : 'And now?'}
        </h1>
      </div>
      <div className="reaction-area">
        <ReactionControls
          value={answer}
          onChange={(response) =>
            dispatch({ type: first ? 'first' : 'second', response })
          }
        />
        <div className="reaction-secondary">
          <IconButton
            className="text-button"
            title="My own words"
            aria-label="My own words"
            hint="Write your reaction in your own words."
            aria-expanded={own}
            onClick={() => setOwn((o) => !o)}
          >
            <PencilLine size={14} />
          </IconButton>

          {first && artwork.artistChoices.length > 0 ? (
            <IconButton
              className="text-button"
              title="Guess the artist?"
              aria-label="Guess the artist?"
              hint="An optional guess. There’s no score."
              aria-expanded={guessOpen}
              onClick={() => setGuessOpen((g) => !g)}
            >
              <CircleHelp />
            </IconButton>
          ) : !first && hasResponse(visit.first) ? (
            <button
              className="text-button"
              onClick={() => dispatch({ type: 'same' })}
            >
              I feel the same
            </button>
          ) : null}
          <IconButton
            className="text-button skip"
            title="Skip response"
            aria-label="Skip response"
            hint="Continue without recording a response."
            onClick={() =>
              dispatch({ type: first ? 'discover' : 'reflect', skip: true })
            }
          >
            <SkipForward />
          </IconButton>
        </div>
        {own && (
          <div className="own-words">
            <label className="sr-only" htmlFor="own-words">
              Your reaction in your own words
            </label>
            <textarea
              id="own-words"
              rows={2}
              maxLength={500}
              placeholder="Whatever comes to mind…"
              value={answer?.words ?? ''}
              onChange={(e) =>
                dispatch({
                  type: first ? 'first' : 'second',
                  response: {
                    ...(answer ?? emptyResponse()),
                    words: e.target.value,
                  },
                })
              }
            />
          </div>
        )}
        {first && guessOpen && (
          <fieldset className="artist-guess">
            <legend>An optional thought. No scores.</legend>
            {[
              ...artwork.artistChoices,
              'Not sure',
              'I already know this work',
            ].map((name) => (
              <label key={name}>
                <input
                  type="radio"
                  name="artist-guess"
                  checked={visit.guess === name}
                  onChange={() => dispatch({ type: 'guess', value: name })}
                />
                {name}
              </label>
            ))}
          </fieldset>
        )}
      </div>
      <div className="dock-actions">
        <IconButton
          className="primary-button primary-icon"
          title={first ? 'Discover the story' : 'Reflect for a moment'}
          aria-label={first ? 'Discover the story' : 'Reflect for a moment'}
          hint={
            first
              ? 'Read what’s behind this painting.'
              : 'Leave a note about what stands out now.'
          }
          onClick={() => dispatch({ type: first ? 'discover' : 'reflect' })}
        >
          {first ? <BookOpen /> : <MessageCircle />}
        </IconButton>
        {next}
      </div>
    </section>
  );
}
