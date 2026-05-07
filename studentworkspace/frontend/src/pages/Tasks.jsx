import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { MainLayout } from '../components/MainLayout';
import { API_BASE } from '../utils/constants';
import { MdPlaylistAddCheck, MdSearch } from 'react-icons/md';
import '../styles/tasks.css';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterProjectId, setFilterProjectId] = useState(null);
  const [viewMode, setViewMode] = useState('kanban');
  const [draggedTask, setDraggedTask] = useState(null);
  
  // Pomodoro state
  const [pomodoroActive, setpomodoroActive] = useState(false);
  const [pomodoroTaskId, setpomodoroTaskId] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const pomodoroIntervalRef = useRef(null);
  const [focusMode, setFocusMode] = useState(false);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedTasks, setSelectedTasks] = useState(new Set());

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MED',
    dueDate: '',
    recurrence: 'NONE',
    status: 'TODO',
    projectId: null
  });

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, [filterProjectId]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/projects/user/${user?.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const url = filterProjectId 
        ? `${API_BASE}/api/tasks/project/${filterProjectId}`
        : `${API_BASE}/api/tasks/user/${user?.id}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(Array.isArray(data) ? data : data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Pomodoro Timer Effect
  useEffect(() => {
    if (pomodoroActive) {
      setFocusMode(true);
      pomodoroIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(pomodoroIntervalRef.current);
            handlePomodoroComplete();
            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (pomodoroIntervalRef.current) clearInterval(pomodoroIntervalRef.current);
      setFocusMode(false);
    }
    return () => {
      if (pomodoroIntervalRef.current) clearInterval(pomodoroIntervalRef.current);
    };
  }, [pomodoroActive]);

  const handlePomodoroComplete = async () => {
    setpomodoroActive(false);
    try {
      const response = await fetch(`${API_BASE}/api/tasks/${pomodoroTaskId}/log-time`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ minutes: 25 })
      });
      if (response.ok) {
        setTasks(tasks.map(t => 
          t.id === pomodoroTaskId ? { ...t, timeSpent: (t.timeSpent || 0) + 25 } : t
        ));
        alert('✅ Pomodoro completed! 25 minutes logged.');
      }
    } catch (err) {
      console.error('Failed to log time:', err);
    }
  };

  const startPomodoro = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setpomodoroTaskId(taskId);
    setTimeRemaining(25 * 60);
    setpomodoroActive(true);
    updateTaskStatus(taskId, 'DOING');
  };

  const stopPomodoro = () => {
    setpomodoroActive(false);
    setFocusMode(false);
    if (pomodoroIntervalRef.current) clearInterval(pomodoroIntervalRef.current);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE}/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      const method = selectedTask ? 'PUT' : 'POST';
      const url = selectedTask 
        ? `${API_BASE}/api/tasks/${selectedTask.id}`
        : `${API_BASE}/api/tasks/create/${user?.id}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newTask = await response.json();
        if (selectedTask) {
          setTasks(tasks.map(t => t.id === newTask.id ? newTask : t));
        } else {
          setTasks([newTask, ...tasks]);
        }
        resetForm();
      }
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await fetch(`${API_BASE}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.size === 0) return;
    if (!window.confirm(`Delete ${selectedTasks.size} task(s)?`)) return;
    try {
      for (const taskId of selectedTasks) {
        await fetch(`${API_BASE}/api/tasks/${taskId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
      }
      setTasks(tasks.filter(t => !selectedTasks.has(t.id)));
      setSelectedTasks(new Set());
    } catch (err) {
      console.error('Failed to bulk delete:', err);
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedTasks.size === 0) return;
    try {
      for (const taskId of selectedTasks) {
        await fetch(`${API_BASE}/api/tasks/${taskId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ status: newStatus })
        });
      }
      setTasks(tasks.map(t => 
        selectedTasks.has(t.id) ? { ...t, status: newStatus } : t
      ));
      setSelectedTasks(new Set());
    } catch (err) {
      console.error('Failed to bulk update:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'MED',
      dueDate: '',
      recurrence: 'NONE',
      status: 'TODO',
      projectId: null
    });
    setSelectedTask(null);
    setShowForm(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = name === 'projectId' && value ? parseInt(value) : value;
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    if (draggedTask) {
      updateTaskStatus(draggedTask.id, status);
      setDraggedTask(null);
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'HIGH': return '#ef4444';
      case 'MED': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'HIGH': return '🔴 High';
      case 'MED': return '🟡 Medium';
      case 'LOW': return '🟢 Low';
      default: return priority;
    }
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.title : 'No Project';
  };

  const getProjectColor = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.colorCode : '#9ca3af';
  };

  const getTasksByStatus = (status) => {
    let filtered = tasks.filter(t => t.status === status);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query))
      );
    }

    if (filterPriority !== 'ALL') {
      filtered = filtered.filter(t => t.priority === filterPriority);
    }

    if (filterProjectId) {
      filtered = filtered.filter(t => t.projectId === filterProjectId);
    }

    return filtered.sort((a, b) => {
      const priorityOrder = { HIGH: 0, MED: 1, LOW: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };

  const toggleTaskSelection = (taskId) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const formatDueDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (task) => {
    if (!task.dueDate || task.status === 'DONE') return false;
    return new Date(task.dueDate) < new Date();
  };

  if (loading) {
    return <MainLayout><div className="loading">Loading tasks...</div></MainLayout>;
  }

  const todoTasks = getTasksByStatus('TODO');
  const doingTasks = getTasksByStatus('DOING');
  const doneTasks = getTasksByStatus('DONE');

  return (
    <MainLayout>
      <div className={`tasks-container ${focusMode ? 'focus-mode' : ''}`}>
        {focusMode && <div className="focus-overlay"></div>}

        <div className="tasks-content">
          <div className="tasks-header">
            <div className="header-title">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
                }}>
                  <MdPlaylistAddCheck size={32} style={{color: '#6ee7b7'}} />
                </div>
                <h2>Tasks</h2>
              </div>
              <p>Organize, prioritize, and track your work with Pomodoro focus sessions</p>
            </div>
            <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
              ➕ New Task
            </button>
          </div>

          <div className="global-filter-bar">
            <div className="filter-row">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="🔍 Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="filter-group">
                <label>Priority:</label>
                <select 
                  value={filterPriority} 
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="filter-select-small"
                >
                  <option value="ALL">All</option>
                  <option value="HIGH">🔴 High</option>
                  <option value="MED">🟡 Medium</option>
                  <option value="LOW">🟢 Low</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Status:</label>
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select-small"
                >
                  <option value="ALL">All</option>
                  <option value="TODO">📋 To-Do</option>
                  <option value="DOING">⚡ Doing</option>
                  <option value="DONE">✅ Done</option>
                </select>
              </div>
            </div>
          </div>

          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              📊 Kanban
            </button>
            <select 
              value={filterProjectId || ''} 
              onChange={(e) => setFilterProjectId(e.target.value ? parseInt(e.target.value) : null)}
              className="filter-select"
            >
              <option value="">🔍 All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>

          {pomodoroActive && (
            <div className="pomodoro-widget">
              <h3>🍅 Focus Mode Active</h3>
              <div className="pomodoro-timer">{formatTime(timeRemaining)}</div>
              <p className="pomodoro-task">{tasks.find(t => t.id === pomodoroTaskId)?.title}</p>
              <button className="btn-stop-pomodoro" onClick={stopPomodoro}>Stop Focus</button>
            </div>
          )}

          {selectedTasks.size > 0 && (
            <div className="bulk-actions-bar">
              <span>{selectedTasks.size} selected</span>
              <button onClick={() => handleBulkStatusChange('DONE')}>✅ Mark Done</button>
              <button onClick={() => handleBulkStatusChange('DOING')}>⚡ Mark Doing</button>
              <button onClick={() => handleBulkStatusChange('TODO')}>📋 Mark Todo</button>
              <button onClick={handleBulkDelete} className="btn-delete">🗑️ Delete</button>
              <button onClick={() => setSelectedTasks(new Set())} className="btn-cancel">Cancel</button>
            </div>
          )}

          {showForm && (
            <div className="create-task-section">
              <form className="task-form" onSubmit={handleSubmit}>
                <h3>{selectedTask ? 'Edit Task' : 'Create New Task'}</h3>
                
                <div className="form-group">
                  <label>Task Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="What do you need to do?"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Add notes or details..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Priority</label>
                    <select name="priority" value={formData.priority} onChange={handleFormChange}>
                      <option value="LOW">🟢 Low</option>
                      <option value="MED">🟡 Medium</option>
                      <option value="HIGH">🔴 High</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Due Date</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Project</label>
                    <select name="projectId" value={formData.projectId || ''} onChange={handleFormChange}>
                      <option value="">-- No Project --</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Recurrence</label>
                    <select name="recurrence" value={formData.recurrence} onChange={handleFormChange}>
                      <option value="NONE">No Recurrence</option>
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleFormChange}>
                    <option value="TODO">📋 To-Do</option>
                    <option value="DOING">⚡ In Progress</option>
                    <option value="DONE">✅ Done</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    {selectedTask ? '💾 Update Task' : '✨ Create Task'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={resetForm}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {viewMode === 'kanban' && (
            <div className="kanban-board">
              <div className="kanban-column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'TODO')}>
                <div className="column-header">
                  <h3>📋 To-Do ({todoTasks.length})</h3>
                </div>
                <div className="tasks-column">
                  {todoTasks.map(task => (
                    <div
                      key={task.id}
                      className={`task-card ${isOverdue(task) ? 'overdue' : ''} ${selectedTasks.has(task.id) ? 'selected' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                    >
                      <input 
                        type="checkbox"
                        className="task-checkbox"
                        checked={selectedTasks.has(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                      />
                      <div className="task-priority" style={{ backgroundColor: getPriorityColor(task.priority) }}></div>
                      {task.projectId && (
                        <div className="task-project-badge" style={{ backgroundColor: getProjectColor(task.projectId) }}>
                          {getProjectName(task.projectId).substring(0, 12)}
                        </div>
                      )}
                      <div className="task-content">
                        <h4>{task.title}</h4>
                        {task.description && <p className="task-description">{task.description}</p>}
                        <div className="task-meta">
                          <span className="priority-badge">{getPriorityBadge(task.priority)}</span>
                          <span className="due-date">📅 {formatDueDate(task.dueDate)}</span>
                          {task.timeSpent > 0 && <span className="time-spent">⏱️ {task.timeSpent}m</span>}
                        </div>
                        {task.recurrence !== 'NONE' && <div className="recurrence-badge">🔄 {task.recurrence}</div>}
                      </div>
                      <div className="task-actions">
                        <button className="btn-pomodoro" onClick={() => startPomodoro(task.id)}>🍅</button>
                        <button className="btn-edit" onClick={() => { setSelectedTask(task); setFormData(task); setShowForm(true); }}>✏️</button>
                        <button className="btn-delete" onClick={() => handleDelete(task.id)}>🗑️</button>
                      </div>
                    </div>
                  ))}
                  {todoTasks.length === 0 && <div className="empty-column">No tasks here. Great start! 🎉</div>}
                </div>
              </div>

              <div className="kanban-column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'DOING')}>
                <div className="column-header">
                  <h3>⚡ In Progress ({doingTasks.length})</h3>
                </div>
                <div className="tasks-column">
                  {doingTasks.map(task => (
                    <div
                      key={task.id}
                      className={`task-card active ${isOverdue(task) ? 'overdue' : ''} ${selectedTasks.has(task.id) ? 'selected' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                    >
                      <input 
                        type="checkbox"
                        className="task-checkbox"
                        checked={selectedTasks.has(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                      />
                      <div className="task-priority" style={{ backgroundColor: getPriorityColor(task.priority) }}></div>
                      {task.projectId && (
                        <div className="task-project-badge" style={{ backgroundColor: getProjectColor(task.projectId) }}>
                          {getProjectName(task.projectId).substring(0, 12)}
                        </div>
                      )}
                      <div className="task-content">
                        <h4>{task.title}</h4>
                        {task.description && <p className="task-description">{task.description}</p>}
                        <div className="task-meta">
                          <span className="priority-badge">{getPriorityBadge(task.priority)}</span>
                          <span className="due-date">📅 {formatDueDate(task.dueDate)}</span>
                          {task.timeSpent > 0 && <span className="time-spent">⏱️ {task.timeSpent}m</span>}
                        </div>
                        {task.recurrence !== 'NONE' && <div className="recurrence-badge">🔄 {task.recurrence}</div>}
                      </div>
                      <div className="task-actions">
                        <button className="btn-pomodoro" onClick={() => startPomodoro(task.id)}>🍅</button>
                        <button className="btn-edit" onClick={() => { setSelectedTask(task); setFormData(task); setShowForm(true); }}>✏️</button>
                        <button className="btn-delete" onClick={() => handleDelete(task.id)}>🗑️</button>
                      </div>
                    </div>
                  ))}
                  {doingTasks.length === 0 && <div className="empty-column">Pick a task and get started! 💪</div>}
                </div>
              </div>

              <div className="kanban-column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'DONE')}>
                <div className="column-header">
                  <h3>✅ Done ({doneTasks.length})</h3>
                </div>
                <div className="tasks-column">
                  {doneTasks.map(task => (
                    <div
                      key={task.id}
                      className={`task-card completed ${selectedTasks.has(task.id) ? 'selected' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                    >
                      <input 
                        type="checkbox"
                        className="task-checkbox"
                        checked={selectedTasks.has(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                      />
                      <div className="task-priority" style={{ backgroundColor: getPriorityColor(task.priority) }}></div>
                      {task.projectId && (
                        <div className="task-project-badge" style={{ backgroundColor: getProjectColor(task.projectId) }}>
                          {getProjectName(task.projectId).substring(0, 12)}
                        </div>
                      )}
                      <div className="task-content">
                        <h4>{task.title}</h4>
                        {task.description && <p className="task-description">{task.description}</p>}
                        <div className="task-meta">
                          <span className="priority-badge">{getPriorityBadge(task.priority)}</span>
                          <span className="due-date">📅 {formatDueDate(task.dueDate)}</span>
                          {task.timeSpent > 0 && <span className="time-spent">⏱️ {task.timeSpent}m</span>}
                        </div>
                      </div>
                      <div className="task-actions">
                        <button className="btn-delete" onClick={() => handleDelete(task.id)}>🗑️</button>
                      </div>
                    </div>
                  ))}
                  {doneTasks.length === 0 && <div className="empty-column">All tasks completed! 🎉</div>}
                </div>
              </div>
            </div>
          )}

          {pomodoroActive && (
            <div className="pomodoro-timer-display">
              <div className="timer-content">
                <h2>🍅 Focus Time</h2>
                <div className="timer-display">{formatTime(timeRemaining)}</div>
                <button onClick={stopPomodoro} className="btn-stop-pomodoro">
                  Stop Timer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export { Tasks };
export default Tasks;
