package com.studentworkspace.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO for efficiently fetching projects with their top 3 most urgent tasks.
 * This prevents N+1 query problem by using a single JOIN query.
 */
public class ProjectWithTasksResponse {
    private Long id;
    private String title;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private String colorCode;
    private Double progress; // Calculated from completed tasks
    private Integer totalTasks;
    private Integer completedTasks;
    private List<TaskPreviewDTO> topTasks; // Top 3 most urgent tasks

    public ProjectWithTasksResponse() {}

    public ProjectWithTasksResponse(Long id, String title, String description, 
                                   LocalDate startDate, LocalDate endDate, String status, 
                                   String colorCode) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.colorCode = colorCode;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getColorCode() { return colorCode; }
    public void setColorCode(String colorCode) { this.colorCode = colorCode; }

    public Double getProgress() { return progress; }
    public void setProgress(Double progress) { this.progress = progress; }

    public Integer getTotalTasks() { return totalTasks; }
    public void setTotalTasks(Integer totalTasks) { this.totalTasks = totalTasks; }

    public Integer getCompletedTasks() { return completedTasks; }
    public void setCompletedTasks(Integer completedTasks) { this.completedTasks = completedTasks; }

    public List<TaskPreviewDTO> getTopTasks() { return topTasks; }
    public void setTopTasks(List<TaskPreviewDTO> topTasks) { this.topTasks = topTasks; }

    /**
     * Nested DTO for task preview - simplified task info
     */
    public static class TaskPreviewDTO {
        private Long id;
        private String title;
        private String priority; // HIGH, MEDIUM, LOW
        private String status; // TODO, IN_PROGRESS, DONE
        private String deadline; // Due date
        private Boolean isOverdue; // Flag for visual indicator

        public TaskPreviewDTO() {}

        public TaskPreviewDTO(Long id, String title, String priority, 
                            String status, String deadline, Boolean isOverdue) {
            this.id = id;
            this.title = title;
            this.priority = priority;
            this.status = status;
            this.deadline = deadline;
            this.isOverdue = isOverdue;
        }

        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getDeadline() { return deadline; }
        public void setDeadline(String deadline) { this.deadline = deadline; }

        public Boolean getIsOverdue() { return isOverdue; }
        public void setIsOverdue(Boolean isOverdue) { this.isOverdue = isOverdue; }
    }
}
