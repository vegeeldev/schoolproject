// File: pages/index.js
import { useState, useEffect } from 'react';
import Script from 'next/script';

export default function UniFlash() {
  const [model, setModel] = useState(null);
  const [status, setStatus] = useState('Loading AI script...');
  const [action, setAction] = useState('Generate summary');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load saved notes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('uniflash_notes');
      if (saved) setNotes(saved);
    }
  }, []);

  // Persist notes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('uniflash_notes', notes);
    }
  }, [notes]);

  // Initialize GPT4All-J after script loads and model binary is available
  useEffect(() => {
    if (!scriptLoaded) return;
    (async () => {
      setStatus('Initializing model...');
      try {
        // Ensure you've placed the quantized model binary at /public/models/gpt4all-lora-quantized.bin
        const m = new window.GPT4All({ model: '/models/gpt4all-lora-quantized.bin' });
        await m.load();
        setModel(m);
        setStatus('Model loaded — ready!');
      } catch (e) {
        console.error('Model load error:', e);
        setStatus('Error loading model; check model path and network.');
      } finally {
        setBusy(false);
      }
    })();
  }, [scriptLoaded]);

  const handleGenerate = async () => {
    if (!topic.trim() || !model) return;
    setBusy(true);
    setStatus('Generating...');
    setResult('');
    try {
      const prompt = `${action} on '${topic}' for undergraduate students in Nigerian tertiary institutions.`;
      const resp = await model.chat(prompt);
      // GPT4All-J returns an object with `text` property
      const text = resp.text ?? String(resp);
      setResult(text.trim());
    } catch (err) {
      console.error('Generation error:', err);
      setResult('Error generating content; see console for details.');
    } finally {
      setStatus('Model loaded — ready!');
      setBusy(false);
    }
  };

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/gpt4all@latest/dist/gpt4all.min.js"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        onError={(e) => {
          console.error('Script load error:', e);
          setStatus('Failed to load AI script.');
          setBusy(false);
        }}
      />
      <div className="container">
        <h1>UniFlash 🎓</h1>
        <div className="controls">
          <select value={action} onChange={e => setAction(e.target.value)}>
            <option value="Generate summary">Generate Summary</option>
            <option value="Create flashcards">Create Flashcards</option>
            <option value="Make MCQs">Make MCQs</option>
          </select>
          <input
            type="text"
            placeholder="Enter course topic or lecture title"
            value={topic}
            onChange={e => setTopic(e.target.value)}
          />
          <button onClick={handleGenerate} disabled={busy}>Go</button>
        </div>

        <div id="status">{status}</div>
        <div id="result">{result}</div>

        <label className="notes-label" htmlFor="notes">Your Notes</label>
        <textarea
          id="notes"
          placeholder="Save your personal notes..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        <div className="footer">Offline AI via GPT4All-J | Model hosted at /models/gpt4all-lora-quantized.bin</div>
      </div>

      <style jsx>{`
        .container { max-width: 700px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 32px; font-family: sans-serif; }
        h1 { text-align: center; margin-bottom: 1em; font-size: 2em; }
        .controls { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 1.5em; }
        .controls > * { flex: 1; min-width: 140px; padding: 8px; border-radius: 6px; border: 1px solid #ccc; }
        select, input { width: 100%; }
        button { background: #1a73e8; color: #fff; border: none; cursor: pointer; }
        button:disabled { background: #aaa; cursor: default; }
        #status { margin-bottom: 1em; color: #555; }
        #result { white-space: pre-wrap; background: #fafbfd; padding: 16px; border-radius: 6px; border: 1px solid #ddd; min-height: 150px; }
        .notes-label { display: block; margin-top: 1.5em; font-weight: bold; }
        textarea { width: 100%; min-height: 100px; padding: 10px; border: 1px solid #ccc; border-radius: 6px; font-family: inherit; }
        .footer { text-align: center; color: #555; font-size: 0.9em; margin-top: 2em; }
      `}</style>
    </>
  );
}
