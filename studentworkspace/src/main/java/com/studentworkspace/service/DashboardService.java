package com.studentworkspace.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.studentworkspace.model.Contest;
import com.studentworkspace.model.Task;
import com.studentworkspace.model.TaskStatus;
import com.studentworkspace.repository.ContestRepository;
import com.studentworkspace.repository.ProjectRepository;
import com.studentworkspace.repository.TaskRepository;
import com.studentworkspace.dto.DashboardResponse;

@Service
public class DashboardService {

    private static final Logger logger = LoggerFactory.getLogger(DashboardService.class);

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ContestRepository contestRepository;

    /**
     * Get complete dashboard summary for a user
     * Aggregates: user stats, urgent tasks, upcoming contests
     */
    public DashboardResponse getDashboardSummary(Long userId) {
        logger.info("Service: Getting dashboard summary for userId: " + userId);
        try {
            // 1. User Statistics
            logger.info("Service: Fetching user stats...");
            DashboardResponse.UserStatsDTO userStats = getUserStats(userId);
            logger.info("Service: User stats fetched: tasks=" + userStats.getTotalTasks());

            // 2. Urgent Tasks (Top 3 by deadline)
            logger.info("Service: Fetching urgent tasks...");
            List<DashboardResponse.UrgentTaskDTO> urgentTasks = getUrgentTasks(userId);
            logger.info("Service: Urgent tasks fetched: count=" + urgentTasks.size());

            // 3. Upcoming Contests
            logger.info("Service: Fetching upcoming contests...");
            List<DashboardResponse.UpcomingContestDTO> upcomingContests = getUpcomingContests();
            logger.info("Service: Upcoming contests fetched: count=" + upcomingContests.size());

            logger.info("Service: Creating dashboard response...");
            return new DashboardResponse(userStats, urgentTasks, upcomingContests);
        } catch (Exception e) {
            logger.error("Service: Error in getDashboardSummary: " + e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Calculate user statistics
     */
    private DashboardResponse.UserStatsDTO getUserStats(Long userId) {
        // Count total tasks
        List<Task> allTasks = taskRepository.findByUserId(userId);
        Long totalTasks = (long) allTasks.size();

        // Count completed tasks
        Long completedTasks = allTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.DONE)
                .count();

        // Sum total time spent (in minutes)
        Integer totalTimeSpent = allTasks.stream()
                .mapToInt(t -> t.getTimeSpent() != null ? t.getTimeSpent() : 0)
                .sum();

        // Count ongoing projects
        Long ongoingProjects = projectRepository.findByUserId(userId).stream()
                .filter(p -> "Ongoing".equals(p.getStatus()))
                .count();

        return new DashboardResponse.UserStatsDTO(totalTasks, completedTasks, totalTimeSpent, ongoingProjects);
    }

    /**
     * Get top 3 most urgent tasks (by deadline)
     */
    private List<DashboardResponse.UrgentTaskDTO> getUrgentTasks(Long userId) {
        return taskRepository.findByUserId(userId).stream()
                .filter(t -> t.getStatus() != TaskStatus.DONE) // Exclude done tasks
                .sorted((t1, t2) -> {
                    // Sort by deadline (earliest first)
                    if (t1.getDeadline() == null) return 1;
                    if (t2.getDeadline() == null) return -1;
                    return t1.getDeadline().compareTo(t2.getDeadline());
                })
                .limit(3)
                .map(t -> new DashboardResponse.UrgentTaskDTO(
                        t.getId(),
                        t.getTitle(),
                        t.getDeadline() != null ? t.getDeadline().toString() : null,
                        t.getPriority(),
                        t.getProject() != null ? t.getProject().getId().toString() : null
                ))
                .collect(Collectors.toList());
    }

    /**
     * Get upcoming contests (next 5)
     */
    private List<DashboardResponse.UpcomingContestDTO> getUpcomingContests() {
        // Fetch upcoming contests from ContestRepository
        List<Contest> contests = contestRepository.findUpcomingContests(LocalDateTime.now());
        
        return contests.stream()
                .limit(5)
                .map(c -> new DashboardResponse.UpcomingContestDTO(
                        c.getId(),
                        c.getPlatform(),
                        c.getContestName(),
                        c.getStartTime().toString()
                ))
                .collect(Collectors.toList());
    }
}
