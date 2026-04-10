package com.studentworkspace.dto;

/**
 * Request body for logging Pomodoro time
 */
public class PomodoroRequest {
    private Integer minutes;  // Minutes spent on this task

    public Integer getMinutes() {
        return minutes;
    }

    public void setMinutes(Integer minutes) {
        this.minutes = minutes;
    }
}
