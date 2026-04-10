package com.studentworkspace.dto;

import java.util.List;

/**
 * Dashboard Summary Response DTO
 * Aggregates data from multiple sources into a single response
 */
public class DashboardResponse {

    private UserStatsDTO userStats;
    private List<UrgentTaskDTO> urgentTasks;
    private List<UpcomingContestDTO> upcomingContests;

    public DashboardResponse(UserStatsDTO userStats, List<UrgentTaskDTO> urgentTasks, List<UpcomingContestDTO> upcomingContests) {
        this.userStats = userStats;
        this.urgentTasks = urgentTasks;
        this.upcomingContests = upcomingContests;
    }

    // Nested DTOs

    public static class UserStatsDTO {
        private Long totalTasks;
        private Long completedTasks;
        private Integer totalTimeSpent; // in minutes
        private Long ongoingProjects;

        public UserStatsDTO(Long totalTasks, Long completedTasks, Integer totalTimeSpent, Long ongoingProjects) {
            this.totalTasks = totalTasks;
            this.completedTasks = completedTasks;
            this.totalTimeSpent = totalTimeSpent;
            this.ongoingProjects = ongoingProjects;
        }

        public Long getTotalTasks() { return totalTasks; }
        public Long getCompletedTasks() { return completedTasks; }
        public Integer getTotalTimeSpent() { return totalTimeSpent; }
        public Long getOngoingProjects() { return ongoingProjects; }
    }

    public static class UrgentTaskDTO {
        private Long id;
        private String title;
        private String deadline;
        private String priority;
        private String projectId;

        public UrgentTaskDTO(Long id, String title, String deadline, String priority, String projectId) {
            this.id = id;
            this.title = title;
            this.deadline = deadline;
            this.priority = priority;
            this.projectId = projectId;
        }

        public Long getId() { return id; }
        public String getTitle() { return title; }
        public String getDeadline() { return deadline; }
        public String getPriority() { return priority; }
        public String getProjectId() { return projectId; }
    }

    public static class UpcomingContestDTO {
        private Long id;
        private String platform;
        private String contestName;
        private String startTime;

        public UpcomingContestDTO(Long id, String platform, String contestName, String startTime) {
            this.id = id;
            this.platform = platform;
            this.contestName = contestName;
            this.startTime = startTime;
        }

        public Long getId() { return id; }
        public String getPlatform() { return platform; }
        public String getContestName() { return contestName; }
        public String getStartTime() { return startTime; }
    }

    // Getters
    public UserStatsDTO getUserStats() { return userStats; }
    public List<UrgentTaskDTO> getUrgentTasks() { return urgentTasks; }
    public List<UpcomingContestDTO> getUpcomingContests() { return upcomingContests; }
}
