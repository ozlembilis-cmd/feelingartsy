import {
  Heart,
  CircleHelp,
  BookOpen,
  Ruler,
  ArrowRight,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { IconButton } from './Hint';

export function HowItWorks({
  open,
  onDismiss,
  onStart,
  onHeight,
}: {
  open: boolean;
  onDismiss: () => void;
  onStart: () => void;
  onHeight: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onDismiss();
      }}
    >
      <DialogContent
        className="gallery-dialog how-dialog"
        showCloseButton={false}
      >
        <IconButton
          className="icon-control guide-close"
          aria-label="Close guide"
          onClick={onDismiss}
        >
          <X />
        </IconButton>
        <span className="guide-kicker">How it works</span>
        <DialogTitle className="panel-title">
          No art knowledge needed.
          <br />
          Just curiosity.
        </DialogTitle>
        <DialogDescription>
          Take a moment with each painting. There are no right answers, and
          everything is optional.
        </DialogDescription>
        <div className="guide-steps">
          <div>
            <Heart aria-hidden="true" />
            <section>
              <h2>Notice what you feel</h2>
              <p>
                Choose a feeling or use your own words. Feeling nothing counts,
                too.
              </p>
            </section>
          </div>
          <div>
            <CircleHelp aria-hidden="true" />
            <section>
              <h2>Guess the artist</h2>
              <p>Take a guess if you like. There’s no score.</p>
            </section>
          </div>
          <div>
            <BookOpen aria-hidden="true" />
            <section>
              <h2>Discover the story</h2>
              <p>Find out what’s behind the painting, then look again.</p>
            </section>
          </div>
          <div>
            <Ruler aria-hidden="true" />
            <section>
              <h2>See its size beside you</h2>
              <p>
                Add your height to compare proportions using the artwork’s
                dimensions.
              </p>
              <button className="guide-height text-button" onClick={onHeight}>
                Add your height <ArrowRight />
              </button>
            </section>
          </div>
        </div>
        <p className="guide-size-note">
          Size comparisons show proportions, not actual size on your screen.
        </p>
        <button className="primary-button guide-start" onClick={onStart}>
          Let’s look <ArrowRight />
        </button>
      </DialogContent>
    </Dialog>
  );
}
