package com.studentworkspace.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.studentworkspace.model.StudyFile;
import com.studentworkspace.model.Project;
import com.studentworkspace.model.User;
import com.studentworkspace.repository.StudyFileRepository;
import com.studentworkspace.repository.ProjectRepository;
import com.studentworkspace.repository.UserRepository;
import com.studentworkspace.exception.ResourceNotFoundException;
import java.util.List;

@Service
public class StudyFileService {

    @Autowired
    private StudyFileRepository studyFileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    public StudyFile uploadFile(Long userId, Long projectId, StudyFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        file.setUser(user);
        file.setProject(project);
        return studyFileRepository.save(file);
    }

    public List<StudyFile> getProjectFiles(Long projectId) {
        return studyFileRepository.findByProjectId(projectId);
    }

    public List<StudyFile> getUserFiles(Long userId) {
        return studyFileRepository.findByUserId(userId);
    }

    public StudyFile getFileById(Long id) {
        return studyFileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));
    }

    public void deleteFile(Long id) {
        studyFileRepository.deleteById(id);
    }

    public List<StudyFile> getAllFiles() {
        return studyFileRepository.findAll();
    }
}
