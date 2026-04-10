package com.studentworkspace.dto;

import java.time.LocalDate;

public class ProjectResponse {
    
    private Long id;
    private String title;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private Long userId;
    private Double progressPercentage;
    private String colorCode; // Hex color for UI

    public ProjectResponse() {}

    public ProjectResponse(Long id, String title, String description, LocalDate startDate, LocalDate endDate, String status, Long userId, Double progressPercentage, String colorCode) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.userId = userId;
        this.progressPercentage = progressPercentage;
        this.colorCode = colorCode;
    }

    // Legacy constructor for backward compatibility
    public ProjectResponse(Long id, String title, String description, LocalDate startDate, LocalDate endDate, String status, Long userId, Double progressPercentage) {
        this(id, title, description, startDate, endDate, status, userId, progressPercentage, "#4F46E5");
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

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Double getProgressPercentage() { return progressPercentage; }

    public String getColorCode() { return colorCode; }
    public void setColorCode(String colorCode) { this.colorCode = colorCode; }
    public void setProgressPercentage(Double progressPercentage) { this.progressPercentage = progressPercentage; }
}
