package com.studentworkspace.dto;

public class TaskResponse {
    
    private Long id;
    private String title;
    private String description;
    private String deadline;
    private String status;      // TODO, IN_PROGRESS, DONE
    private String priority;     // HIGH, MEDIUM, LOW
    private Integer timeSpent;   // in minutes
    private Long projectId;
    private Long userId;
    private Boolean completed;

    public TaskResponse() {}

    public TaskResponse(Long id, String title, String description, String deadline, String status, String priority, Integer timeSpent, Long projectId, Long userId) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.deadline = deadline;
        this.status = status;
        this.priority = priority;
        this.timeSpent = timeSpent;
        this.projectId = projectId;
        this.userId = userId;
        this.completed = false;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDeadline() { return deadline; }
    public void setDeadline(String deadline) { this.deadline = deadline; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public Integer getTimeSpent() { return timeSpent; }
    public void setTimeSpent(Integer timeSpent) { this.timeSpent = timeSpent; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Boolean getCompleted() { return completed; }
    public void setCompleted(Boolean completed) { this.completed = completed; }
}
