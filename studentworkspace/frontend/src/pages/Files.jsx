import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MainLayout } from '../components/MainLayout';
import { fileService } from '../services/authService';
import '../styles/files.css';

export const Files = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchFiles();
    } else if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fileService.getUserFiles(user.id);
      // Ensure files is always an array
      const filesData = Array.isArray(response.data) ? response.data : [];
      setFiles(filesData);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch files');
      setFiles([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    try {
      setError('');
      setUploading(true);

      const formData = new FormData();
      formData.append('file', selectedFile);

      // Upload to default projectId 1
      await fileService.uploadFile(1, user.id, formData);
      
      await fetchFiles();
      setSelectedFile(null);
      setShowUploadForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await fileService.deleteFile(fileId);
        await fetchFiles();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete file');
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return '📄';
    if (fileType.includes('pdf')) return '📕';
    if (fileType.includes('word') || fileType.includes('document')) return '📘';
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📗';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('video')) return '🎬';
    if (fileType.includes('audio')) return '🎵';
    return '📄';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="files-container">
      <nav className="navbar">
        <div className="nav-content">
          <h1>Student Workspace</h1>
          <div className="nav-links">
            <a href="/dashboard">Dashboard</a>
            <a href="/projects">Projects</a>
            <a href="/tasks">Tasks</a>
            <a href="/notes">Notes</a>
            <a href="/files" className="active">Files</a>
            <span className="user-info">{user?.name}</span>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </div>
        </div>
      </nav>

      <div className="files-content">
        <div className="files-header">
          <h2>📚 My Study Files</h2>
          <button 
            onClick={() => setShowUploadForm(!showUploadForm)} 
            className="btn-primary"
          >
            {showUploadForm ? 'Cancel' : '+ Upload File'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {showUploadForm && (
          <div className="upload-form-container">
            <form onSubmit={handleUpload} className="upload-form">
              <h3>Upload Study File</h3>

              <div className="form-group">
                <label htmlFor="file">Select File *</label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="file"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                  <span className="file-name">
                    {selectedFile ? selectedFile.name : 'Choose a file...'}
                  </span>
                </div>
                <small>Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, TXT, JPG, PNG, etc.</small>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload File'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowUploadForm(false);
                    setSelectedFile(null);
                  }} 
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="empty-state">
            <p>No files uploaded yet. Upload your study materials to get started!</p>
          </div>
        ) : (
          <div className="files-list">
            <div className="files-stats">
              <p>Total Files: <strong>{files.length}</strong></p>
              <p>Total Size: <strong>{formatFileSize(files.reduce((sum, f) => sum + (f.fileSize || 0), 0))}</strong></p>
            </div>

            <div className="files-table">
              <div className="table-header">
                <div className="col-icon">Type</div>
                <div className="col-name">File Name</div>
                <div className="col-size">Size</div>
                <div className="col-date">Uploaded</div>
                <div className="col-actions">Actions</div>
              </div>

              {files.map((file) => (
                <div key={file.id} className="table-row">
                  <div className="col-icon">
                    {getFileIcon(file.fileType)}
                  </div>
                  <div className="col-name">
                    <span className="file-name-text">{file.fileName}</span>
                    {file.fileType && <small className="file-type">{file.fileType}</small>}
                  </div>
                  <div className="col-size">
                    {formatFileSize(file.fileSize)}
                  </div>
                  <div className="col-date">
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </div>
                  <div className="col-actions">
                    <button 
                      onClick={() => handleDelete(file.id)} 
                      className="btn-delete"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
