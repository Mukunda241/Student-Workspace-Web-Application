package com.studentworkspace.dto;

import java.time.LocalDateTime;

public class ContestResponse {

    private Long id;
    private String platform;
    private String contestName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String url;
    private String logoUrl;
    private boolean reminderSet;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructors
    public ContestResponse() {
    }

    public ContestResponse(Long id, String platform, String contestName, LocalDateTime startTime, String url) {
        this.id = id;
        this.platform = platform;
        this.contestName = contestName;
        this.startTime = startTime;
        this.url = url;
    }

    public ContestResponse(Long id, String platform, String contestName, LocalDateTime startTime, LocalDateTime endTime, String url, String logoUrl, boolean reminderSet, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.platform = platform;
        this.contestName = contestName;
        this.startTime = startTime;
        this.endTime = endTime;
        this.url = url;
        this.logoUrl = logoUrl;
        this.reminderSet = reminderSet;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public boolean isReminderSet() {
        return reminderSet;
    }

    public void setReminderSet(boolean reminderSet) {
        this.reminderSet = reminderSet;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
