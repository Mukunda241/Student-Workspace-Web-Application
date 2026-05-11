import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MainLayout } from '../components/MainLayout';
import { fileService, projectService } from '../services/authService';
import {
  IcoDatabase, IcoUpload, IcoTrash, IcoFile, IcoFilePdf,
  IcoImage, IcoVideo, IcoMusic, IcoFileText, IcoSearch,
  IcoX, IcoDownload
} from '../utils/icons';
import '../styles/files.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8082';

const fileIconInfo = (type) => {
  if (!type) return { Icon: IcoFile, cls: 'default' };
  const t = type.toLowerCase();
  if (t.includes('pdf'))   return { Icon: IcoFilePdf,  cls: 'pdf' };
  if (t.includes('image')) return { Icon: IcoImage,    cls: 'image' };
  if (t.includes('video')) return { Icon: IcoVideo,    cls: 'video' };
  if (t.includes('audio')) return { Icon: IcoMusic,    cls: 'audio' };
  if (t.includes('word') || t.includes('document')) return { Icon: IcoFileText, cls: 'doc' };
  if (t.includes('sheet') || t.includes('excel'))   return { Icon: IcoFileText, cls: 'sheet' };
  return { Icon: IcoFile, cls: 'default' };
};

const fmtSize = (b) => {
  if (!b) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
};

// Build a download URL from the file path stored by the backend
const getDownloadUrl = (file) => {
  // Backend stores filePath like "uploads/12345_filename.pdf"
  // We serve it via GET /api/files/{fileId} which returns metadata,
  // so we use the filePath directly relative to the server root
  if (file.filePath) {
    // If it's a relative path, serve through the Spring Boot static resources
    const cleanPath = file.filePath.replace(/\\/g, '/');
    return `${API_BASE}/${cleanPath}`;
  }
  return null;
};

export const Files = () => {
  const navigate    = useNavigate();
  const { user }    = useContext(AuthContext);
  const [files,     setFiles]      = useState([]);
  const [projects,  setProjects]   = useState([]);
  const [loading,   setLoading]    = useState(true);
  const [uploading, setUploading]  = useState(false);
  const [error,     setError]      = useState('');
  const [success,   setSuccess]    = useState('');
  const [chosen,    setChosen]     = useState(null);
  const [chosenProj,setChosenProj] = useState('');
  const [search,    setSearch]     = useState('');
  const [filterProj,setFilterProj] = useState('all');
  const [dragOver,  setDragOver]   = useState(false);
  const [showForm,  setShowForm]   = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!user?.id) { navigate('/login'); return; }
    Promise.all([
      fileService.getUserFiles(user.id),
      projectService.getUserProjects(user.id),
    ]).then(([fr, pr]) => {
      setFiles(Array.isArray(fr.data) ? fr.data : []);
      setProjects(Array.isArray(pr.data) ? pr.data : []);
    }).catch(e => {
      if (e.response?.status === 401) navigate('/login');
      else setError('Failed to load files');
    }).finally(() => setLoading(false));
  }, [user?.id, navigate]);

  const refresh = async () => {
    try {
      const { data } = await fileService.getUserFiles(user.id);
      setFiles(Array.isArray(data) ? data : []);
    } catch { setError('Failed to refresh files'); }
  };

  const upload = async (e) => {
    e.preventDefault();
    if (!chosen)     { setError('Please select a file'); return; }
    if (!chosenProj) { setError('Please select a project'); return; }
    const fd = new FormData();
    fd.append('file', chosen);
    try {
      setError(''); setUploading(true);
      await fileService.uploadFile(user.id, chosenProj, fd);
      await refresh();
      setChosen(null); setChosenProj(''); setShowForm(false);
      setSuccess('File uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.response?.data?.message || 'Upload failed. Please try again.');
    } finally { setUploading(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this file?')) return;
    try {
      await fileService.deleteFile(id);
      setFiles(prev => prev.filter(f => f.id !== id));
      setSuccess('File deleted.'); setTimeout(() => setSuccess(''), 2000);
    } catch { setError('Failed to delete file'); }
  };

  const handleDownload = async (file) => {
    try {
      const token = localStorage.getItem('token');
      const url   = `${API_BASE}/api/files/download/${file.id}`;
      const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Download failed');
      const blob  = await res.blob();
      const href  = URL.createObjectURL(blob);
      const a     = document.createElement('a');
      a.href      = href;
      a.download  = file.fileName || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
    } catch {
      // Fallback: open file path directly
      const url = getDownloadUrl(file);
      if (url) window.open(url, '_blank');
      else setError('Download not available for this file');
    }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) { setChosen(f); setShowForm(true); }
  };
  const onInput = (e) => {
    if (e.target.files[0]) { setChosen(e.target.files[0]); setShowForm(true); }
  };

  const filtered = files.filter(f => {
    const ms = !search || f.fileName?.toLowerCase().includes(search.toLowerCase());
    const mp = filterProj === 'all' || String(f.projectId) === String(filterProj);
    return ms && mp;
  });

  const totalSize = files.reduce((s,f) => s + (f.fileSize||0), 0);

  return (
    <MainLayout pageTitle="Files">
      <div className="files-wrap">
        {/* Header */}
        <div className="page-hdr">
          <div className="page-hdr-left">
            <IcoDatabase size={22} />
            <h2>My Study Files</h2>
          </div>
          <div className="page-hdr-right">
            <button className="btn btn-primary" onClick={() => inputRef.current?.click()}>
              <IcoUpload size={15} /> Upload File
            </button>
          </div>
        </div>

        {error   && <div className="error-msg"><IcoX size={14}/> {error}</div>}
        {success && <div className="success-msg">{success}</div>}

        {/* Stats */}
        {files.length > 0 && (
          <div className="files-stats">
            <span className="files-stat"><strong>{files.length}</strong> files</span>
            <span className="files-stat"><strong>{fmtSize(totalSize)}</strong> total</span>
            <span className="files-stat"><strong>{projects.length}</strong> projects</span>
          </div>
        )}

        {/* Drop zone */}
        <div
          className={`upload-zone${dragOver ? ' drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" style={{ display:'none' }} onChange={onInput} />
          <IcoUpload size={44} />
          <h3>Drop files here or click to browse</h3>
          <p>Supports PDFs, images, documents, videos and more</p>
          <button className="btn btn-secondary btn-sm"
            onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
            Browse Files
          </button>
        </div>

        {/* Upload confirm card */}
        {showForm && chosen && (
          <div className="upload-confirm-card">
            <h3><IcoUpload size={18} /> Confirm Upload</h3>
            <div className="selected-file-row">
              {(() => {
                const { Icon } = fileIconInfo(chosen.type);
                return <Icon size={22} style={{ color:'var(--brand-500)' }} />;
              })()}
              <span className="selected-file-name">{chosen.name}</span>
              <span className="selected-file-size">{fmtSize(chosen.size)}</span>
            </div>
            <div className="form-group" style={{ marginTop:'.75rem' }}>
              <label>Upload to project *</label>
              <select value={chosenProj} onChange={e => setChosenProj(e.target.value)} required>
                <option value="">Select a project…</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
              {projects.length === 0 && (
                <p className="form-hint">⚠ No projects yet. <a href="/projects">Create one</a> first.</p>
              )}
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary"
                onClick={() => { setShowForm(false); setChosen(null); }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={upload}
                disabled={uploading || !chosenProj}>
                {uploading ? 'Uploading…' : 'Upload File'}
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        {files.length > 0 && (
          <div className="files-toolbar">
            <div className="search-box">
              <IcoSearch size={14} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search files…" />
            </div>
            <select value={filterProj} onChange={e => setFilterProj(e.target.value)}
              style={{ width:'auto', minWidth:160 }}>
              <option value="all">All projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Files grid */}
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /> Loading files…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <IcoDatabase size={52} />
            <h3>{files.length === 0 ? 'No files yet' : 'No matching files'}</h3>
            <p>{files.length === 0
              ? 'Upload your first study material to get started.'
              : 'Try a different search or filter.'}
            </p>
          </div>
        ) : (
          <div className="files-grid">
            {filtered.map(f => {
              const { Icon, cls } = fileIconInfo(f.fileType);
              return (
                <div key={f.id} className="file-card card-hover">
                  <div className={`file-icon-wrap ${cls}`}><Icon size={24} /></div>
                  <div>
                    <div className="file-name" title={f.fileName}>{f.fileName}</div>
                    <div className="file-type-txt">
                      {f.fileType?.split('/').pop()?.toUpperCase() || 'FILE'}
                    </div>
                  </div>
                  <div className="file-bottom">
                    <span className="file-size">{fmtSize(f.fileSize)}</span>
                    <span className="file-date">
                      {f.uploadedAt ? new Date(f.uploadedAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                  {/* Action buttons — Download + Delete */}
                  <div className="file-actions-row">
                    <button
                      className="btn btn-secondary btn-sm file-action-btn"
                      onClick={() => handleDownload(f)}
                      title="Download file"
                    >
                      <IcoDownload size={13} /> Download
                    </button>
                    <button
                      className="btn-icon danger"
                      onClick={() => del(f.id)}
                      title="Delete file"
                    >
                      <IcoTrash size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Files;
