import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MainLayout } from '../components/MainLayout';
import { projectService } from '../services/authService';
import { MdAssignment, MdRocketLaunch, MdSchedule, MdTrendingUp, MdFolderOpen, MdAdd, MdCheckCircle, MdDone, MdPlayArrow, MdViewWeek } from 'react-icons/md';
import '../styles/projects.css';

export const Projects = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [projectResources, setProjectResources] = useState({});
  const [newResource, setNewResource] = useState({ name: '', url: '' });
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'deadline', 'progress', 'activity'
  const [focusMode, setFocusMode] = useState(null); // null or project.id
  const [showTemplates, setShowTemplates] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'Planning',
    color: '#2563eb',
    category: 'Personal', // Personal, University, Work
  });

  // Fetch projects on component mount
  useEffect(() => {
    if (user?.id) {
      fetchProjects();
    } else if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      console.log('Fetching projects with tasks for user ID:', user.id);
      // Use optimized endpoint that fetches projects with top 3 tasks in one query
      const response = await projectService.getUserProjectsWithTasks(user.id);
      console.log('API Response:', response);
      
      const projectsData = Array.isArray(response.data) ? response.data : [];
      setProjects(projectsData);
      setError('');
    } catch (err) {
      console.error('Fetch projects error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch projects';
      setError(errorMessage);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      setError('Title is required');
      return;
    }

    try {
      setError('');
      
      const submitData = {
        title: formData.title,
        description: formData.description || null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        status: formData.status,
        color: formData.color,
      };
      
      if (editingId) {
        await projectService.updateProject(editingId, submitData);
        setEditingId(null);
      } else {
        await projectService.createProject(user.id, submitData);
      }
      
      await fetchProjects();
      resetForm();
    } catch (err) {
      console.error('Error details:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save project';
      setError(errorMessage);
    }
  };

  const handleDelete = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project? All associated tasks and notes will also be deleted.')) {
      try {
        await projectService.deleteProject(projectId);
        await fetchProjects();
        setSelectedProject(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete project');
      }
    }
  };

  const handleEdit = (project) => {
    setEditingId(project.id);
    setFormData({
      title: project.title,
      description: project.description || '',
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      status: project.status || 'Planning',
      color: project.color || '#2563eb',
    });
    setShowForm(true);
    setSelectedProject(null);
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    // Store current project in session
    sessionStorage.setItem('currentProjectId', project.id);
    sessionStorage.setItem('currentProjectTitle', project.title);
  };

  const handleStatusChange = async (projectId, newStatus) => {
    try {
      const project = projects.find(p => p.id === projectId);
      await projectService.updateProject(projectId, {
        ...project,
        status: newStatus
      });
      await fetchProjects();
    } catch (err) {
      setError('Failed to update project status');
    }
  };

  const handleAddResource = () => {
    if (newResource.name && newResource.url) {
      if (!projectResources[selectedProject.id]) {
        projectResources[selectedProject.id] = [];
      }
      projectResources[selectedProject.id].push(newResource);
      setNewResource({ name: '', url: '' });
      // In a real app, you'd persist this to the backend
      localStorage.setItem('projectResources', JSON.stringify(projectResources));
    }
  };

  const handleDeleteResource = (projectId, index) => {
    projectResources[projectId].splice(index, 1);
    localStorage.setItem('projectResources', JSON.stringify(projectResources));
    setProjectResources({ ...projectResources });
  };

  const calculateProgress = (completed, total) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  // NEW: Calculate comprehensive stats for the dashboard
  const calculateStats = () => {
    const activeProjects = projects.filter(p => p.status === 'Active').length;
    const today = new Date();
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const approachingDeadlines = projects.filter(p => {
      if (!p.endDate) return false;
      const endDate = new Date(p.endDate);
      return endDate >= today && endDate <= sevenDaysFromNow && p.status !== 'Completed';
    }).length;

    const overallCompletion = projects.length > 0 
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
      : 0;

    return {
      totalProjects: projects.length,
      activeProjects,
      approachingDeadlines,
      overallCompletion,
    };
  };

  // NEW: Calculate total hours spent (sum of task time tracking)
  const calculateTotalHours = (project) => {
    if (!project.topTasks) return 0;
    return project.topTasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0) / 60;
  };

  // NEW: Check if project has approaching deadline
  const hasApproachingDeadline = (project) => {
    if (!project.endDate) return false;
    const today = new Date();
    const endDate = new Date(project.endDate);
    const daysUntil = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 7 && project.status !== 'Completed';
  };

  // NEW: Apply project template
  const applyTemplate = (templateName) => {
    let templateData = {
      description: '',
      status: 'Planning',
    };

    if (templateName === 'exam-prep') {
      templateData.description = 'Exam Preparation Project\n\nKey Tasks:\n- Review Syllabus\n- Study Core Concepts\n- Solve Practice Problems\n- Complete Mock Tests\n- Final Revision\n- Rest Day Before Exam';
    } else if (templateName === 'software-project') {
      templateData.description = 'Software Development Project\n\nPhases:\n1. Requirements Gathering\n2. System Design\n3. Implementation\n4. Testing & QA\n5. Deployment\n6. Maintenance & Support';
    }

    setFormData(prev => ({
      ...prev,
      ...templateData,
    }));
    setShowTemplates(false);
  };

  // NEW: Sort projects based on selected criteria
  const getSortedProjects = (projectsToSort) => {
    const sorted = [...projectsToSort];
    
    switch (sortBy) {
      case 'deadline':
        return sorted.sort((a, b) => {
          if (!a.endDate) return 1;
          if (!b.endDate) return -1;
          return new Date(a.endDate) - new Date(b.endDate);
        });
      case 'progress':
        return sorted.sort((a, b) => (b.progress || 0) - (a.progress || 0));
      case 'activity':
        return sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      case 'recent':
      default:
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  };

  // NEW: Filter projects by category and status
  const getFilteredAndSortedProjects = () => {
    let filtered = projects;

    // Apply status filter
    if (filterStatus !== 'All') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    // Apply category filter
    if (filterCategory !== 'All') {
      filtered = filtered.filter(p => (p.category || 'Personal') === filterCategory);
    }

    // Apply sorting
    return getSortedProjects(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Planning': return '#f59e0b';
      case 'Active': return '#10b981';
      case 'Completed': return '#6b7280';
      default: return '#2563eb';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Planning': return '📋';
      case 'Active': return '🚀';
      case 'Completed': return '✅';
      default: return '📁';
    }
  };

  /**
   * Helper: Get visual indicator color for task priority/status
   * Returns color based on: priority + status + overdue flag
   */
  const getTaskPriorityColor = (task) => {
    // If overdue, always show red
    if (task.isOverdue) {
      return '#ef4444'; // Red for overdue
    }
    
    // Otherwise use priority
    switch (task.priority) {
      case 'HIGH': return '#ef4444'; // Red
      case 'MEDIUM': return '#f59e0b'; // Amber/Orange
      case 'LOW': return '#3b82f6'; // Blue
      default: return '#9ca3af'; // Gray
    }
  };

  /**
   * Helper: Get task status indicator (dot color)
   */
  const getTaskStatusDot = (task) => {
    switch (task.status) {
      case 'DONE': return '#10b981'; // Green - completed
      case 'IN_PROGRESS': return '#8b5cf6'; // Purple - in progress
      case 'TODO': return '#6b7280'; // Gray - not started
      default: return '#9ca3af';
    }
  };

  /**
   * Helper: Get task priority icon
   */
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'HIGH': return '🔴';
      case 'MEDIUM': return '🟠';
      case 'LOW': return '🔵';
      default: return '⚪';
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'Planning',
      color: '#2563eb',
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredProjects = filterStatus === 'All' 
    ? projects 
    : projects.filter(p => p.status === filterStatus);

  if (!user) {
    return null;
  }

  return (
    <div className="projects-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-content">
          <h1 className="app-title">🎓 Student Workspace</h1>
          <div className="nav-links">
            <a href="/dashboard" className="nav-link">Dashboard</a>
            <a href="/projects" className="nav-link active">📁 Projects</a>
            <a href="/tasks" className="nav-link">✅ Tasks</a>
            <a href="/notes" className="nav-link">📝 Notes</a>
            <a href="/files" className="nav-link">📚 Files</a>
            <a href="/contests" className="nav-link">🏆 Contests</a>
            <div className="nav-right">
              <span className="user-info">👤 {user?.name}</span>
              <button onClick={handleLogout} className="btn-logout">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="projects-content">
        {/* Projects Header with Stats Overview */}
        <section className="projects-header">
          <div className="header-title">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
                boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)'
              }}>
                <MdFolderOpen size={40} style={{color: '#60a5fa'}} />
              </div>
              <h2 style={{fontSize: '2rem', fontWeight: '700', color: '#1f2937', margin: 0}}>Projects Hub</h2>
            </div>
            <p style={{fontSize: '1rem', color: '#6b7280', marginTop: '0.5rem'}}>Organize your academic work into projects</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            <MdAdd size={20} />
            {showForm ? 'Cancel' : 'New Project'}
          </button>
        </section>

        {/* NEW: Quick Stats Dashboard */}
        {!focusMode && projects.length > 0 && (
          <section className="stats-overview">
            <div className="stat-card">
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                marginRight: '1rem'
              }}>
                <MdAssignment size={28} style={{color: '#60a5fa'}} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Total Projects</span>
                <span className="stat-value">{calculateStats().totalProjects}</span>
              </div>
            </div>
            <div className="stat-card">
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                marginRight: '1rem'
              }}>
                <MdRocketLaunch size={28} style={{color: '#6ee7b7'}} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Active Now</span>
                <span className="stat-value">{calculateStats().activeProjects}</span>
              </div>
            </div>
            <div className="stat-card">
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
                boxShadow: '0 4px 12px rgba(180, 83, 9, 0.25)',
                marginRight: '1rem'
              }}>
                <MdSchedule size={28} style={{color: '#fcd34d'}} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Due Soon (7 days)</span>
                <span className="stat-value">{calculateStats().approachingDeadlines}</span>
              </div>
            </div>
            <div className="stat-card">
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                marginRight: '1rem'
              }}>
                <MdTrendingUp size={28} style={{color: '#e9d5ff'}} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Overall Progress</span>
                <span className="stat-value">{calculateStats().overallCompletion}%</span>
              </div>
            </div>
          </section>
        )}

        {error && <div className="error-message">❌ {error}</div>}

        {/* Create/Edit Form */}
        {showForm && (
          <section className="create-project-section">
            {/* Project Templates */}
            {!editingId && (
              <div className="template-selector">
                <h3>Quick Start with Templates</h3>
                <div className="template-grid">
                  <button
                    className="template-card"
                    onClick={() => applyTemplate('exam-prep')}
                  >
                    <div className="template-icon">📚</div>
                    <h4>Exam Prep</h4>
                    <p>Review, practice & prepare for exams</p>
                  </button>
                  <button
                    className="template-card"
                    onClick={() => applyTemplate('software-project')}
                  >
                    <div className="template-icon">💻</div>
                    <h4>Software Project</h4>
                    <p>Requirements, coding & testing</p>
                  </button>
                  <button
                    className="template-card"
                    onClick={() => setShowTemplates(!showTemplates)}
                  >
                    <div className="template-icon">✏️</div>
                    <h4>Blank Project</h4>
                    <p>Start from scratch</p>
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="project-form">
              <h3>{editingId ? 'Edit Project' : 'Create New Project'}</h3>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="title">Project Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Data Structures, Internship Hunt"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="color">Color Tag</label>
                  <div className="color-picker">
                    <input
                      type="color"
                      id="color"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                    />
                    <span className="color-preview" style={{ backgroundColor: formData.color }}></span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="Personal">🏠 Personal</option>
                    <option value="University">🎓 University</option>
                    <option value="Work">💼 Work</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your project goals and details"
                  rows="3"
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="startDate">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endDate">End Date</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="Planning">📋 Planning</option>
                    <option value="Active">🚀 Active</option>
                    <option value="Completed">✅ Completed</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingId ? 'Update Project' : 'Create Project'}
                </button>
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* NEW: Advanced Filter & Sort Controls */}
        {!focusMode && (
          <section className="filter-section">
            <div className="filter-group">
              <div className="filter-tabs">
                <span className="filter-label">Status:</span>
                {['All', 'Planning', 'Active', 'Completed'].map(status => (
                  <button
                    key={status}
                    className={`filter-tab ${filterStatus === status ? 'active' : ''}`}
                    onClick={() => setFilterStatus(status)}
                  >
                    {status === 'All' ? '📋' : status === 'Planning' ? '📋' : status === 'Active' ? '🚀' : '✅'}
                    {' '}{status}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <div className="filter-tabs">
                <span className="filter-label">Category:</span>
                {['All', 'Personal', 'University', 'Work'].map(category => (
                  <button
                    key={category}
                    className={`filter-tab ${filterCategory === category ? 'active' : ''}`}
                    onClick={() => setFilterCategory(category)}
                  >
                    {category === 'All' ? '📁' : category === 'Personal' ? '🏠' : category === 'University' ? '🎓' : '💼'}
                    {' '}{category}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <div className="sort-control">
                <span className="filter-label">Sort by:</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                  <option value="recent">📅 Recently Created</option>
                  <option value="activity">📈 Recent Activity</option>
                  <option value="deadline">⏰ Deadline (Soon First)</option>
                  <option value="progress">📊 Progress (High First)</option>
                </select>
              </div>
              <span className="project-count">({getFilteredAndSortedProjects().length} projects)</span>
            </div>
          </section>
        )}

        {loading && <div className="loading">Loading your projects...</div>}

        {/* Projects Grid */}
        {!loading && getFilteredAndSortedProjects().length > 0 ? (
          <section className={`projects-grid ${focusMode ? 'focus-mode' : ''}`}>
            {getFilteredAndSortedProjects().map((project) => {
              // Skip non-focused projects in focus mode
              if (focusMode && project.id !== focusMode) return null;

              const progress = calculateProgress(project.completedTasks, project.totalTasks);
              const lastOpened = new Date(project.updatedAt).toLocaleDateString();
              const totalHours = calculateTotalHours(project);

              return (
                <div 
                  key={project.id} 
                  className={`project-card ${focusMode === project.id ? 'focus-card' : ''}`}
                  style={{ borderLeftColor: project.color || '#2563eb' }}
                  onClick={() => handleProjectClick(project)}
                >
                  {/* Badge for Approaching Deadline */}
                  {hasApproachingDeadline(project) && (
                    <div className="deadline-badge">⏰ Due Soon</div>
                  )}

                  {/* Card Header */}
                  <div className="card-header-section">
                    <div className="project-title-row">
                      <h3>{getStatusIcon(project.status)} {project.title}</h3>
                      <span className="status-badge" style={{ backgroundColor: getStatusColor(project.status) }}>
                        {project.status}
                      </span>
                    </div>
                    <p className="last-opened">Last opened: {lastOpened}</p>
                  </div>

                  {/* Card Body */}
                  <div className="card-body">
                    {project.description && (
                      <p className="project-description">{project.description.substring(0, 100)}...</p>
                    )}

                    {/* NEW: Time Tracking Label */}
                    {totalHours > 0 && (
                      <div className="time-tracking">
                        <span className="time-icon">⏱️</span>
                        <span className="time-value">{totalHours.toFixed(1)}h spent</span>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="progress-section">
                      <div className="progress-info">
                        <span className="progress-label">Task Progress</span>
                        <span className="progress-percentage">{progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="task-count">{project.completedTasks}/{project.totalTasks} tasks</span>
                    </div>

                    {/* Date Range */}
                    {(project.startDate || project.endDate) && (
                      <div className="date-range">
                        <span className="date-label">📅</span>
                        <span>
                          {project.startDate && new Date(project.startDate).toLocaleDateString()}
                          {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString()}`}
                        </span>
                      </div>
                    )}

                    {/* Task Preview: Top 3 Most Urgent Tasks */}
                    {project.topTasks && project.topTasks.length > 0 && (
                      <div className="task-preview-section">
                        <div className="task-preview-header">
                          <h4>📌 Urgent Tasks ({project.topTasks.length})</h4>
                        </div>
                        <ul className="task-preview-list">
                          {project.topTasks.map((task, idx) => (
                            <li key={task.id} className="task-preview-item">
                              <div className="task-preview-indicator" style={{ 
                                backgroundColor: getTaskPriorityColor(task),
                                borderLeft: `3px solid ${getTaskStatusDot(task)}`
                              }}></div>
                              <div className="task-preview-content">
                                <span className="task-title" title={task.title}>
                                  {getPriorityIcon(task.priority)} {task.title.substring(0, 35)}
                                  {task.title.length > 35 ? '...' : ''}
                                </span>
                                <span className={`task-status-badge task-status-${task.status.toLowerCase()}`}>
                                  {task.status === 'TODO' ? '📋' : task.status === 'IN_PROGRESS' ? '⏳' : '✅'} 
                                  {task.status.replace(/_/g, ' ')}
                                </span>
                              </div>
                              {task.isOverdue && (
                                <span className="task-overdue-badge">⚠️ Overdue</span>
                              )}
                            </li>
                          ))}
                        </ul>
                        {project.totalTasks > 3 && (
                          <div className="task-preview-more">
                            <span>+{project.totalTasks - 3} more tasks</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer - Actions */}
                  <div className="card-footer">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tasks?projectId=${project.id}`);
                      }}
                      className="card-action-btn view-tasks"
                      title="View tasks for this project"
                    >
                      📋 Tasks
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFocusMode(focusMode === project.id ? null : project.id);
                      }}
                      className={`card-action-btn focus ${focusMode === project.id ? 'active' : ''}`}
                      title="Enter Focus Mode (Zen Mode)"
                    >
                      {focusMode === project.id ? '🔍 Exit Focus' : '🎯 Focus'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                        setShowResourcesModal(true);
                      }}
                      className="card-action-btn resources"
                      title="Manage project resources"
                    >
                      🔗 Resources
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(project);
                      }}
                      className="card-action-btn edit"
                      title="Edit project"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(project.id);
                      }}
                      className="card-action-btn delete"
                      title="Delete project"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Status Pipeline */}
                  <div className="status-pipeline">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(project.id, 'Planning');
                      }}
                      className={`pipeline-btn ${project.status === 'Planning' ? 'active' : ''}`}
                    >
                      📋
                    </button>
                    <div className="pipeline-arrow">→</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(project.id, 'Active');
                      }}
                      className={`pipeline-btn ${project.status === 'Active' ? 'active' : ''}`}
                    >
                      🚀
                    </button>
                    <div className="pipeline-arrow">→</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(project.id, 'Completed');
                      }}
                      className={`pipeline-btn ${project.status === 'Completed' ? 'active' : ''}`}
                    >
                      ✅
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        ) : !loading && getFilteredAndSortedProjects().length === 0 ? (
          <section className="empty-state">
            <div className="empty-icon">📁</div>
            <h3>No projects match your filters</h3>
            <p>Try adjusting your filters or create a new project.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              ➕ Create New Project
            </button>
          </section>
        ) : null}
      </div>

      {/* Resources Modal */}
      {showResourcesModal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowResourcesModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📚 {selectedProject.title} - Resources</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowResourcesModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Add Resource Form */}
              <div className="add-resource-form">
                <h4>Add Resource</h4>
                <div className="form-grid">
                  <input
                    type="text"
                    placeholder="Resource name (e.g., Course Syllabus)"
                    value={newResource.name}
                    onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                  />
                  <input
                    type="url"
                    placeholder="URL (e.g., https://example.com)"
                    value={newResource.url}
                    onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                  />
                  <button 
                    onClick={handleAddResource}
                    className="btn-primary"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Resources List */}
              <div className="resources-list">
                <h4>Project Resources</h4>
                {projectResources[selectedProject.id] && projectResources[selectedProject.id].length > 0 ? (
                  <ul>
                    {projectResources[selectedProject.id].map((resource, index) => (
                      <li key={index} className="resource-item">
                        <div className="resource-info">
                          <a href={resource.url} target="_blank" rel="noopener noreferrer">
                            🔗 {resource.name}
                          </a>
                        </div>
                        <button
                          onClick={() => handleDeleteResource(selectedProject.id, index)}
                          className="btn-delete-small"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-resources">No resources added yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
