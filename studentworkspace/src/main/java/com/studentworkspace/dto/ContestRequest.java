package com.studentworkspace.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

public class ContestRequest {

    @NotBlank(message = "Platform is required")
    private String platform;

    @NotBlank(message = "Contest name is required")
    private String contestName;

    @NotBlank(message = "Start time is required")
    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private String url;

    private String logoUrl;

    // Constructors
    public ContestRequest() {
    }

    public ContestRequest(String platform, String contestName, LocalDateTime startTime, String url) {
        this.platform = platform;
        this.contestName = contestName;
        this.startTime = startTime;
        this.url = url;
    }

    // Getters and Setters

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public String getContestName() {
        return contestName;
    }

    public void setContestName(String contestName) {
        this.contestName = contestName;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }
}
