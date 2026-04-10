package com.studentworkspace.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.studentworkspace.model.Note;
import com.studentworkspace.model.Project;
import com.studentworkspace.model.User;
import com.studentworkspace.repository.NoteRepository;
import com.studentworkspace.repository.ProjectRepository;
import com.studentworkspace.repository.UserRepository;
import com.studentworkspace.exception.ResourceNotFoundException;
import java.util.List;

@Service
public class NoteService {

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    public Note createNote(Long userId, Long projectId, Note note) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        note.setUser(user);
        note.setProject(project);
        return noteRepository.save(note);
    }

    public List<Note> getProjectNotes(Long projectId) {
        return noteRepository.findByProjectId(projectId);
    }

    public List<Note> getUserNotes(Long userId) {
        return noteRepository.findByUserId(userId);
    }

    public Note getNoteById(Long id) {
        return noteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found"));
    }

    public Note updateNote(Long id, Note newNote) {
        Note note = getNoteById(id);
        note.setTitle(newNote.getTitle());
        note.setContent(newNote.getContent());
        return noteRepository.save(note);
    }

    public void deleteNote(Long id) {
        noteRepository.deleteById(id);
    }
}
