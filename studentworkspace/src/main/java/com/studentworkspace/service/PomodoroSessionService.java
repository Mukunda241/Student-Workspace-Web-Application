package com.studentworkspace.service;

import com.studentworkspace.model.PomodoroSession;
import com.studentworkspace.model.User;
import com.studentworkspace.repository.PomodoroSessionRepository;
import com.studentworkspace.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PomodoroSessionService {

    @Autowired
    private PomodoroSessionRepository pomodoroSessionRepository;

    @Autowired
    private UserRepository userRepository;

    public PomodoroSession recordSession(Long userId, Integer durationMinutes, Boolean completed, String sessionType) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        PomodoroSession session = new PomodoroSession(user, durationMinutes, completed, sessionType);
        return pomodoroSessionRepository.save(session);
    }

    public PomodoroSession recordWorkSession(Long userId, Integer durationMinutes, Boolean completed) {
        return recordSession(userId, durationMinutes, completed, "work");
    }

    public PomodoroSession recordBreakSession(Long userId, Integer durationMinutes, Boolean completed) {
        return recordSession(userId, durationMinutes, completed, "break");
    }

    public List<PomodoroSession> getUserSessions(Long userId) {
        return pomodoroSessionRepository.findByUserId(userId);
    }

    public List<PomodoroSession> getUserWorkSessions(Long userId) {
        return pomodoroSessionRepository.findByUserIdAndSessionType(userId, "work");
    }

    public List<PomodoroSession> getUserCompletedSessions(Long userId) {
        return pomodoroSessionRepository.findByUserIdAndCompleted(userId, true);
    }

    public Long getTotalStudyHours(Long userId) {
        Long totalMinutes = pomodoroSessionRepository.getTotalStudyMinutesByUserId(userId);
        return totalMinutes != null ? totalMinutes : 0L;
    }

    public Long getTotalCompletedSessions(Long userId) {
        Long sessions = pomodoroSessionRepository.getTotalCompletedSessionsByUserId(userId);
        return sessions != null ? sessions : 0L;
    }

    public Double getTotalStudyHoursAsDecimal(Long userId) {
        Long minutes = getTotalStudyHours(userId);
        return (double) minutes / 60;
    }

    public List<PomodoroSession> getSessions(Long userId, LocalDateTime startDate) {
        // Get all sessions within date range
        return getUserSessions(userId).stream()
            .filter(session -> session.getCreatedAt().isAfter(startDate))
            .toList();
    }

    public void deleteSession(Long sessionId) {
        pomodoroSessionRepository.deleteById(sessionId);
    }
}
