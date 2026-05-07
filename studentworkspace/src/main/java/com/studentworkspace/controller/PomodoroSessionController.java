package com.studentworkspace.controller;

import com.studentworkspace.model.PomodoroSession;
import com.studentworkspace.service.PomodoroSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pomodoro")
@CrossOrigin(origins = "http://localhost:3001")
public class PomodoroSessionController {

    @Autowired
    private PomodoroSessionService pomodoroSessionService;

    @PostMapping("/session/record/{userId}")
    public ResponseEntity<Map<String, Object>> recordSession(
            @PathVariable Long userId,
            @RequestParam Integer durationMinutes,
            @RequestParam Boolean completed,
            @RequestParam String sessionType) {
        try {
            PomodoroSession session = pomodoroSessionService.recordSession(userId, durationMinutes, completed, sessionType);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Session recorded successfully");
            response.put("session", session);
            response.put("totalStudyHours", pomodoroSessionService.getTotalStudyHoursAsDecimal(userId));
            
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/work-session/{userId}")
    public ResponseEntity<Map<String, Object>> recordWorkSession(
            @PathVariable Long userId,
            @RequestParam Integer durationMinutes,
            @RequestParam Boolean completed) {
        try {
            PomodoroSession session = pomodoroSessionService.recordWorkSession(userId, durationMinutes, completed);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Work session recorded");
            response.put("session", session);
            response.put("totalStudyHours", pomodoroSessionService.getTotalStudyHoursAsDecimal(userId));
            
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PomodoroSession>> getUserSessions(@PathVariable Long userId) {
        List<PomodoroSession> sessions = pomodoroSessionService.getUserSessions(userId);
        return new ResponseEntity<>(sessions, HttpStatus.OK);
    }

    @GetMapping("/stats/{userId}")
    public ResponseEntity<Map<String, Object>> getUserStats(@PathVariable Long userId) {
        try {
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalStudyMinutes", pomodoroSessionService.getTotalStudyHours(userId));
            stats.put("totalStudyHours", pomodoroSessionService.getTotalStudyHoursAsDecimal(userId));
            stats.put("totalCompletedSessions", pomodoroSessionService.getTotalCompletedSessions(userId));
            stats.put("workSessions", pomodoroSessionService.getUserWorkSessions(userId).size());
            
            return new ResponseEntity<>(stats, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/completed/{userId}")
    public ResponseEntity<List<PomodoroSession>> getCompletedSessions(@PathVariable Long userId) {
        List<PomodoroSession> sessions = pomodoroSessionService.getUserCompletedSessions(userId);
        return new ResponseEntity<>(sessions, HttpStatus.OK);
    }

    @DeleteMapping("/session/{sessionId}")
    public ResponseEntity<String> deleteSession(@PathVariable Long sessionId) {
        try {
            pomodoroSessionService.deleteSession(sessionId);
            return new ResponseEntity<>("Session deleted successfully", HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
