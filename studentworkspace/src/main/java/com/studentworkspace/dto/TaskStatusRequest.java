package com.studentworkspace.dto;

/**
 * Request body for updating task status (Kanban)
 */
public class TaskStatusRequest {
    private String status;  // TODO, IN_PROGRESS, DONE

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
