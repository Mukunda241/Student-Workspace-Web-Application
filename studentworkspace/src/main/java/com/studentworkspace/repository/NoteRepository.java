package com.studentworkspace.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.studentworkspace.model.Note;
import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByProjectId(Long projectId);
    List<Note> findByUserId(Long userId);
    
    // Paginated methods
    Page<Note> findByProjectId(Long projectId, Pageable pageable);
    Page<Note> findByUserId(Long userId, Pageable pageable);
}
