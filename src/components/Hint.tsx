/* oxlint-disable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/prefer-tag-over-role -- A focusable, named wrapper lets keyboard users read why its native disabled control is unavailable. */
import { cloneElement, type ComponentProps, type ReactElement } from 'react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

export function Hint({
  label,
  description,
  children,
  disabled = false,
}: {
  label: string;
  description?: string;
  children: ReactElement<{ title?: string }>;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      {disabled ? (
        <TooltipTrigger
          render={
            <span
              className="hint-disabled"
              role="group"
              aria-label={label}
              tabIndex={0}
            />
          }
        >
          {cloneElement(children, { title: undefined })}
        </TooltipTrigger>
      ) : (
        <TooltipTrigger render={cloneElement(children, { title: undefined })} />
      )}
      <TooltipContent className="icon-tooltip" sideOffset={10}>
        <strong>{label}</strong>
        {description && <span>{description}</span>}
      </TooltipContent>
    </Tooltip>
  );
}

export function IconButton({
  hint,
  title,
  disabled,
  onClick,
  ...props
}: ComponentProps<'button'> & { hint?: string }) {
  const label = props['aria-label'] ?? title ?? 'More';
  return (
    <Hint label={label} description={hint}>
      <button
        {...props}
        aria-label={label}
        aria-disabled={disabled || undefined}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
        }}
      />
    </Hint>
  );
}
