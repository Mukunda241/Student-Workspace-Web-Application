package com.studentworkspace.controller;

import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.studentworkspace.model.Contest;
import com.studentworkspace.service.ContestService;
import com.studentworkspace.dto.ContestResponse;
import com.studentworkspace.dto.ContestRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/contests")
public class ContestController {

    @Autowired
    private ContestService contestService;

    @Autowired(required = false)
    private com.studentworkspace.service.ContestSyncService contestSyncService;

    // Simple health check endpoint
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        System.out.println("[DEBUG] Health check endpoint called");
        return new ResponseEntity<>("Contest API is running", HttpStatus.OK);
    }

    private ContestResponse convertToResponse(Contest contest) {
        return new ContestResponse(
                contest.getId(),
                contest.getPlatform(),
                contest.getContestName(),
                contest.getStartTime(),
                contest.getEndTime(),
                contest.getUrl(),
                contest.getLogoUrl(),
                contest.isReminderSet(),
                contest.getCreatedAt(),
                contest.getUpdatedAt());
    }

    // Get all contests (sorted by start time - upcoming first)
    @GetMapping
    public ResponseEntity<List<ContestResponse>> getAllContests() {
        System.out.println("[DEBUG] getAllContests endpoint called");
        try {
            List<Contest> contests = contestService.getAllContests();
            System.out.println("[DEBUG] Retrieved " + (contests != null ? contests.size() : "null") + " contests");
            
            List<ContestResponse> responses = new ArrayList<>();
            if (contests != null) {
                responses = contests.stream()
                        .map(this::convertToResponse)
                        .collect(Collectors.toList());
            }
            
            System.out.println("[DEBUG] Returning " + responses.size() + " responses");
            return new ResponseEntity<>(responses, HttpStatus.OK);
        } catch (Exception e) {
            System.out.println("[ERROR] Exception in getAllContests: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(new ArrayList<>(), HttpStatus.OK);
        }
    }

    // Get contests by platform
    @GetMapping("/platform/{platform}")
    public ResponseEntity<List<ContestResponse>> getContestsByPlatform(@PathVariable String platform) {
        List<Contest> contests = contestService.getContestsByPlatform(platform);
        List<ContestResponse> responses = contests.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    // Get all available platforms
    @GetMapping("/platforms")
    public ResponseEntity<List<String>> getPlatforms() {
        List<String> platforms = contestService.getAllPlatforms();
        return new ResponseEntity<>(platforms, HttpStatus.OK);
    }

    // Get next upcoming contest (for countdown timer)
    @GetMapping("/next")
    public ResponseEntity<ContestResponse> getNextContest() {
        Contest contest = contestService.getNextContest();
        if (contest == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(convertToResponse(contest), HttpStatus.OK);
    }

    // Get only upcoming contests (where start_time is in the future)
    @GetMapping("/upcoming/all")
    public ResponseEntity<List<ContestResponse>> getUpcomingContests() {
        List<Contest> contests = contestService.getUpcomingContests();
        List<ContestResponse> responses = contests.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    // Manually trigger contest sync from external API (for testing/admin use)
    @PostMapping("/sync")
    public ResponseEntity<String> syncContests() {
        if (contestSyncService == null) {
            return new ResponseEntity<>("Contest sync service not available", HttpStatus.SERVICE_UNAVAILABLE);
        }
        try {
            contestSyncService.syncContestsManually();
            return new ResponseEntity<>("Contest sync triggered successfully", HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error during sync: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get contest by ID
    @GetMapping("/{contestId}")
    public ResponseEntity<ContestResponse> getContestById(@PathVariable Long contestId) {
        Contest contest = contestService.getContestById(contestId);
        return new ResponseEntity<>(convertToResponse(contest), HttpStatus.OK);
    }

    // Create contest (admin use or manual addition)
    @PostMapping("/create")
    public ResponseEntity<ContestResponse> createContest(@Valid @RequestBody ContestRequest request) {
        Contest contest = new Contest();
        contest.setPlatform(request.getPlatform());
        contest.setContestName(request.getContestName());
        contest.setStartTime(request.getStartTime());
        contest.setEndTime(request.getEndTime());
        contest.setUrl(request.getUrl());
        contest.setLogoUrl(request.getLogoUrl());

        Contest createdContest = contestService.createContest(contest);
        return new ResponseEntity<>(convertToResponse(createdContest), HttpStatus.CREATED);
    }

    // Update contest
    @PutMapping("/update/{contestId}")
    public ResponseEntity<ContestResponse> updateContest(@PathVariable Long contestId,
                                                         @Valid @RequestBody ContestRequest request) {
        Contest contest = new Contest();
        contest.setPlatform(request.getPlatform());
        contest.setContestName(request.getContestName());
        contest.setStartTime(request.getStartTime());
        contest.setEndTime(request.getEndTime());
        contest.setUrl(request.getUrl());
        contest.setLogoUrl(request.getLogoUrl());

        Contest updatedContest = contestService.updateContest(contestId, contest);
        return new ResponseEntity<>(convertToResponse(updatedContest), HttpStatus.OK);
    }

    // Delete contest
    @DeleteMapping("/delete/{contestId}")
    public ResponseEntity<String> deleteContest(@PathVariable Long contestId) {
        String message = contestService.deleteContest(contestId);
        return new ResponseEntity<>(message, HttpStatus.OK);
    }

    // Set reminder for a contest
    @PostMapping("/{contestId}/remind/{userId}")
    public ResponseEntity<ContestResponse> setReminder(@PathVariable Long contestId, @PathVariable Long userId) {
        Contest contest = contestService.setReminder(contestId, userId);
        return new ResponseEntity<>(convertToResponse(contest), HttpStatus.OK);
    }

    // Remove reminder for a contest
    @DeleteMapping("/{contestId}/remind")
    public ResponseEntity<ContestResponse> removeReminder(@PathVariable Long contestId) {
        Contest contest = contestService.removeReminder(contestId);
        return new ResponseEntity<>(convertToResponse(contest), HttpStatus.OK);
    }

    // Get user's contest reminders
    @GetMapping("/reminders/{userId}")
    public ResponseEntity<List<ContestResponse>> getUserReminders(@PathVariable Long userId) {
        List<Contest> reminders = contestService.getUserReminders(userId);
        List<ContestResponse> responses = reminders.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }
}
