package com.studentworkspace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class ProjectRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    private String startDate;  // Accept as String (YYYY-MM-DD format)
    private String endDate;    // Accept as String (YYYY-MM-DD format)
    private String status;
    
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Color code must be valid hex color (e.g., #4F46E5)")
    private String colorCode;  // Hex color for UI

    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getColorCode() { return colorCode; }
    public void setColorCode(String colorCode) { this.colorCode = colorCode; }
}
