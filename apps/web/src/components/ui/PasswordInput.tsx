import { useState, type InputHTMLAttributes } from 'react';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

/** A password <input> with a show/hide toggle -- typos are easy to make on
 * a masked field, especially on a phone's on-screen keyboard, and this is
 * the standard way to let someone check what they typed before submitting. */
export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-input-group">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}
