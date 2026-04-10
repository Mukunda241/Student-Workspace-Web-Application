package com.studentworkspace.model;

/**
 * Task Status Enum for Kanban board state management
 * - TODO: Initial state, not started
 * - IN_PROGRESS: Task is being worked on (Pomodoro timer active or completed sessions)
 * - DONE: Task completed, ready for review/archive
 */
public enum TaskStatus {
    TODO("To Do"),
    IN_PROGRESS("In Progress"),
    DONE("Done");

    private final String displayName;

    TaskStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
