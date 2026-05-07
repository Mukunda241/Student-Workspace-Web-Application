package com.studentworkspace.repository;

import com.studentworkspace.model.PomodoroSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PomodoroSessionRepository extends JpaRepository<PomodoroSession, Long> {

    List<PomodoroSession> findByUserId(Long userId);

    List<PomodoroSession> findByUserIdAndSessionType(Long userId, String sessionType);

    List<PomodoroSession> findByUserIdAndCompleted(Long userId, Boolean completed);

    @Query("SELECT SUM(ps.durationMinutes) FROM PomodoroSession ps WHERE ps.user.id = :userId AND ps.completed = true AND ps.sessionType = 'work'")
    Long getTotalStudyMinutesByUserId(@Param("userId") Long userId);

    @Query("SELECT SUM(ps.durationMinutes) FROM PomodoroSession ps WHERE ps.user.id = :userId AND ps.completed = true AND ps.sessionType = 'work' AND ps.createdAt >= :startDate")
    Long getTotalStudyMinutesByUserIdAndDateRange(@Param("userId") Long userId, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT COUNT(ps) FROM PomodoroSession ps WHERE ps.user.id = :userId AND ps.completed = true AND ps.sessionType = 'work'")
    Long getTotalCompletedSessionsByUserId(@Param("userId") Long userId);
}
