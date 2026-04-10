package com.studentworkspace.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.studentworkspace.model.Project;
import com.studentworkspace.service.ProjectService;
import com.studentworkspace.dto.ProjectRequest;
import com.studentworkspace.dto.ProjectResponse;
import com.studentworkspace.dto.ProjectWithTasksResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    private ProjectResponse convertToResponse(Project project) {
        Double progress = projectService.calculateProjectProgress(project.getId());
        return new ProjectResponse(
            project.getId(),
            project.getTitle(),
            project.getDescription(),
            project.getStartDate(),
            project.getEndDate(),
            project.getStatus(),
            project.getUser() != null ? project.getUser().getId() : null,
            progress,
            project.getColorCode()
        );
    }

    @PostMapping("/create/{userId}")
    public ResponseEntity<ProjectResponse> createProject(@PathVariable Long userId, @Valid @RequestBody ProjectRequest request) {
        Project project = new Project();
        project.setTitle(request.getTitle());
        project.setDescription(request.getDescription());
        
        // Parse date strings to LocalDate if provided
        if (request.getStartDate() != null && !request.getStartDate().isEmpty()) {
            project.setStartDate(LocalDate.parse(request.getStartDate()));
        }
        if (request.getEndDate() != null && !request.getEndDate().isEmpty()) {
            project.setEndDate(LocalDate.parse(request.getEndDate()));
        }
        
        project.setStatus(request.getStatus());
        
        // Set color code (use default if not provided)
        if (request.getColorCode() != null && !request.getColorCode().isEmpty()) {
            project.setColorCode(request.getColorCode());
        }
        
        Project createdProject = projectService.createProject(userId, project);
        return new ResponseEntity<>(convertToResponse(createdProject), HttpStatus.CREATED);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ProjectResponse>> getUserProjects(@PathVariable Long userId) {
        List<Project> projects = projectService.getUserProjects(userId);
        List<ProjectResponse> responses = projects.stream().map(this::convertToResponse).collect(Collectors.toList());
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    /**
     * OPTIMIZED ENDPOINT: Fetch user projects with top 3 tasks.
     * This prevents N+1 query problem and provides task previews for the Projects page.
     * 
     * Response includes:
     * - Project details (title, description, dates, status, color)
     * - Progress percentage
     * - Top 3 most urgent tasks with status/priority indicators
     */
    @GetMapping("/user/{userId}/with-tasks")
    public ResponseEntity<List<ProjectWithTasksResponse>> getUserProjectsWithTasks(@PathVariable Long userId) {
        List<ProjectWithTasksResponse> projects = projectService.getUserProjectsWithTopTasks(userId);
        return new ResponseEntity<>(projects, HttpStatus.OK);
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> getProjectById(@PathVariable Long projectId) {
        Project project = projectService.getProjectById(projectId);
        return new ResponseEntity<>(convertToResponse(project), HttpStatus.OK);
    }

    @PutMapping("/update/{projectId}")
    public ResponseEntity<ProjectResponse> updateProject(@PathVariable Long projectId, @Valid @RequestBody ProjectRequest request) {
        Project project = new Project();
        project.setTitle(request.getTitle());
        project.setDescription(request.getDescription());
        
        // Parse date strings to LocalDate if provided
        if (request.getStartDate() != null && !request.getStartDate().isEmpty()) {
            project.setStartDate(LocalDate.parse(request.getStartDate()));
        }
        if (request.getEndDate() != null && !request.getEndDate().isEmpty()) {
            project.setEndDate(LocalDate.parse(request.getEndDate()));
        }
        
        project.setStatus(request.getStatus());
        
        // Set color code (use default if not provided)
        if (request.getColorCode() != null && !request.getColorCode().isEmpty()) {
            project.setColorCode(request.getColorCode());
        }
        
        Project updatedProject = projectService.updateProject(projectId, project);
        return new ResponseEntity<>(convertToResponse(updatedProject), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{projectId}")
    public ResponseEntity<String> deleteProject(@PathVariable Long projectId) {
        projectService.deleteProject(projectId);
        return new ResponseEntity<>("Project deleted successfully", HttpStatus.OK);
    }

    @GetMapping("/all")
    public ResponseEntity<List<ProjectResponse>> getAllProjects() {
        List<Project> projects = projectService.getAllProjects();
        List<ProjectResponse> responses = projects.stream().map(this::convertToResponse).collect(Collectors.toList());
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }
}
