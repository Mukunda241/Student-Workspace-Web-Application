import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MainLayout } from '../components/MainLayout';
import '../styles/notes.css';

const Notes = () => {
  const navigate = useNavigate();
  const { user } = React.useContext(AuthContext);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8082';

  // State Management
  const [notes, setNotes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNewNoteForm, setShowNewNoteForm] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteProject, setNewNoteProject] = useState('');
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const debounceTimer = useRef(null);

  // Fetch notes
  const fetchNotes = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/notes/user/${user.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
        extractTags(data);
      } else if (response.status === 401) {
        navigate('/login');
      }
      setError('');
    } catch (err) {
      setError('Failed to fetch notes');
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  }, [user, apiUrl, navigate]);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`${apiUrl}/api/projects/user/${user.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  }, [user, apiUrl]);

  // Extract tags from notes
  const extractTags = (notesList) => {
    const tagsSet = new Set();
    notesList.forEach(note => {
      const tagMatches = note.content?.match(/#\w+/g) || [];
      tagMatches.forEach(tag => tagsSet.add(tag));
    });
    setTags(Array.from(tagsSet).sort());
  };

  // Initial load
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchNotes();
    fetchProjects();
  }, [user, navigate, fetchNotes, fetchProjects]);

  // Debounce auto-save
  const autoSaveNote = useCallback((content) => {
    if (!currentNote) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(`${apiUrl}/api/notes/update/${currentNote.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            title: currentNote.title,
            content: content,
          }),
        });

        if (response.ok) {
          setSuccessMessage('✓ Saved');
          setTimeout(() => setSuccessMessage(''), 2000);
        } else if (response.status === 401) {
          navigate('/login');
        }
      } catch (err) {
        console.error('Error saving note:', err);
      }
    }, 2000);
  }, [currentNote, apiUrl, navigate]);

  // Handle content change
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setEditContent(newContent);
    autoSaveNote(newContent);
  };

  // Create new note
  const handleCreateNote = async () => {
    if (!newNoteTitle.trim() || !newNoteProject) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(
        `${apiUrl}/api/notes/create/${user.id}/${newNoteProject}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            title: newNoteTitle,
            content: '# ' + newNoteTitle + '\n\n',
          }),
        }
      );

      if (response.ok) {
        const newNote = await response.json();
        setNotes([newNote, ...notes]);
        setCurrentNote(newNote);
        setEditContent(newNote.content);
        setNewNoteTitle('');
        setNewNoteProject('');
        setShowNewNoteForm(false);
        setSuccessMessage('Note created');
        setTimeout(() => setSuccessMessage(''), 2000);
      } else if (response.status === 401) {
        navigate('/login');
      }
    } catch (err) {
      setError('Failed to create note');
      console.error('Error creating note:', err);
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Delete this note? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/notes/delete/${noteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setNotes(notes.filter(n => n.id !== noteId));
        if (currentNote?.id === noteId) {
          setCurrentNote(null);
          setEditContent('');
        }
        setSuccessMessage('Note deleted');
        setTimeout(() => setSuccessMessage(''), 2000);
      } else if (response.status === 401) {
        navigate('/login');
      }
    } catch (err) {
      setError('Failed to delete note');
      console.error('Error deleting note:', err);
    }
  };

  // Handle note selection
  const handleSelectNote = (note) => {
    setCurrentNote(note);
    setEditContent(note.content);
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${apiUrl}/api/files/upload/${user.id}/${currentNote.projectId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const fileData = await response.json();
        const markdownLink = `![${file.name}](${fileData.filePath})`;
        const newContent = editContent + '\n' + markdownLink + '\n';
        setEditContent(newContent);
        autoSaveNote(newContent);
        setSuccessMessage('Image uploaded');
        setTimeout(() => setSuccessMessage(''), 2000);
      } else if (response.status === 401) {
        navigate('/login');
      }
    } catch (err) {
      setError('Failed to upload image');
      console.error('Error uploading image:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const files = e.dataTransfer?.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        try {
          setUploadingImage(true);
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch(
            `${apiUrl}/api/files/upload/${user.id}/${currentNote?.projectId}`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
              body: formData,
            }
          );

          if (response.ok) {
            const fileData = await response.json();
            const markdownLink = `![${file.name}](${fileData.filePath})`;
            const newContent = editContent + '\n' + markdownLink + '\n';
            setEditContent(newContent);
            autoSaveNote(newContent);
            setSuccessMessage('Image uploaded');
            setTimeout(() => setSuccessMessage(''), 2000);
          }
        } catch (err) {
          setError('Failed to upload image');
          console.error('Error uploading image:', err);
        } finally {
          setUploadingImage(false);
        }
      }
    }
  };

  // Filter and search notes
  const filteredNotes = notes.filter(note => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProject =
      selectedProject === 'all' || note.projectId === parseInt(selectedProject);

    const matchesTag =
      selectedTag === '' ||
      note.content?.includes(selectedTag);

    return matchesSearch && matchesProject && matchesTag;
  });

  // Get project name by ID
  const getProjectName = (projectId) => {
    return projects.find(p => p.id === projectId)?.title || 'Unassigned';
  };

  // Group notes by project
  const groupedNotes = {};
  filteredNotes.forEach(note => {
    const projectName = getProjectName(note.projectId);
    if (!groupedNotes[projectName]) {
      groupedNotes[projectName] = [];
    }
    groupedNotes[projectName].push(note);
  });

  // Render markdown preview with basic styling
  const renderMarkdownPreview = () => {
    try {
      let html = editContent
        .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
        .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
        .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/^- (.*?)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/\n/g, '<br>')
        .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; border-radius: 8px; margin: 10px 0;">')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
      return html;
    } catch (err) {
      console.error('Error rendering markdown:', err);
      return '<p>Error rendering preview</p>';
    }
  };

  return (
    <div className="notes-container">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-content">
          <h1 className="app-title">📚 Student Workspace</h1>
          <div className="nav-links">
            <a href="/dashboard" className="nav-link">Dashboard</a>
            <a href="/projects" className="nav-link">Projects</a>
            <a href="/tasks" className="nav-link">Tasks</a>
            <a href="/notes" className="nav-link active">Notes</a>
          </div>
          <div className="nav-right">
            <div className="user-info">{user?.name}</div>
            <button
              className="btn-logout"
              onClick={() => {
                localStorage.removeItem('token');
                navigate('/login');
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="notes-main">
        {/* Left Sidebar */}
        <aside className={`notes-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <h2>📝 Notes</h2>
            <button
              className="btn-toggle-sidebar"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title="Toggle sidebar"
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>

          {!sidebarCollapsed && (
            <>
              {/* Create Note Button */}
              <button
                className="btn-create-note"
                onClick={() => setShowNewNoteForm(!showNewNoteForm)}
              >
                + New Note
              </button>

              {/* Create Note Form */}
              {showNewNoteForm && (
                <div className="create-note-form">
                  <input
                    type="text"
                    placeholder="Note title..."
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="form-input"
                  />
                  <select
                    value={newNoteProject}
                    onChange={(e) => setNewNoteProject(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Select project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                  <div className="form-buttons">
                    <button
                      className="btn-primary"
                      onClick={handleCreateNote}
                      disabled={!newNoteTitle.trim() || !newNoteProject}
                    >
                      Create
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setShowNewNoteForm(false);
                        setNewNoteTitle('');
                        setNewNoteProject('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="search-box">
                <input
                  type="text"
                  placeholder="🔍 Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              {/* Project Filter */}
              <div className="filter-section">
                <div className="filter-label">Filter by Project</div>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Projects</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tag Filter */}
              {tags.length > 0 && (
                <div className="tags-section">
                  <div className="tags-label">Tags</div>
                  <button
                    className={`tag-button ${selectedTag === '' ? 'active' : ''}`}
                    onClick={() => setSelectedTag('')}
                  >
                    All ({notes.length})
                  </button>
                  {tags.map(tag => {
                    const tagCount = notes.filter(n => n.content?.includes(tag)).length;
                    return (
                      <button
                        key={tag}
                        className={`tag-button ${selectedTag === tag ? 'active' : ''}`}
                        onClick={() => setSelectedTag(tag)}
                      >
                        {tag} ({tagCount})
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Notes List */}
              <div className="notes-list">
                {filteredNotes.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <p>No notes found</p>
                  </div>
                ) : (
                  Object.entries(groupedNotes).map(([projectName, projectNotes]) => (
                    <div key={projectName} className="notes-group">
                      <div className="group-title">{projectName}</div>
                      {projectNotes.map(note => (
                        <div
                          key={note.id}
                          className={`note-item ${currentNote?.id === note.id ? 'active' : ''}`}
                          onClick={() => handleSelectNote(note)}
                        >
                          <div className="note-item-content">
                            <div className="note-title">{note.title}</div>
                            <div className="note-preview">
                              {note.content?.substring(0, 50).replace(/#/g, '').trim()}...
                            </div>
                          </div>
                          <button
                            className="btn-delete-note"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                            title="Delete note"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </aside>

        {/* Right Editor */}
        <div className="editor-container">
          {currentNote ? (
            <>
              <div className="editor-header">
                <div className="editor-title-section">
                  <h2 className="editor-title">{currentNote.title}</h2>
                  <div className="note-meta">
                    Project: <strong>{getProjectName(currentNote.projectId)}</strong>
                  </div>
                </div>
                {successMessage && <div className="success-badge">{successMessage}</div>}
              </div>

              <div
                className="editor-workspace"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {uploadingImage && <div className="uploading-overlay">📤 Uploading...</div>}

                {/* Editor */}
                <div className="editor-split">
                  <div className="editor-pane">
                    <div className="pane-header">
                      <label>📝 Markdown</label>
                      <div className="editor-toolbar">
                        <button
                          className="toolbar-button"
                          title="Upload image"
                          onClick={() =>
                            document.getElementById('image-upload-input')?.click()
                          }
                        >
                          🖼️ Image
                        </button>
                        <input
                          id="image-upload-input"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: 'none' }}
                        />
                      </div>
                    </div>
                    <textarea
                      value={editContent}
                      onChange={handleContentChange}
                      className="markdown-editor"
                      placeholder="# Write your note here...

Use Markdown syntax:
- **bold** for bold text
- *italic* for italic text
- `code` for inline code
- # Heading 1
- ## Heading 2
- [Link](url)
- ![Image](url)

Use #tags for organization"
                    />
                    <div className="editor-hint">💾 Auto-saves after 2 seconds of inactivity</div>
                  </div>

                  {/* Preview */}
                  <div className="preview-pane">
                    <div className="pane-header">
                      <label>👁️ Preview</label>
                    </div>
                    <div
                      className="markdown-preview"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdownPreview(),
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-editor">
              <div className="empty-icon">✍️</div>
              <h3>No note selected</h3>
              <p>Create a new note or select one from the sidebar to start writing</p>
              <button className="btn-primary" onClick={() => setShowNewNoteForm(true)}>
                + Create New Note
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && <div className="loading">Loading notes...</div>}
    </div>
  );
};

export { Notes };
export default Notes;
