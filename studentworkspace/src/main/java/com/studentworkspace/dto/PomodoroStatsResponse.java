package com.studentworkspace.dto;

public class PomodoroStatsResponse {
    private Long totalStudyMinutes;
    private Double totalStudyHours;
    private Long totalCompletedSessions;
    private Integer workSessions;

    public PomodoroStatsResponse() {}

    public PomodoroStatsResponse(Long totalStudyMinutes, Double totalStudyHours, Long totalCompletedSessions, Integer workSessions) {
        this.totalStudyMinutes = totalStudyMinutes;
        this.totalStudyHours = totalStudyHours;
        this.totalCompletedSessions = totalCompletedSessions;
        this.workSessions = workSessions;
    }

    public Long getTotalStudyMinutes() {
        return totalStudyMinutes;
    }

    public void setTotalStudyMinutes(Long totalStudyMinutes) {
        this.totalStudyMinutes = totalStudyMinutes;
    }

    public Double getTotalStudyHours() {
        return totalStudyHours;
    }

    public void setTotalStudyHours(Double totalStudyHours) {
        this.totalStudyHours = totalStudyHours;
    }

    public Long getTotalCompletedSessions() {
        return totalCompletedSessions;
    }

    public void setTotalCompletedSessions(Long totalCompletedSessions) {
        this.totalCompletedSessions = totalCompletedSessions;
    }

    public Integer getWorkSessions() {
        return workSessions;
    }

    public void setWorkSessions(Integer workSessions) {
        this.workSessions = workSessions;
    }
}
