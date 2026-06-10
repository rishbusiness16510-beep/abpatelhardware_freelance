import { useRef, useState, useEffect, useCallback } from 'react';
import {
  X, Save, Bold, Italic, Heading1, Heading2, Link as LinkIcon,
  Undo, Redo, Loader2, CheckCircle, Type, AlignLeft
} from 'lucide-react';
import api from '../../lib/api';
import Button from '../ui/Button';

interface StaticPageEditorProps {
  item: {
    id: string;
    title: string;
    content: string | null;
    imageUrl: string | null;
  };
  onClose: () => void;
  onSaved: () => void;
}

export default function StaticPageEditor({ item, onClose, onSaved }: StaticPageEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState(item.title);
  const [isDirty, setIsDirty] = useState(false);
  const [charCount, setCharCount] = useState(0);

  // Inject initial content into contenteditable div once mounted
  useEffect(() => {
    if (editorRef.current && item.content) {
      editorRef.current.innerHTML = item.content;
      setCharCount(editorRef.current.innerText.length);
    } else if (editorRef.current) {
      editorRef.current.innerHTML = '<p>Start writing your page content here...</p>';
    }
  }, [item.content]);

  const handleInput = () => {
    setIsDirty(true);
    setSaved(false);
    if (editorRef.current) {
      setCharCount(editorRef.current.innerText.length);
    }
  };

  const execCmd = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    setIsDirty(true);
  }, []);

  const insertLink = useCallback(() => {
    const url = window.prompt('Enter URL:', 'https://');
    if (url) execCmd('createLink', url);
  }, [execCmd]);

  const handleSave = async () => {
    if (!editorRef.current) return;
    setSaving(true);
    setError('');
    try {
      const content = editorRef.current.innerHTML;
      await api.put(`/cms/${item.id}`, {
        title,
        content,
        imageUrl: item.imageUrl,
        isActive: true,
      });
      setSaved(true);
      setIsDirty(false);
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes. Discard them?')) return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.85)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#1a1a1a] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs text-white/50 font-medium uppercase tracking-widest">Visual Editor</span>
          <span className="text-white/20 text-xs">·</span>
          <span className="text-white/70 text-sm font-medium truncate max-w-[200px]">{item.title}</span>
        </div>

        <div className="flex items-center gap-3">
          {error && <span className="text-error text-xs">{error}</span>}
          {saved && (
            <span className="flex items-center gap-1 text-success text-xs">
              <CheckCircle className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          <span className="text-white/30 text-xs">{charCount.toLocaleString()} chars</span>
          <Button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-xs font-semibold rounded-lg disabled:opacity-40 hover:bg-accent-dark transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button onClick={handleClose} className="p-2 text-white/40 hover:text-white/80 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-5 py-2.5 bg-[#111] border-b border-white/10 shrink-0 overflow-x-auto">
        <span className="text-white/30 text-xs mr-2 shrink-0">Format:</span>
        {[
          { icon: Bold, label: 'Bold', cmd: 'bold' },
          { icon: Italic, label: 'Italic', cmd: 'italic' },
        ].map(({ icon: Icon, label, cmd }) => (
          <button
            key={cmd}
            onMouseDown={(e) => { e.preventDefault(); execCmd(cmd); }}
            title={label}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}

        <div className="w-px h-4 bg-white/10 mx-1" />

        <button
          onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', '<h2>'); }}
          title="Heading 1"
          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-md transition-colors"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', '<h3>'); }}
          title="Heading 2"
          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-md transition-colors"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', '<p>'); }}
          title="Body Text"
          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-md transition-colors"
        >
          <Type className="w-3.5 h-3.5" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList'); }}
          title="Bullet List"
          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-md transition-colors"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-white/10 mx-1" />

        <button
          onMouseDown={(e) => { e.preventDefault(); insertLink(); }}
          title="Insert Link"
          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-md transition-colors"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-white/10 mx-1" />

        <button
          onMouseDown={(e) => { e.preventDefault(); execCmd('undo'); }}
          title="Undo"
          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-md transition-colors"
        >
          <Undo className="w-3.5 h-3.5" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); execCmd('redo'); }}
          title="Redo"
          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-md transition-colors"
        >
          <Redo className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Preview Canvas */}
      <div className="flex-1 overflow-y-auto bg-[#f5f3ed]">
        {/* Simulated page header */}
        <div className="bg-[#2c2c2c] py-16 text-center px-4">
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }}
            className="font-serif text-3xl md:text-4xl font-bold text-white bg-transparent border-none outline-none text-center w-full focus:bg-white/5 rounded-lg px-4 py-2 transition-colors"
            placeholder="Page Title"
          />
          <p className="text-white/40 text-xs mt-3 tracking-widest uppercase">← Click title or content below to edit</p>
        </div>

        {/* Editable content area */}
        <div className="max-w-4xl mx-auto px-6 py-14">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            className="outline-none min-h-[400px] text-[#353838] leading-relaxed text-lg focus:ring-2 focus:ring-accent/20 rounded-lg p-4 transition-all cursor-text"
            style={{
              fontFamily: "'Lato', -apple-system, sans-serif",
            }}
            data-placeholder="Click here and start typing your page content..."
          />
        </div>
      </div>

      {/* Bottom hint */}
      <div className="px-5 py-2 bg-[#111] border-t border-white/10 shrink-0">
        <p className="text-white/30 text-xs text-center">
          Click any text to edit · Use the toolbar above to format · Changes only save when you click "Save Changes"
        </p>
      </div>

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] h2 { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 700; margin: 1.5rem 0 0.75rem; color: #1a1a1a; }
        [contenteditable] h3 { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 600; margin: 1.25rem 0 0.5rem; color: #1a1a1a; }
        [contenteditable] p { margin: 0 0 1rem; }
        [contenteditable] ul { list-style: disc; padding-left: 1.5rem; margin: 0.75rem 0; }
        [contenteditable] li { margin: 0.3rem 0; }
        [contenteditable] a { color: #8b6c4e; text-decoration: underline; }
        [contenteditable]:focus { outline: none; }
      `}</style>
    </div>
  );
}
