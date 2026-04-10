package com.studentworkspace.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.studentworkspace.model.Project;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByUserId(Long userId);
    
    // Paginated methods
    Page<Project> findByUserId(Long userId, Pageable pageable);
    
    /**
     * OPTIMIZED QUERY: Fetch projects for a user using DISTINCT to avoid N+1 problem.
     * In conjunction with TaskRepository, this fetches all projects with their tasks
     * in a single efficient query with proper LEFT JOINs.
     */
    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN FETCH p.tasks t WHERE p.user.id = :userId ORDER BY p.id DESC")
    List<Project> findByUserIdWithTasks(@Param("userId") Long userId);
}
