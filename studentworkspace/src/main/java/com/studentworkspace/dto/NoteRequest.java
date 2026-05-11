package com.studentworkspace.dto;

import jakarta.validation.constraints.NotBlank;

public class NoteRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String content;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content != null ? content : ""; }
    public void setContent(String content) { this.content = content; }
}
