import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MainLayout } from '../components/MainLayout';
import { projectService, taskService } from '../services/authService';
import {
  IcoFolder, IcoPlus, IcoEdit, IcoTrash, IcoX,
  IcoCalendar, IcoCheckSquare, IcoBarChart, IcoSearch
} from '../utils/icons';
import '../styles/projects.css';

const COLORS   = ['#5a7ef7','#7c3aed','#059669','#d97706','#dc2626','#0891b2','#c026d3'];
const EMPTY    = { title:'', description:'', status:'ACTIVE', category:'Personal', deadline:'' };
const ST_LABEL = { ALL:'All', PLANNING:'Planning', ACTIVE:'Active', COMPLETED:'Completed', ON_HOLD:'On Hold' };
const ST_CLASS = { PLANNING:'status-planning', ACTIVE:'status-active', COMPLETED:'status-completed', ON_HOLD:'status-on-hold' };

export const Projects = () => {
  const navigate    = useNavigate();
  const { user }    = useContext(AuthContext);
  const [projects,  setProjects]  = useState([]);
  const [tasks,     setTasks]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [formData,  setFormData]  = useState(EMPTY);
  const [formErr,   setFormErr]   = useState('');
  const [filterSt,  setFilterSt]  = useState('ALL');
  const [search,    setSearch]    = useState('');
  const [error,     setError]     = useState('');

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data } = await projectService.getUserProjects(user.id);
      setProjects(Array.isArray(data) ? data : []);
      try {
        const { data: td } = await taskService.getUserTasks(user.id);
        setTasks(Array.isArray(td) ? td : []);
      } catch (_) {}
      setError('');
    } catch (e) {
      if (e.response?.status === 401) navigate('/login');
      setError('Failed to load projects. Check the backend is running.');
    } finally { setLoading(false); }
  }, [user?.id, navigate]);

  useEffect(() => { load(); }, [load]);

  const openNew  = () => { setEditing(null); setFormData(EMPTY); setFormErr(''); setShowForm(true); };
  const openEdit = (p) => {
    setEditing(p);
    setFormData({
      title: p.title||'', description: p.description||'',
      status: p.status||'ACTIVE', category: p.category||'Personal', deadline: p.deadline||''
    });
    setFormErr(''); setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { setFormErr('Project title is required'); return; }
    try {
      if (editing) {
        const { data } = await projectService.updateProject(editing.id, formData);
        setProjects(prev => prev.map(p => p.id === data.id ? data : p));
      } else {
        const { data } = await projectService.createProject(user.id, formData);
        setProjects(prev => [data, ...prev]);
      }
      setShowForm(false); setFormErr('');
    } catch (e) {
      setFormErr(e.response?.data?.message || 'Failed to save project');
    }
  };

  const del = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project?')) return;
    try {
      await projectService.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch { setError('Failed to delete project'); }
  };

  const getProgress = (projId) => {
    const pt = tasks.filter(t => String(t.projectId) === String(projId));
    if (!pt.length) return { total:0, done:0, pct:0 };
    const done = pt.filter(t => t.status === 'DONE').length;
    return { total:pt.length, done, pct:Math.round((done/pt.length)*100) };
  };

  // FIX: filter works on both status AND search simultaneously
  const filtered = projects.filter(p => {
    const matchStatus = filterSt === 'ALL' || p.status === filterSt;
    const matchSearch = !search.trim() ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const colorFor = (id) => COLORS[(id || 0) % COLORS.length];

  return (
    <MainLayout pageTitle="Projects">
      {/* Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? 'Edit Project' : 'New Project'}</h3>
              <button className="btn-icon" onClick={() => setShowForm(false)}><IcoX size={16}/></button>
            </div>
            {formErr && <div className="form-error">{formErr}</div>}
            <form onSubmit={submit}>
              <div className="form-group">
                <label>Project title *</label>
                <input value={formData.title}
                  onChange={e => setFormData(p => ({...p, title:e.target.value}))}
                  placeholder="My awesome project…" autoFocus required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={formData.description}
                  onChange={e => setFormData(p => ({...p, description:e.target.value}))}
                  placeholder="What is this project about?" rows={3} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select value={formData.status}
                    onChange={e => setFormData(p => ({...p, status:e.target.value}))}>
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ON_HOLD">On Hold</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={formData.category}
                    onChange={e => setFormData(p => ({...p, category:e.target.value}))}>
                    <option value="Personal">Personal</option>
                    <option value="University">University</option>
                    <option value="Work">Work</option>
                    <option value="Research">Research</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Deadline</label>
                <input type="date" value={formData.deadline}
                  onChange={e => setFormData(p => ({...p, deadline:e.target.value}))} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editing ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="projects-wrap">
        {error && <div className="error-msg"><IcoX size={14}/>{error}</div>}

        {/* Toolbar — search + status chips + new button all in one row */}
        <div className="projects-toolbar">
          {/* Search box */}
          <div style={{ position:'relative', minWidth:180, maxWidth:260 }}>
            <IcoSearch size={14} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'var(--txt-3)', pointerEvents:'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects…"
              style={{ paddingLeft:30, background:'var(--raised)' }}
            />
          </div>

          {/* Status filter chips */}
          <div className="status-chips">
            {['ALL','PLANNING','ACTIVE','COMPLETED','ON_HOLD'].map(s => (
              <button
                key={s}
                className={`chip-btn${filterSt === s ? ' active' : ''}`}
                onClick={() => setFilterSt(s)}
              >
                {ST_LABEL[s]}
              </button>
            ))}
          </div>

          <button className="btn btn-primary" onClick={openNew} style={{ marginLeft:'auto', flexShrink:0 }}>
            <IcoPlus size={15}/> New Project
          </button>
        </div>

        {/* Count row */}
        <div style={{ fontSize:'.78rem', color:'var(--txt-3)', marginBottom:'.875rem' }}>
          Showing {filtered.length} of {projects.length} project{projects.length !== 1 ? 's' : ''}
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /> Loading projects…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <IcoFolder size={52} style={{ color:'var(--sl-300)', margin:'0 auto 1rem' }} />
            <h3>{projects.length === 0 ? 'No projects yet' : 'No matching projects'}</h3>
            <p>
              {projects.length === 0
                ? 'Create your first project to get started.'
                : `No projects match "${search || ST_LABEL[filterSt]}". Try clearing your filters.`}
            </p>
            {projects.length === 0 && (
              <button className="btn btn-primary" onClick={openNew}>
                <IcoPlus size={15}/> Create Project
              </button>
            )}
          </div>
        ) : (
          <div className="projects-grid">
            {filtered.map(p => {
              const { total, done, pct } = getProgress(p.id);
              const color = colorFor(p.id);
              return (
                <div key={p.id} className="project-card card-hover">
                  <div className="project-stripe" style={{ background:color }} />
                  <div className="project-body">
                    <div className="project-top">
                      <div className="project-title">{p.title}</div>
                      <span className={`project-status-pill ${ST_CLASS[p.status] || 'status-active'}`}>
                        {ST_LABEL[p.status] || p.status}
                      </span>
                    </div>

                    {p.description && (
                      <p className="project-desc">{p.description}</p>
                    )}

                    <div className="project-prog-wrap">
                      <div className="project-prog-labels">
                        <span>Progress</span>
                        <span style={{ color, fontWeight:700 }}>{pct}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width:`${pct}%`, background:color }} />
                      </div>
                    </div>

                    <div className="project-meta-row">
                      <span className="project-meta-chip">
                        <IcoCheckSquare size={12} /> {done}/{total} tasks
                      </span>
                      {p.category && (
                        <span className="project-meta-chip">
                          <IcoFolder size={12} /> {p.category}
                        </span>
                      )}
                      {p.deadline && (
                        <span className="project-meta-chip">
                          <IcoCalendar size={12} /> {p.deadline}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="project-footer">
                    <button className="btn btn-secondary" style={{ fontSize:'.78rem' }}
                      onClick={() => navigate(`/tasks?project=${p.id}`)}>
                      <IcoBarChart size={13} /> Tasks
                    </button>
                    <button className="btn btn-ghost" style={{ fontSize:'.78rem' }} onClick={() => openEdit(p)}>
                      <IcoEdit size={13} /> Edit
                    </button>
                    <button className="btn btn-danger" style={{ fontSize:'.78rem' }} onClick={e => del(p.id, e)}>
                      <IcoTrash size={13} /> Delete
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

export default Projects;
