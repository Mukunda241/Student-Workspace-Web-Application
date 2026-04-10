package com.studentworkspace.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.studentworkspace.model.StudyFile;
import java.util.List;

public interface StudyFileRepository extends JpaRepository<StudyFile, Long> {
    List<StudyFile> findByProjectId(Long projectId);
    List<StudyFile> findByUserId(Long userId);
    
    // Paginated methods
    Page<StudyFile> findByProjectId(Long projectId, Pageable pageable);
    Page<StudyFile> findByUserId(Long userId, Pageable pageable);
}
