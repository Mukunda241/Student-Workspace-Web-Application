package com.studentworkspace.repository;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.studentworkspace.model.Task;
import com.studentworkspace.model.TaskStatus;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByUserId(Long userId);
    
    // Paginated methods
    Page<Task> findByUserId(Long userId, Pageable pageable);
    Page<Task> findByProjectId(Long projectId, Pageable pageable);

    List<Task> findByProjectId(Long projectId);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.project.id = :projectId AND t.status = :status")
    Long countByProjectIdAndStatus(@Param("projectId") Long projectId, @Param("status") TaskStatus status);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.project.id = :projectId")
    Long countByProjectId(@Param("projectId") Long projectId);

    /**
     * OPTIMIZATION: Get top 3 most urgent tasks for a project.
     * Sorts by:
     * 1. Priority (HIGH > MEDIUM > LOW)
     * 2. Status (TODO > IN_PROGRESS > DONE)
     * 3. Deadline (earliest first)
     * 4. ID (for stable ordering)
     * 
     * This prevents displaying completed tasks and shows what needs attention first.
     */
    @Query(value = "SELECT * FROM tasks WHERE project_id = :projectId AND status != 'DONE' " +
            "ORDER BY CASE WHEN priority = 'HIGH' THEN 1 WHEN priority = 'MEDIUM' THEN 2 ELSE 3 END, " +
            "deadline ASC, id DESC LIMIT 3", nativeQuery = true)
    List<Task> findTopThreeTasksByProjectId(@Param("projectId") Long projectId);

    /**
     * Get all tasks for a user sorted by urgency (for dashboard/global view).
     */
    @Query("SELECT t FROM Task t WHERE t.user.id = :userId AND t.status != 'DONE' " +
            "ORDER BY CASE WHEN t.priority = 'HIGH' THEN 1 WHEN t.priority = 'MEDIUM' THEN 2 ELSE 3 END, " +
            "t.deadline ASC")
    List<Task> findUrgentTasksByUserId(@Param("userId") Long userId);
}
