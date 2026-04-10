package com.studentworkspace.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.studentworkspace.model.Note;
import com.studentworkspace.service.NoteService;
import com.studentworkspace.dto.NoteRequest;
import com.studentworkspace.dto.NoteResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    @Autowired
    private NoteService noteService;

    private NoteResponse convertToResponse(Note note) {
        return new NoteResponse(
            note.getId(),
            note.getTitle(),
            note.getContent(),
            note.getCreatedAt(),
            note.getUpdatedAt(),
            note.getProject() != null ? note.getProject().getId() : null,
            note.getUser() != null ? note.getUser().getId() : null
        );
    }

    @PostMapping("/create/{userId}/{projectId}")
    public ResponseEntity<NoteResponse> createNote(@PathVariable Long userId, @PathVariable Long projectId, 
                                                    @Valid @RequestBody NoteRequest request) {
        Note note = new Note();
        note.setTitle(request.getTitle());
        note.setContent(request.getContent());
        
        Note createdNote = noteService.createNote(userId, projectId, note);
        return new ResponseEntity<>(convertToResponse(createdNote), HttpStatus.CREATED);
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<NoteResponse>> getProjectNotes(@PathVariable Long projectId) {
        List<Note> notes = noteService.getProjectNotes(projectId);
        List<NoteResponse> responses = notes.stream().map(this::convertToResponse).collect(Collectors.toList());
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NoteResponse>> getUserNotes(@PathVariable Long userId) {
        List<Note> notes = noteService.getUserNotes(userId);
        List<NoteResponse> responses = notes.stream().map(this::convertToResponse).collect(Collectors.toList());
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @GetMapping("/{noteId}")
    public ResponseEntity<NoteResponse> getNoteById(@PathVariable Long noteId) {
        Note note = noteService.getNoteById(noteId);
        return new ResponseEntity<>(convertToResponse(note), HttpStatus.OK);
    }

    @PutMapping("/update/{noteId}")
    public ResponseEntity<NoteResponse> updateNote(@PathVariable Long noteId, @Valid @RequestBody NoteRequest request) {
        Note note = new Note();
        note.setTitle(request.getTitle());
        note.setContent(request.getContent());
        
        Note updatedNote = noteService.updateNote(noteId, note);
        return new ResponseEntity<>(convertToResponse(updatedNote), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{noteId}")
    public ResponseEntity<String> deleteNote(@PathVariable Long noteId) {
        noteService.deleteNote(noteId);
        return new ResponseEntity<>("Note deleted successfully", HttpStatus.OK);
    }
}
