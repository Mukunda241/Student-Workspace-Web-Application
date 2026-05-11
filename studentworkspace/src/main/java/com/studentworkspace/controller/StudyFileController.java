package com.studentworkspace.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.studentworkspace.model.StudyFile;
import com.studentworkspace.service.StudyFileService;
import com.studentworkspace.dto.StudyFileResponse;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/files")
public class StudyFileController {

    @Autowired
    private StudyFileService studyFileService;

    private static final String UPLOAD_DIR = "uploads/";

    private StudyFileResponse convertToResponse(StudyFile file) {
        return new StudyFileResponse(
            file.getId(),
            file.getFileName(),
            file.getFilePath(),
            file.getFileType(),
            file.getFileSize(),
            file.getUploadedAt(),
            file.getProject() != null ? file.getProject().getId() : null,
            file.getUser() != null ? file.getUser().getId() : null
        );
    }

    @PostMapping("/upload/{userId}/{projectId}")
    public ResponseEntity<StudyFileResponse> uploadFile(@PathVariable Long userId, @PathVariable Long projectId,
                                                        @RequestParam("file") MultipartFile file) {
        try {
            // Create upload directory if it doesn't exist
            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            // Save file to filesystem
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path path = Paths.get(UPLOAD_DIR + fileName);
            Files.write(path, file.getBytes());

            // Save file metadata to database
            StudyFile studyFile = new StudyFile();
            studyFile.setFileName(file.getOriginalFilename());
            studyFile.setFilePath(path.toString());
            studyFile.setFileType(file.getContentType());
            studyFile.setFileSize(file.getSize());

            StudyFile savedFile = studyFileService.uploadFile(userId, projectId, studyFile);
            return new ResponseEntity<>(convertToResponse(savedFile), HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<StudyFileResponse>> getProjectFiles(@PathVariable Long projectId) {
        List<StudyFile> files = studyFileService.getProjectFiles(projectId);
        List<StudyFileResponse> responses = files.stream().map(this::convertToResponse).collect(Collectors.toList());
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<StudyFileResponse>> getUserFiles(@PathVariable Long userId) {
        List<StudyFile> files = studyFileService.getUserFiles(userId);
        List<StudyFileResponse> responses = files.stream().map(this::convertToResponse).collect(Collectors.toList());
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @GetMapping("/{fileId}")
    public ResponseEntity<StudyFileResponse> getFileById(@PathVariable Long fileId) {
        StudyFile file = studyFileService.getFileById(fileId);
        return new ResponseEntity<>(convertToResponse(file), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{fileId}")
    public ResponseEntity<String> deleteFile(@PathVariable Long fileId) {
        StudyFile file = studyFileService.getFileById(fileId);
        
        // Delete from filesystem
        try {
            Files.deleteIfExists(Paths.get(file.getFilePath()));
        } catch (Exception e) {
            // Log error but continue with database deletion
        }
        
        // Delete from database
        studyFileService.deleteFile(fileId);
        return new ResponseEntity<>("File deleted successfully", HttpStatus.OK);
    }

    @GetMapping("/all")
    public ResponseEntity<List<StudyFile>> getAllFiles() {
        List<StudyFile> files = studyFileService.getAllFiles();
        return new ResponseEntity<>(files, HttpStatus.OK);
    }

    @GetMapping("/download/{fileId}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long fileId) {
        try {
            StudyFile file = studyFileService.getFileById(fileId);
            Path path = Paths.get(file.getFilePath());
            byte[] data = Files.readAllBytes(path);
            return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + file.getFileName() + "\"")
                .header("Content-Type", file.getFileType() != null ? file.getFileType() : "application/octet-stream")
                .body(data);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

}