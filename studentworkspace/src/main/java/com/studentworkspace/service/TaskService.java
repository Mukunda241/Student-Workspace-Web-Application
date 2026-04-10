package com.studentworkspace.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.studentworkspace.model.Task;
import com.studentworkspace.model.TaskStatus;
import com.studentworkspace.model.User;
import com.studentworkspace.model.Project;
import com.studentworkspace.repository.TaskRepository;
import com.studentworkspace.repository.UserRepository;
import com.studentworkspace.repository.ProjectRepository;
import com.studentworkspace.exception.ResourceNotFoundException;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    public Task createTask(Long userId, Task task) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        task.setUser(user);
        
        // If task has projectId, load and set the project
        if (task.getProject() != null && task.getProject().getId() != null) {
            Project project = projectRepository.findById(task.getProject().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
            task.setProject(project);
        }
        
        return taskRepository.save(task);
    }

    public List<Task> getUserTasks(Long userId) {
        return taskRepository.findByUserId(userId);
    }

    public List<Task> getTasksByProject(Long projectId) {
        return taskRepository.findByProjectId(projectId);
    }
    
    public Task updateTask(Long taskId, Task updatedTask) {

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        task.setTitle(updatedTask.getTitle());
        task.setDescription(updatedTask.getDescription());
        task.setDeadline(updatedTask.getDeadline());
        task.setPriority(updatedTask.getPriority());
        if (updatedTask.getStatus() != null) {
            task.setStatus(updatedTask.getStatus());
        }

        return taskRepository.save(task);
    }

    /**
     * Update task status (for Kanban board drag-drop)
     * Changes task state: TODO → IN_PROGRESS → DONE
     */
    public Task updateTaskStatus(Long taskId, TaskStatus newStatus) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        
        task.setStatus(newStatus);
        return taskRepository.save(task);
    }

    /**
     * Log Pomodoro session for a task
     * Adds minutes to timeSpent and updates status to IN_PROGRESS if was TODO
     * 
     * @param taskId The task ID
     * @param minutes Minutes completed in this Pomodoro session
     * @return Updated task
     */
    public Task logPomodoro(Long taskId, Integer minutes) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        
        // Update time spent
        task.setTimeSpent((task.getTimeSpent() != null ? task.getTimeSpent() : 0) + minutes);
        
        // Auto-update status to IN_PROGRESS if was TODO
        if (task.getStatus() == TaskStatus.TODO) {
            task.setStatus(TaskStatus.IN_PROGRESS);
        }
        
        return taskRepository.save(task);
    }
    
    public String deleteTask(Long taskId) {

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        taskRepository.delete(task);

        return "Task deleted successfully!";
    }
    
    public Task getTaskById(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }

    // NEW: Create task from TaskRequest DTO (handles projectId mapping)
    public Task createTaskFromRequest(Long userId, com.studentworkspace.dto.TaskRequest taskRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Task task = new Task();
        task.setTitle(taskRequest.getTitle());
        task.setDescription(taskRequest.getDescription());
        task.setDeadline(taskRequest.getDeadline());
        task.setPriority(taskRequest.getPriority());
        task.setStatus(TaskStatus.valueOf(taskRequest.getStatus()));
        task.setTimeSpent(taskRequest.getTimeSpent());
        task.setCompleted(taskRequest.getCompleted() != null ? taskRequest.getCompleted() : false);
        task.setUser(user);

        // If projectId is provided, load and set the project
        if (taskRequest.getProjectId() != null) {
            Project project = projectRepository.findById(taskRequest.getProjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
            task.setProject(project);
        }

        return taskRepository.save(task);
    }

    // NEW: Update task from TaskRequest DTO (handles projectId mapping)
    public Task updateTaskFromRequest(Long taskId, com.studentworkspace.dto.TaskRequest taskRequest) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        task.setTitle(taskRequest.getTitle());
        task.setDescription(taskRequest.getDescription());
        task.setDeadline(taskRequest.getDeadline());
        task.setPriority(taskRequest.getPriority());
        if (taskRequest.getStatus() != null) {
            task.setStatus(TaskStatus.valueOf(taskRequest.getStatus()));
        }
        if (taskRequest.getTimeSpent() != null) {
            task.setTimeSpent(taskRequest.getTimeSpent());
        }
        if (taskRequest.getCompleted() != null) {
            task.setCompleted(taskRequest.getCompleted());
        }

        // If projectId is provided, load and set the project
        if (taskRequest.getProjectId() != null) {
            Project project = projectRepository.findById(taskRequest.getProjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
            task.setProject(project);
        } else {
            // If projectId is null, clear the project
            task.setProject(null);
        }

        return taskRepository.save(task);
    }

}
