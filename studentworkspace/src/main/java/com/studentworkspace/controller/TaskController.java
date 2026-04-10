package com.studentworkspace.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.studentworkspace.model.Task;
import com.studentworkspace.model.TaskStatus;
import com.studentworkspace.service.TaskService;
import com.studentworkspace.dto.TaskResponse;
import com.studentworkspace.dto.TaskRequest;
import com.studentworkspace.dto.TaskStatusRequest;
import com.studentworkspace.dto.PomodoroRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskService taskService;

    private TaskResponse convertToResponse(Task task) {
        TaskResponse response = new TaskResponse(
            task.getId(),
            task.getTitle(),
            task.getDescription(),
            task.getDeadline(),
            task.getStatus().toString(),
            task.getPriority(),
            task.getTimeSpent(),
            task.getProject() != null ? task.getProject().getId() : null,
            task.getUser() != null ? task.getUser().getId() : null
        );
        response.setCompleted(task.getCompleted() != null ? task.getCompleted() : false);
        return response;
    }

    @PostMapping("/create/{userId}")
    public ResponseEntity<TaskResponse> createTask(@PathVariable Long userId, @Valid @RequestBody Task task) {
        Task createdTask = taskService.createTask(userId, task);
        return new ResponseEntity<>(convertToResponse(createdTask), HttpStatus.CREATED);
    }

    // NEW: Generic POST endpoint for task creation (expects userId from request body or session)
    @PostMapping
    public ResponseEntity<TaskResponse> createTaskGeneric(@Valid @RequestBody TaskRequest taskRequest, @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        // If userId not in header, use default (should come from authenticated user in production)
        if (userId == null) {
            userId = 1L; // fallback - in production, get from SecurityContext
        }
        Task createdTask = taskService.createTaskFromRequest(userId, taskRequest);
        return new ResponseEntity<>(convertToResponse(createdTask), HttpStatus.CREATED);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TaskResponse>> getUserTasks(@PathVariable Long userId) {
        List<Task> tasks = taskService.getUserTasks(userId);
        List<TaskResponse> responses = tasks.stream().map(this::convertToResponse).collect(Collectors.toList());
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<TaskResponse>> getTasksByProject(@PathVariable Long projectId) {
        List<Task> tasks = taskService.getTasksByProject(projectId);
        List<TaskResponse> responses = tasks.stream().map(this::convertToResponse).collect(Collectors.toList());
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }
    
    @PutMapping("/{taskId}")
    public ResponseEntity<TaskResponse> updateTaskGeneric(@PathVariable Long taskId, @Valid @RequestBody TaskRequest taskRequest) {
        Task updatedTask = taskService.updateTaskFromRequest(taskId, taskRequest);
        return new ResponseEntity<>(convertToResponse(updatedTask), HttpStatus.OK);
    }

    @PatchMapping("/{taskId}/status")
    public ResponseEntity<TaskResponse> updateTaskStatus(@PathVariable Long taskId, @RequestBody TaskStatusRequest request) {
        TaskStatus newStatus = TaskStatus.valueOf(request.getStatus().toUpperCase());
        Task updatedTask = taskService.updateTaskStatus(taskId, newStatus);
        return new ResponseEntity<>(convertToResponse(updatedTask), HttpStatus.OK);
    }

    @PostMapping("/{taskId}/log-time")
    public ResponseEntity<TaskResponse> logPomodoro(@PathVariable Long taskId, @RequestBody PomodoroRequest request) {
        Task updatedTask = taskService.logPomodoro(taskId, request.getMinutes());
        return new ResponseEntity<>(convertToResponse(updatedTask), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{taskId}")
    public ResponseEntity<String> deleteTask(@PathVariable Long taskId) {
        String message = taskService.deleteTask(taskId);
        return new ResponseEntity<>(message, HttpStatus.OK);
    }
    
    @GetMapping("/{taskId}")
    public ResponseEntity<TaskResponse> getTaskById(@PathVariable Long taskId) {
        Task task = taskService.getTaskById(taskId);
        return new ResponseEntity<>(convertToResponse(task), HttpStatus.OK);
    }
}
