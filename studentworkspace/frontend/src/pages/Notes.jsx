import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MainLayout } from '../components/MainLayout';
import { noteService, projectService } from '../services/authService';
import {
  IcoFileText, IcoPlus, IcoSearch, IcoTrash, IcoX,
  IcoCheck, IcoBold, IcoItalic, IcoCode, IcoList, IcoTag
} from '../utils/icons';
import '../styles/notes.css';

const renderMd = (text) => {
  if (!text) return '';
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^### (.+)$/gm,'<h3>$1</h3>')
    .replace(/^## (.+)$/gm,'<h2>$1</h2>')
    .replace(/^# (.+)$/gm,'<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/`(.+?)`/g,'<code>$1</code>')
    .replace(/^> (.+)$/gm,'<blockquote>$1</blockquote>')
    .replace(/^- (.+)$/gm,'<li>$1</li>')
    .replace(/(<li>[\s\S]+?<\/li>)/g,'<ul>$1</ul>')
    .replace(/\n\n+/g,'</p><p>')
    .replace(/^([^<\n].+)$/gm,'<p>$1</p>')
    .replace(/<p><\/p>/g,'');
};

const Notes = () => {
  const navigate  = useNavigate();
  const { user }  = useContext(AuthContext);
  const [notes,       setNotes]      = useState([]);
  const [projects,    setProjects]   = useState([]);
  const [current,     setCurrent]    = useState(null);
  const [editTitle,   setEditTitle]  = useState('');
  const [editContent, setEditContent]= useState('');
  const [search,      setSearch]     = useState('');
  const [filterProj,  setFilterProj] = useState('all');
  const [sideOpen,    setSideOpen]   = useState(true);
  const [showNew,     setShowNew]    = useState(false);
  const [newTitle,    setNewTitle]   = useState('');
  const [newProj,     setNewProj]    = useState('');
  const [saving,      setSaving]     = useState(false);
  const [saved,       setSaved]      = useState(false);
  const [loading,     setLoading]    = useState(false);
  const [error,       setError]      = useState('');
  const [split,       setSplit]      = useState(true);
  const debounceRef = useRef(null);
  const editorRef   = useRef(null);

  /* ── load ── */
  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [nr, pr] = await Promise.all([
        noteService.getUserNotes(user.id),
        projectService.getUserProjects(user.id),
      ]);
      setNotes(Array.isArray(nr.data) ? nr.data : []);
      setProjects(Array.isArray(pr.data) ? pr.data : []);
      setError('');
    } catch (e) {
      if (e.response?.status === 401) navigate('/login');
      setError('Failed to load notes');
    } finally { setLoading(false); }
  }, [user?.id, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* sync editor when note changes */
  useEffect(() => {
    if (current) { setEditTitle(current.title||''); setEditContent(current.content||''); }
  }, [current?.id]);

  /* ── auto-save ── */
  const autoSave = useCallback(async (title, content) => {
    if (!current) return;
    // Don't auto-save if title is empty
    if (!title.trim()) return;
    setSaving(true);
    try {
      const { data } = await noteService.updateNote(current.id, { title: title.trim(), content: content || '' });
      setNotes(prev => prev.map(n => n.id === data.id ? data : n));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error('Auto-save failed', e); }
    finally { setSaving(false); }
  }, [current]);

  const onContent = (val) => {
    setEditContent(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => autoSave(editTitle, val), 1200);
  };
  const onTitle = (val) => {
    setEditTitle(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => autoSave(val, editContent), 1200);
  };

  /* ── create note ──
     FIX 1: backend NoteRequest has @NotBlank on content — send ' ' (space) not '' 
     FIX 2: open sidebar & show form when "Create Note" button clicked from empty state */
  const openNewForm = () => {
    setSideOpen(true);
    setShowNew(true);
    setError('');
    setNewTitle('');
    setNewProj(projects[0]?.id ? String(projects[0].id) : '');
  };

  const createNote = async () => {
    if (!newTitle.trim()) { setError('Title is required'); return; }
    const projId = newProj || projects[0]?.id;
    if (!projId) { setError('Please create a project first before adding notes.'); return; }
    try {
      setError('');
      // Backend NoteRequest.content now has no @NotBlank — can send empty string
      const { data } = await noteService.createNote(
        user.id, projId,
        { title: newTitle.trim(), content: '' }
      );
      setNotes(prev => [data, ...prev]);
      setCurrent(data);
      setEditTitle(data.title);
      setEditContent('');
      setShowNew(false);
      setNewTitle('');
      setNewProj('');
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data || 'Failed to create note');
    }
  };

  /* ── delete ── */
  const deleteNote = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this note?')) return;
    try {
      await noteService.deleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      if (current?.id === id) { setCurrent(null); setEditTitle(''); setEditContent(''); }
    } catch { setError('Failed to delete note'); }
  };

  /* ── markdown toolbar ── */
  const insert = (pre, suf = '') => {
    const el = editorRef.current;
    if (!el) return;
    const s = el.selectionStart, e2 = el.selectionEnd;
    const sel = editContent.slice(s, e2);
    const next = editContent.slice(0, s) + pre + sel + suf + editContent.slice(e2);
    setEditContent(next);
    onContent(next);
    setTimeout(() => { el.focus(); el.setSelectionRange(s + pre.length, e2 + pre.length); }, 0);
  };

  /* ── filter ── */
  const filtered = notes.filter(n => {
    const ms = !search
      || n.title?.toLowerCase().includes(search.toLowerCase())
      || n.content?.toLowerCase().includes(search.toLowerCase());
    const mp = filterProj === 'all' || String(n.projectId) === String(filterProj);
    return ms && mp;
  });

  return (
    <MainLayout pageTitle="Notes">
      <div className="notes-layout">

        {/* ── Sidebar ── */}
        <div className={`notes-sidebar${sideOpen ? '' : ' collapsed'}`}>
          <div className="notes-sidebar-inner">

            {/* Header */}
            <div className="notes-sidebar-hdr">
              <h3>Notes ({filtered.length})</h3>
              <div style={{ display:'flex', gap:'.3rem' }}>
                <button className="btn btn-primary btn-sm" onClick={openNewForm}>
                  <IcoPlus size={13} /> New
                </button>
                <button className="btn-icon" onClick={() => setSideOpen(false)}>
                  <IcoX size={15} />
                </button>
              </div>
            </div>

            {/* New Note Form */}
            {showNew && (
              <div className="new-note-form">
                {error && <div className="form-error">{error}</div>}
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Note title…"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && createNote()}
                  />
                </div>
                <div className="form-group">
                  <label>Project *</label>
                  <select value={newProj} onChange={e => setNewProj(e.target.value)}>
                    <option value="">Select project…</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                  {projects.length === 0 && (
                    <p className="form-hint">⚠ No projects yet. <a href="/projects">Create one</a> first.</p>
                  )}
                </div>
                <div style={{ display:'flex', gap:'.4rem' }}>
                  <button className="btn btn-primary btn-sm" onClick={createNote}
                    disabled={!newTitle.trim()}>
                    Create
                  </button>
                  <button className="btn btn-secondary btn-sm"
                    onClick={() => { setShowNew(false); setError(''); }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="notes-search-area">
              <div style={{ position:'relative' }}>
                <IcoSearch size={13} style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'var(--txt-3)', pointerEvents:'none' }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search notes…"
                  style={{ paddingLeft:27, fontSize:'.8rem' }}
                />
              </div>
            </div>

            {/* Project filter */}
            <div className="notes-filter-area">
              <label>Filter by project</label>
              <select value={filterProj} onChange={e => setFilterProj(e.target.value)}>
                <option value="all">All projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            {/* Note list */}
            <div className="notes-sidebar-body">
              {loading ? (
                <div className="loading-wrap" style={{ padding:'1rem' }}>
                  <div className="spinner" />
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding:'1.5rem', textAlign:'center', color:'var(--txt-3)', fontSize:'.83rem' }}>
                  {notes.length === 0 ? 'No notes yet. Click + New to create one!' : 'No matching notes'}
                </div>
              ) : filtered.map(n => (
                <div
                  key={n.id}
                  className={`note-item${current?.id === n.id ? ' active' : ''}`}
                  onClick={() => setCurrent(n)}
                >
                  <div className="note-item-body">
                    <div className="note-item-title">{n.title}</div>
                    <div className="note-item-preview">
                      {n.content?.trim() || 'Empty note'}
                    </div>
                  </div>
                  <button className="btn-icon danger" onClick={e => deleteNote(n.id, e)}>
                    <IcoTrash size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Editor ── */}
        <div className="notes-editor">
          {!current ? (
            <div className="empty-editor">
              {!sideOpen && (
                <button className="btn btn-secondary btn-sm"
                  style={{ marginBottom:'1.25rem' }}
                  onClick={() => setSideOpen(true)}>
                  ← Show Notes
                </button>
              )}
              <IcoFileText size={52} />
              <h3>No note selected</h3>
              <p>Select a note from the sidebar or create a new one to start writing.</p>
              {/* FIX: calls openNewForm which also opens sidebar */}
              <button className="btn btn-primary" onClick={openNewForm}>
                <IcoPlus size={15} /> Create Note
              </button>
            </div>
          ) : (
            <>
              {/* Top bar */}
              <div className="editor-topbar">
                {!sideOpen && (
                  <button className="btn btn-secondary btn-sm"
                    onClick={() => setSideOpen(true)}>
                    ← Notes
                  </button>
                )}
                <input
                  className="editor-title-input"
                  value={editTitle}
                  onChange={e => onTitle(e.target.value)}
                  placeholder="Note title…"
                />
                <div style={{ display:'flex', alignItems:'center', gap:'.5rem', flexShrink:0 }}>
                  {saving && <span style={{ fontSize:'.7rem', color:'var(--txt-3)' }}>Saving…</span>}
                  {saved  && <span className="save-badge"><IcoCheck size={11} /> Saved</span>}
                  <button className="btn btn-secondary btn-sm" onClick={() => setSplit(s => !s)}>
                    {split ? 'Preview only' : 'Split view'}
                  </button>
                </div>
              </div>

              {/* Markdown toolbar */}
              <div className="editor-toolbar">
                {[
                  { label:'B',       action: () => insert('**','**'), Icon: IcoBold,     title:'Bold' },
                  { label:'I',       action: () => insert('*','*'),   Icon: IcoItalic,   title:'Italic' },
                  { label:'Code',    action: () => insert('`','`'),   Icon: IcoCode,     title:'Inline code' },
                  { label:'List',    action: () => insert('\n- '),    Icon: IcoList,     title:'List item' },
                  { label:'H1',      action: () => insert('# '),      Icon: IcoTag,      title:'Heading 1' },
                  { label:'H2',      action: () => insert('## '),     Icon: IcoTag,      title:'Heading 2' },
                  { label:'Quote',   action: () => insert('> '),      Icon: IcoFileText, title:'Blockquote' },
                ].map(({ label, action, Icon, title }, i) => (
                  <React.Fragment key={label}>
                    {(i === 3 || i === 4) && <div className="toolbar-sep" />}
                    <button className="toolbar-btn" onClick={action} title={title}>
                      <Icon size={13} />{label}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Editor / Preview */}
              {split ? (
                <div className="editor-split">
                  <div className="editor-pane">
                    <div className="pane-lbl">Markdown</div>
                    <textarea
                      ref={editorRef}
                      className="markdown-editor"
                      value={editContent}
                      onChange={e => onContent(e.target.value)}
                      placeholder={'Write in Markdown…\n\n# Heading\n**bold** *italic* `code`\n- List item\n> Blockquote'}
                    />
                  </div>
                  <div className="preview-pane">
                    <div className="pane-lbl">Preview</div>
                    <div
                      className="markdown-preview"
                      dangerouslySetInnerHTML={{ __html: renderMd(editContent) || '<p style="color:var(--txt-3)">Nothing to preview yet…</p>' }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
                  <div className="pane-lbl">Preview</div>
                  <div
                    className="markdown-preview"
                    dangerouslySetInnerHTML={{ __html: renderMd(editContent) || '<p style="color:var(--txt-3)">Nothing to preview…</p>' }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Notes;
export { Notes };
