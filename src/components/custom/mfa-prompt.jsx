import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

/**
 * The ClassLink two-factor prompt, shown when a `classlinkCredentials` login
 * returns `{ mfaRequired: true }`. Two variants:
 *   - `pin`   : a numeric entry.
 *   - `image` : a grid of candidate icons; clicking one submits its filename.
 *
 * Rendered as a centered modal overlay (the login page forces light mode, so the
 * default shadcn tokens read correctly here).
 */
export default function MfaPrompt({
  open,
  mfaType,
  icons = [],
  loading = false,
  error = null,
  onSubmit,
  onCancel,
}) {
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (open) setPin('');
  }, [open, mfaType]);

  if (!open) return null;

  const canSubmitPin = !loading && pin.length >= 4;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-lg">
        <h2 className="text-center text-lg font-semibold text-black">Two-Factor Verification</h2>
        <p className="mt-1 text-center text-sm text-black/60">
          {mfaType === 'pin'
            ? 'Enter your ClassLink PIN to continue.'
            : 'Select your secret ClassLink image to continue.'}
        </p>

        {error && <p className="mt-3 text-center text-sm text-red-500">{error}</p>}

        {mfaType === 'pin' ? (
          <form
            className="mt-4 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (canSubmitPin) onSubmit(pin);
            }}
          >
            <Input
              type="password"
              inputMode="numeric"
              autoFocus
              disabled={loading}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="Enter PIN"
              className="text-center text-lg tracking-[6px]"
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled={loading} onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={!canSubmitPin}>
                {loading && <Spinner />}
                Verify
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-4">
            <div className="grid max-h-[340px] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
              {icons.map((icon) => (
                <button
                  key={icon.id}
                  type="button"
                  disabled={loading}
                  onClick={() => onSubmit(icon.name)}
                  className="flex flex-col items-center gap-1 rounded-xl border bg-black/[0.02] p-2 transition hover:bg-black/[0.06] disabled:opacity-50"
                >
                  <img src={icon.imageUrl} alt={icon.short_name} className="h-11 w-11 object-contain" />
                  <span className="w-full truncate text-center text-[11px] text-black/60">
                    {icon.short_name}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              {loading && <Spinner />}
              <Button type="button" variant="outline" disabled={loading} onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
