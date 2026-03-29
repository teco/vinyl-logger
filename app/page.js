'use client';

import { useState, useRef, useCallback } from 'react';

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const c = {
  bg:        '#0B1120',
  surface:   '#1e2d42',
  border:    '#2a3f5c',
  text:      '#F1F5F9',
  muted:     '#7a9bb5',
  accent:    '#5ce0d6',
  accentDim: '#0d2a35',
  gold:      '#e0a050',
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${c.bg}; font-family: 'Inter', sans-serif; }
  input, button { font-family: 'Inter', sans-serif; }
  input::placeholder { color: ${c.border}; }
  input:focus { outline: none; }
  @keyframes spin  { to { transform: rotate(360deg); } }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
  .drop-zone:hover  { border-color: ${c.accent} !important; }
  .btn-primary:hover   { opacity: .82; }
  .btn-secondary:hover { border-color: ${c.muted} !important; color: ${c.text} !important; }
  .format-btn:hover { border-color: ${c.accent} !important; }
`;

const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
      color: c.muted, fontWeight: 500 }}>
      {label}
    </span>
    {children}
  </div>
);

const Spinner = () => (
  <div style={{ width: 28, height: 28, border: `1px solid ${c.border}`,
    borderTop: `1px solid ${c.accent}`, borderRadius: '50%',
    animation: 'spin .8s linear infinite', margin: '0 auto' }} />
);

const Dot = () => (
  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
    background: c.accent, animation: 'blink 1.2s ease-in-out infinite',
    marginRight: 8, verticalAlign: 'middle' }} />
);

const Header = () => (
  <div style={{ width: '100%', borderBottom: `1px solid ${c.border}`,
    padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.accent, display: 'inline-block' }} />
      <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: c.muted, fontWeight: 500 }}>
        Vinyl Logger
      </span>
    </div>
    <span style={{ fontSize: 10, color: c.muted }}>Personal OS</span>
  </div>
);

function PasswordGate({ onUnlock }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const attempt = () => {
    if (value === process.env.NEXT_PUBLIC_APP_PASSWORD) {
      onUnlock();
    } else {
      setError(true);
      setValue('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: c.bg, display: 'flex',
      flexDirection: 'column', alignItems: 'center' }}>
      <Header />
      <div style={{ width: '100%', maxWidth: 400, padding: '80px 24px' }}>
        <div style={{ fontSize: 22, fontWeight: 300, color: c.text, marginBottom: 32 }}>
          Access
        </div>
        <input
          type="password"
          placeholder="Password"
          value={value}
          onChange={e => { setValue(e.target.value); setError(false); }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          style={{ background: 'transparent', border: 'none',
            borderBottom: `1px solid ${error ? c.gold : c.border}`,
            color: c.text, fontSize: 14, padding: '8px 0',
            width: '100%', marginBottom: 24 }}
        />
        {error && (
          <div style={{ fontSize: 12, color: c.gold, marginBottom: 16 }}>
            Incorrect password.
          </div>
        )}
        <button onClick={attempt} style={{
          width: '100%', padding: '13px', background: c.accent, color: c.bg,
          border: 'none', borderRadius: 2, fontSize: 12, letterSpacing: '0.1em',
          textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer',
        }}>
          Enter
        </button>
      </div>
    </div>
  );
}

function VinylLogger() {
  const [phase, setPhase]     = useState('idle');
  const [preview, setPreview] = useState(null);
  const [form, setForm]       = useState({ title: '', artist: '', format: 'LP' });
  const [genres, setGenres]   = useState('');
  const [errMsg, setErrMsg]   = useState('');
  const fileRef = useRef(null);

  const toB64 = file => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

  const scan = async file => {
    if (!file) return;
    const mimeType = SUPPORTED_TYPES.includes(file.type) ? file.type : 'image/jpeg';
    setPreview(URL.createObjectURL(file));
    setGenres('');
    setPhase('scanning');

    try {
      const image = await toB64(file);
      const res   = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, mimeType }),
      });
      const result = await res.json();

      if (result.confidence === 'low' || !result.title) {
        setForm({ title: '', artist: '', format: 'LP' });
        setPhase('fallback');
      } else {
        setForm({ title: result.title, artist: result.artist || '',
          format: result.format === 'CD' ? 'CD' : 'LP' });
        setPhase('confirm');
      }
    } catch {
      setForm({ title: '', artist: '', format: 'LP' });
      setPhase('fallback');
    }
  };

  const handleDrop = useCallback(e => {
    e.preventDefault();
    scan(e.dataTransfer.files[0]);
  }, []);

  const logToNotion = async () => {
    if (!form.title.trim() || !form.artist.trim()) return;
    setPhase('logging');
    try {
      const res = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, genres }),
      });
      const data = await res.json();
      if (data.ok) {
        setPhase('success');
      } else {
        throw new Error(data.error || 'unknown');
      }
    } catch {
      setErrMsg('Could not write to Notion. Check your connection and try again.');
      setPhase('error');
    }
  };

  const reset = () => {
    setPhase('idle'); setPreview(null);
    setForm({ title: '', artist: '', format: 'LP' });
    setGenres(''); setErrMsg('');
  };

  const canSubmit = form.title.trim() && form.artist.trim();

  const inputStyle = {
    background: 'transparent', border: 'none',
    borderBottom: `1px solid ${c.border}`,
    color: c.text, fontSize: 14, padding: '8px 0', width: '100%',
  };

  const titleInputStyle = {
    ...inputStyle,
    fontSize: 22, fontWeight: 300,
  };

  const fmtBtn = active => ({
    padding: '6px 18px',
    border: `1px solid ${active ? c.accent : c.border}`,
    background: active ? c.accentDim : 'transparent',
    color: active ? c.accent : c.muted,
    fontSize: 12, fontWeight: 500,
    letterSpacing: '0.08em', cursor: 'pointer', borderRadius: 2, transition: 'all .15s',
  });

  const FormFields = () => (
    <>
      <Field label="Title">
        <input style={titleInputStyle} value={form.title} placeholder="Album title"
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
      </Field>
      <Field label="Artist">
        <input style={inputStyle} value={form.artist} placeholder="Artist name"
          onChange={e => setForm(p => ({ ...p, artist: e.target.value }))} />
      </Field>
      <Field label="Format">
        <div style={{ display: 'flex', gap: 8 }}>
          {['LP', 'CD'].map(f => (
            <button key={f} className="format-btn" style={fmtBtn(form.format === f)}
              onClick={() => setForm(p => ({ ...p, format: f }))}>
              {f}
            </button>
          ))}
        </div>
      </Field>
      <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 20 }}>
        <Field label="Genre">
          <input style={inputStyle} value={genres} placeholder="e.g. Rock, Folk"
            onChange={e => setGenres(e.target.value)} />
        </Field>
      </div>
    </>
  );

  const Notice = ({ text }) => (
    <div style={{ background: c.surface, border: `1px solid ${c.border}`,
      borderLeft: `2px solid ${c.accent}`, padding: '10px 14px', borderRadius: 2,
      fontSize: 12, color: c.muted, lineHeight: 1.6, marginBottom: 24 }}>
      {text}
    </div>
  );

  const PrimaryBtn = ({ label, onClick, disabled }) => (
    <button className="btn-primary" disabled={disabled} onClick={onClick} style={{
      width: '100%', marginTop: 28, padding: '13px', background: c.accent, color: c.bg,
      border: 'none', borderRadius: 2, fontSize: 12, letterSpacing: '0.1em',
      textTransform: 'uppercase', fontWeight: 500,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.35 : 1, transition: 'opacity .15s',
    }}>{label}</button>
  );

  const SecondaryBtn = ({ label, onClick }) => (
    <button className="btn-secondary" onClick={onClick} style={{
      width: '100%', marginTop: 10, padding: '11px', background: 'transparent',
      color: c.muted, border: `1px solid ${c.border}`, borderRadius: 2,
      fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
      cursor: 'pointer', transition: 'all .15s',
    }}>{label}</button>
  );

  return (
    <div style={{ minHeight: '100vh', background: c.bg, color: c.text,
      display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Header />
      <div style={{ width: '100%', maxWidth: 400, padding: '32px 24px 48px' }}>

        {phase === 'idle' && (
          <>
            <div className="drop-zone" style={{
              border: `1px dashed ${c.border}`, borderRadius: 3, padding: '52px 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
              cursor: 'pointer', transition: 'border-color .2s', textAlign: 'center',
            }}
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              <div style={{ width: 52, height: 52, borderRadius: '50%',
                border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 22, color: c.muted }}>
                ⬡
              </div>
              <div>
                <div style={{ fontSize: 14, color: c.text, marginBottom: 6 }}>Photograph a cover</div>
                <div style={{ fontSize: 11, color: c.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  or drag & drop
                </div>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*"
              style={{ display: 'none' }}
              onChange={e => scan(e.target.files[0])} />
          </>
        )}

        {phase === 'scanning' && (
          <>
            {preview && <img src={preview} alt="cover"
              style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 2, display: 'block' }} />}
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <div style={{ fontSize: 12, color: c.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                <Dot />Identifying cover...
              </div>
            </div>
          </>
        )}

        {phase === 'confirm' && (
          <>
            {preview && <img src={preview} alt="cover"
              style={{ width: '100%', aspectRatio: '1', objectFit: 'cover',
                borderRadius: 2, display: 'block', marginBottom: 28 }} />}
            <Notice text="Identified — confirm or correct before logging." />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}><FormFields /></div>
            <PrimaryBtn label="Log to Notion" onClick={logToNotion} disabled={!canSubmit} />
            <SecondaryBtn label="Start over" onClick={reset} />
          </>
        )}

        {phase === 'fallback' && (
          <>
            {preview && <img src={preview} alt="cover"
              style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 2,
                display: 'block', opacity: .45, marginBottom: 16 }} />}
            <Notice text="Could not identify this cover reliably. Please fill in the details below." />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}><FormFields /></div>
            <PrimaryBtn label="Log to Notion" onClick={logToNotion} disabled={!canSubmit} />
            <SecondaryBtn label="Start over" onClick={reset} />
          </>
        )}

        {phase === 'logging' && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Spinner />
            <div style={{ marginTop: 20, fontSize: 12, color: c.muted,
              letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Writing to Notion...
            </div>
          </div>
        )}

        {phase === 'success' && (
          <div style={{ textAlign: 'center', padding: '52px 0' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%',
              border: `1px solid ${c.accent}`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 24px', fontSize: 18, color: c.accent }}>
              ✓
            </div>
            <div style={{ fontSize: 20, fontWeight: 400, color: c.text, marginBottom: 6 }}>
              {form.title}
            </div>
            <div style={{ fontSize: 14, color: c.muted, marginBottom: 4 }}>{form.artist}</div>
            <div style={{ fontSize: 12, color: c.muted, marginBottom: 28 }}>
              {form.format}{genres ? ` · ${genres}` : ''}
            </div>
            <div style={{ fontSize: 11, color: c.muted, letterSpacing: '0.08em',
              textTransform: 'uppercase', marginBottom: 32 }}>
              Logged to Notion
            </div>
            <SecondaryBtn label="Log another" onClick={reset} />
          </div>
        )}

        {phase === 'error' && (
          <div style={{ textAlign: 'center', padding: '52px 0' }}>
            <div style={{ fontSize: 13, color: c.gold, marginBottom: 24, lineHeight: 1.6 }}>{errMsg}</div>
            <SecondaryBtn label="Retry" onClick={() => setPhase(form.title ? 'confirm' : 'fallback')} />
            <SecondaryBtn label="Start over" onClick={reset} />
          </div>
        )}

      </div>
    </div>
  );
}

export default function Page() {
  const [unlocked, setUnlocked] = useState(false);

  if (!process.env.NEXT_PUBLIC_APP_PASSWORD) {
    return <><style>{css}</style><VinylLogger /></>;
  }

  return (
    <>
      <style>{css}</style>
      {unlocked ? <VinylLogger /> : <PasswordGate onUnlock={() => setUnlocked(true)} />}
    </>
  );
}