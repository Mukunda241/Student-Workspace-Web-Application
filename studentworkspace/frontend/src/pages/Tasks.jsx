import React, { useState, useEffect, useContext, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MainLayout } from '../components/MainLayout';
import { taskService, projectService } from '../services/authService';
import PomodoroTimer from '../components/PomodoroTimer';
import {
  IcoPlus, IcoSearch, IcoEdit, IcoTrash, IcoX,
  IcoCalendar, IcoClock, IcoKanban, IcoRows
} from '../utils/icons';
import '../styles/tasks.css';

const EMPTY = { title:'', description:'', priority:'MEDIUM', deadline:'', status:'TODO', projectId:'' };

// FIX: TaskCard defined OUTSIDE main component so it doesn't re-create on every render
// This was breaking drag-and-drop state
const TaskCard = memo(({ task, selected, onSelect, onEdit, onDelete, onPomodoro }) => (
  <div
    className={`k-card${selected ? ' selected' : ''}`}
    draggable
    onDragStart={e => { e.dataTransfer.setData('taskId', String(task.id)); }}
  >
    <div className="k-card-top">
      <input type="checkbox" checked={selected}
        onChange={() => onSelect(task.id)}
        onClick={e => e.stopPropagation()}
        style={{ width:'auto', cursor:'pointer', flexShrink:0 }} />
      <span className={`pri-dot ${(task.priority||'medium').toLowerCase()}`} />
      <span className="badge" style={{
        fontSize:'.63rem', padding:'1px 6px',
        background: task.priority==='HIGH' ? 'var(--red-100)' : task.priority==='LOW' ? 'var(--green-100)' : 'var(--amber-100)',
        color:      task.priority==='HIGH' ? 'var(--red-800)' : task.priority==='LOW' ? 'var(--green-800)' : 'var(--amber-800)',
      }}>{task.priority || 'MED'}</span>
    </div>
    <div className="k-card-title">{task.title}</div>
    {task.description && <div className="k-card-desc">{task.description}</div>}
    <div className="k-card-meta">
      {task.deadline && <span className="k-meta"><IcoCalendar size={11}/>{task.deadline}</span>}
      {task.timeSpent > 0 && <span className="k-meta"><IcoClock size={11}/>{Math.round(task.timeSpent/60)}h</span>}
    </div>
    <div className="k-card-actions">
      <button className="btn-icon" title="Start Pomodoro" onClick={() => onPomodoro(task)}>🍅</button>
      <button className="btn-icon" onClick={() => onEdit(task)}><IcoEdit size={14}/></button>
      <button className="btn-icon danger" onClick={() => onDelete(task.id)}><IcoTrash size={14}/></button>
    </div>
  </div>
));

export const Tasks = () => {
  const navigate     = useNavigate();
  const location     = useLocation();
  const { user }     = useContext(AuthContext);
  const [tasks,      setTasks]      = useState([]);
  const [projects,   setProjects]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [view,       setView]       = useState('kanban');
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [formData,   setFormData]   = useState(EMPTY);
  const [formErr,    setFormErr]    = useState('');
  const [search,     setSearch]     = useState('');
  const [filterPri,  setFilterPri]  = useState('ALL');
  const [filterSt,   setFilterSt]   = useState('ALL');
  const [filterProj, setFilterProj] = useState('');
  const [selected,   setSelected]   = useState(new Set());
  const [pomoTask,   setPomoTask]   = useState(null);
  const [error,      setError]      = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const proj = params.get('project');
    if (proj) setFilterProj(proj);
  }, [location.search]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [tRes, pRes] = await Promise.all([
        taskService.getUserTasks(user.id),
        projectService.getUserProjects(user.id),
      ]);
      setTasks(Array.isArray(tRes.data) ? tRes.data : []);
      setProjects(Array.isArray(pRes.data) ? pRes.data : []);
      setError('');
    } catch (e) {
      if (e.response?.status === 401) navigate('/login');
      setError('Failed to load tasks. Check the backend is running.');
    } finally { setLoading(false); }
  }, [user?.id, navigate]);

  useEffect(() => { load(); }, [load]);

  const openNew  = () => { setEditing(null); setFormData(EMPTY); setFormErr(''); setShowForm(true); };
  const openEdit = (t) => {
    setEditing(t);
    setFormData({ title:t.title||'', description:t.description||'',
      priority:t.priority||'MEDIUM', deadline:t.deadline||'',
      status:t.status||'TODO', projectId:t.projectId ? String(t.projectId) : '' });
    setFormErr(''); setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { setFormErr('Title is required'); return; }
    const payload = {
      title: formData.title.trim(),
      description: formData.description,
      priority: formData.priority,
      status: formData.status,
      deadline: formData.deadline || null,
      projectId: formData.projectId ? Number(formData.projectId) : null,
      timeSpent: editing?.timeSpent || 0,
      completed: formData.status === 'DONE',
    };
    try {
      if (editing) {
        const { data } = await taskService.updateTask(editing.id, payload);
        setTasks(prev => prev.map(t => t.id === data.id ? data : t));
      } else {
        const { data } = await taskService.createTask(user.id, payload);
        setTasks(prev => [data, ...prev]);
      }
      setShowForm(false); setFormErr('');
    } catch (e) {
      setFormErr(e.response?.data?.message || e.response?.data || 'Failed to save task');
    }
  };

  const del = useCallback(async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskService.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch { setError('Failed to delete task'); }
  }, []);

  const bulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.size} task(s)?`)) return;
    await Promise.all([...selected].map(id => taskService.deleteTask(id)));
    setTasks(prev => prev.filter(t => !selected.has(t.id)));
    setSelected(new Set());
  };

  // FIX: use updateTaskStatus (PATCH /status) not updateTask (PUT) for drag-drop
  // updateTask requires full payload; updateTaskStatus only needs {status}
  const changeStatus = useCallback(async (id, status) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    try {
      await taskService.updateTaskStatus(id, status);
    } catch { load(); }
  }, [load]);

  const toggleSelect = useCallback((id) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  const handleDrop = useCallback((e, status) => {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData('taskId'));
    if (id) changeStatus(id, status);
  }, [changeStatus]);

  const filtered = tasks.filter(t => {
    const ms  = !search || t.title?.toLowerCase().includes(search.toLowerCase());
    const mp  = filterPri === 'ALL' || t.priority === filterPri;
    const mst = filterSt  === 'ALL' || t.status === filterSt;
    const mpr = !filterProj || String(t.projectId) === String(filterProj);
    return ms && mp && mst && mpr;
  });

  const byStatus = (s) => filtered.filter(t => t.status === s);

  const cols = [
    { key:'TODO',        label:'To Do' },
    { key:'IN_PROGRESS', label:'In Progress' },
    { key:'DONE',        label:'Done' },
  ];

  return (
    <MainLayout pageTitle="Tasks">
      {/* Pomodoro Modal */}
      {pomoTask && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setPomoTask(null)}>
          <div className="modal" style={{ maxWidth:340 }}>
            <div className="modal-header">
              <h3>🍅 Pomodoro</h3>
              <button className="btn-icon" onClick={() => setPomoTask(null)}><IcoX size={16}/></button>
            </div>
            <PomodoroTimer taskTitle={pomoTask.title} />
          </div>
        </div>
      )}

      {/* Task Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? 'Edit Task' : 'New Task'}</h3>
              <button className="btn-icon" onClick={() => setShowForm(false)}><IcoX size={16}/></button>
            </div>
            {formErr && <div className="form-error">{formErr}</div>}
            <form onSubmit={submit}>
              <div className="form-group">
                <label>Title *</label>
                <input value={formData.title}
                  onChange={e => setFormData(p => ({...p, title:e.target.value}))}
                  placeholder="Task title…" autoFocus required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={formData.description}
                  onChange={e => setFormData(p => ({...p, description:e.target.value}))}
                  placeholder="Optional description…" rows={3} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select value={formData.priority}
                    onChange={e => setFormData(p => ({...p, priority:e.target.value}))}>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={formData.status}
                    onChange={e => setFormData(p => ({...p, status:e.target.value}))}>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Deadline</label>
                  <input type="date" value={formData.deadline}
                    onChange={e => setFormData(p => ({...p, deadline:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>Project</label>
                  <select value={formData.projectId}
                    onChange={e => setFormData(p => ({...p, projectId:e.target.value}))}>
                    <option value="">No project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editing ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="tasks-wrap">
        {error && <div className="error-msg"><IcoX size={14}/>{error}</div>}

        {/* Toolbar */}
        <div className="tasks-toolbar">
          <div className="search-box">
            <IcoSearch size={14}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks…"/>
          </div>
          <select value={filterPri} onChange={e => setFilterPri(e.target.value)}>
            <option value="ALL">All priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select value={filterSt} onChange={e => setFilterSt(e.target.value)}>
            <option value="ALL">All statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
          <select value={filterProj} onChange={e => setFilterProj(e.target.value)}>
            <option value="">All projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <div style={{ marginLeft:'auto', display:'flex', gap:'.4rem', alignItems:'center' }}>
            {selected.size > 0 && (
              <button className="btn btn-danger btn-sm" onClick={bulkDelete}>
                Delete ({selected.size})
              </button>
            )}
            <div className="view-switch">
              <button className={view==='kanban' ? 'active' : ''} onClick={() => setView('kanban')}>
                <IcoKanban size={13}/> Kanban
              </button>
              <button className={view==='list' ? 'active' : ''} onClick={() => setView('list')}>
                <IcoRows size={13}/> List
              </button>
            </div>
            <button className="btn btn-primary" onClick={openNew}>
              <IcoPlus size={15}/> New Task
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-wrap"><div className="spinner"/>Loading tasks…</div>
        ) : view === 'kanban' ? (
          <div className="kanban-board">
            {cols.map(({ key, label }) => (
              <div key={key}
                className={`k-col ${key.toLowerCase().replace('_','-')}`}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, key)}
              >
                <div className="k-col-hdr">
                  <span className="k-col-title">{label}</span>
                  <span className="k-count">{byStatus(key).length}</span>
                </div>
                <div className="k-cards">
                  {byStatus(key).map(t => (
                    <TaskCard key={t.id} task={t}
                      selected={selected.has(t.id)}
                      onSelect={toggleSelect}
                      onEdit={openEdit}
                      onDelete={del}
                      onPomodoro={setPomoTask}
                    />
                  ))}
                  {byStatus(key).length === 0 && (
                    <div className="k-empty">Drop tasks here</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="task-list-wrap">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <IcoPlus size={48} style={{ color:'var(--sl-300)', margin:'0 auto 1rem' }}/>
                <h3>No tasks yet</h3>
                <p>Create your first task to get organised</p>
                <button className="btn btn-primary" onClick={openNew}>
                  <IcoPlus size={15}/> New Task
                </button>
              </div>
            ) : filtered.map(t => (
              <div key={t.id} className={`t-list-item ${(t.priority||'').toLowerCase()}`}>
                <input type="checkbox" checked={selected.has(t.id)}
                  onChange={() => toggleSelect(t.id)} style={{ width:'auto', cursor:'pointer' }}/>
                <div className="t-list-info">
                  <h4>{t.title}</h4>
                  {t.description && <p>{t.description}</p>}
                </div>
                <div className="t-list-badges">
                  <span className={`badge badge-${(t.status||'todo').toLowerCase().replace('_','-')}`}>
                    {t.status?.replace('_',' ') || 'TODO'}
                  </span>
                  {t.priority && (
                    <span className={`badge badge-${t.priority.toLowerCase()}`}>{t.priority}</span>
                  )}
                  {t.deadline && <span className="badge">{t.deadline}</span>}
                </div>
                <div className="t-list-actions">
                  <button className="btn-icon" onClick={() => setPomoTask(t)} title="Pomodoro">🍅</button>
                  <button className="btn-icon" onClick={() => openEdit(t)}><IcoEdit size={14}/></button>
                  <button className="btn-icon danger" onClick={() => del(t.id)}><IcoTrash size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Tasks;
