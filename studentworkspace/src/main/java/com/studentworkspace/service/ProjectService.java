package com.studentworkspace.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.studentworkspace.model.Project;
import com.studentworkspace.model.Task;
import com.studentworkspace.model.TaskStatus;
import com.studentworkspace.model.User;
import com.studentworkspace.dto.ProjectWithTasksResponse;
import com.studentworkspace.dto.ProjectWithTasksResponse.TaskPreviewDTO;
import com.studentworkspace.repository.ProjectRepository;
import com.studentworkspace.repository.TaskRepository;
import com.studentworkspace.repository.UserRepository;
import com.studentworkspace.exception.ResourceNotFoundException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskRepository taskRepository;

    public Project createProject(Long userId, Project project) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        project.setUser(user);
        return projectRepository.save(project);
    }

    public List<Project> getUserProjects(Long userId) {
        return projectRepository.findByUserId(userId);
    }

    /**
     * OPTIMIZED: Fetch user projects with their top 3 tasks.
     * This uses a single JOIN FETCH query to prevent N+1 problem.
     * 
     * @param userId The user ID
     * @return List of projects with top 3 tasks and progress
     */
    public List<ProjectWithTasksResponse> getUserProjectsWithTopTasks(Long userId) {
        // Verify user exists
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // Fetch all projects for user (with JOINed tasks in single query)
        List<Project> projects = projectRepository.findByUserIdWithTasks(userId);
        
        // Transform each project: get top 3 tasks and calculate progress
        return projects.stream().map(project -> {
            ProjectWithTasksResponse dto = new ProjectWithTasksResponse(
                    project.getId(),
                    project.getTitle(),
                    project.getDescription(),
                    project.getStartDate(),
                    project.getEndDate(),
                    project.getStatus(),
                    project.getColorCode()
            );
            
            // Get top 3 most urgent tasks for this project
            List<Task> topTasks = taskRepository.findTopThreeTasksByProjectId(project.getId());
            
            // Transform tasks to TaskPreviewDTO
            List<TaskPreviewDTO> taskPreviews = topTasks.stream()
                    .map(task -> new TaskPreviewDTO(
                            task.getId(),
                            task.getTitle(),
                            task.getPriority(),
                            task.getStatus().toString(),
                            task.getDeadline(),
                            isTaskOverdue(task.getDeadline())
                    ))
                    .collect(Collectors.toList());
            
            dto.setTopTasks(taskPreviews);
            
            // Calculate progress
            Long totalTasks = taskRepository.countByProjectId(project.getId());
            Long completedTasks = taskRepository.countByProjectIdAndStatus(project.getId(), TaskStatus.DONE);
            
            dto.setTotalTasks(totalTasks != null ? totalTasks.intValue() : 0);
            dto.setCompletedTasks(completedTasks != null ? completedTasks.intValue() : 0);
            
            if (totalTasks != null && totalTasks > 0) {
                dto.setProgress((completedTasks * 100.0) / totalTasks);
            } else {
                dto.setProgress(0.0);
            }
            
            return dto;
        }).collect(Collectors.toList());
    }

    public Project getProjectById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

    public Project updateProject(Long id, Project newProject) {
        Project project = getProjectById(id);
        project.setTitle(newProject.getTitle());
        project.setDescription(newProject.getDescription());
        project.setStartDate(newProject.getStartDate());
        project.setEndDate(newProject.getEndDate());
        project.setStatus(newProject.getStatus());
        if (newProject.getColorCode() != null) {
            project.setColorCode(newProject.getColorCode());
        }
        return projectRepository.save(project);
    }

    public void deleteProject(Long id) {
        projectRepository.deleteById(id);
    }

    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    /**
     * Calculate progress percentage for a project
     * Formula: (CompletedTasks / TotalTasks) * 100
     * 
     * @param projectId The project ID
     * @return Progress percentage (0-100), or 0 if no tasks
     */
    public Double calculateProjectProgress(Long projectId) {
        Long totalTasks = taskRepository.countByProjectId(projectId);
        
        if (totalTasks == null || totalTasks == 0) {
            return 0.0;
        }
        
        Long completedTasks = taskRepository.countByProjectIdAndStatus(projectId, TaskStatus.DONE);
        if (completedTasks == null) {
            completedTasks = 0L;
        }
        
        return (completedTasks * 100.0) / totalTasks;
    }

    /**
     * Helper: Check if a task deadline has passed
     */
    private Boolean isTaskOverdue(String deadline) {
        if (deadline == null || deadline.isEmpty()) {
            return false;
        }
        try {
            LocalDate deadlineDate = LocalDate.parse(deadline);
            return deadlineDate.isBefore(LocalDate.now());
        } catch (Exception e) {
            return false;
        }
    }
}