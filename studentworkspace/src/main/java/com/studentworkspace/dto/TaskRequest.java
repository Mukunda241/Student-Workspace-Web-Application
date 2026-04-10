package com.studentworkspace.dto;

import com.studentworkspace.model.TaskStatus;

public class TaskRequest {
    
    private String title;
    private String description;
    private String deadline;
    private String priority;
    private String status;
    private Integer timeSpent;
    private Long projectId;
    private Boolean completed;

    public TaskRequest() {}

    public TaskRequest(String title, String description, String deadline, String priority, String status, Integer timeSpent, Long projectId, Boolean completed) {
        this.title = title;
        this.description = description;
        this.deadline = deadline;
        this.priority = priority;
        this.status = status;
        this.timeSpent = timeSpent;
        this.projectId = projectId;
        this.completed = completed;
    }

    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDeadline() { return deadline; }
    public void setDeadline(String deadline) { this.deadline = deadline; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getTimeSpent() { return timeSpent; }
    public void setTimeSpent(Integer timeSpent) { this.timeSpent = timeSpent; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public Boolean getCompleted() { return completed; }
    public void setCompleted(Boolean completed) { this.completed = completed; }
}
