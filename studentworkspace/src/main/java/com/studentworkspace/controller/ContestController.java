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
import com.studentworkspace.service.ContestSyncService;
import com.studentworkspace.dto.ContestResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/contests")
public class ContestController {

    @Autowired
    private ContestService contestService;

    @Autowired(required = false)
    private ContestSyncService contestSyncService;

    /** Convert Contest entity → ContestResponse DTO */
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
            contest.getUpdatedAt()
        );
    }

    /** Get all contests */
    @GetMapping
    public ResponseEntity<List<ContestResponse>> getAllContests() {
        List<Contest> contests = contestService.getAllContests();
        List<ContestResponse> responses = contests.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /** Get upcoming contests only — primary endpoint used by frontend */
    @GetMapping("/upcoming")
    public ResponseEntity<List<ContestResponse>> getUpcomingContests() {
        List<Contest> contests = contestService.getUpcomingContests();
        List<ContestResponse> responses = contests.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /** Alias for backward compat */
    @GetMapping("/upcoming/all")
    public ResponseEntity<List<ContestResponse>> getUpcomingContestsAll() {
        return getUpcomingContests();
    }

    /**
     * Sync contests from clist.by API.
     * Clears existing data first so times are always fresh and correct.
     */
    @PostMapping("/sync")
    public ResponseEntity<String> syncContests() {
        if (contestSyncService == null) {
            return ResponseEntity.status(503).body("Contest sync service unavailable");
        }
        try {
            // Clear old data and re-fetch with correct UTC→IST conversion
            contestService.deleteAllContests();
            contestSyncService.syncContestsManually();
            long count = contestService.getAllContests().size();
            return ResponseEntity.ok("Sync complete. " + count + " contests loaded with correct IST times.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body("Sync failed: " + e.getMessage());
        }
    }

    /**
     * Fix timezone on existing DB contests: adds +5:30 to any contest
     * whose stored time looks like UTC (is in past but +5:30 puts it in future).
     * Safe to call multiple times.
     */
    @PostMapping("/fix-timezone")
    public ResponseEntity<String> fixTimezone() {
        try {
            java.time.LocalDateTime nowIst = java.time.LocalDateTime.now(
                java.time.ZoneId.of("Asia/Kolkata"));
            int fixed = 0;
            for (Contest contest : contestService.getAllContests()) {
                if (contest.getStartTime() == null) continue;
                java.time.LocalDateTime stored    = contest.getStartTime();
                java.time.LocalDateTime corrected = stored.plusHours(5).plusMinutes(30);
                boolean storedPast    = stored.isBefore(nowIst.minusHours(1));
                boolean correctedOk   = corrected.isAfter(nowIst.minusHours(2));
                if (storedPast && correctedOk) {
                    contest.setStartTime(corrected);
                    if (contest.getEndTime() != null)
                        contest.setEndTime(contest.getEndTime().plusHours(5).plusMinutes(30));
                    contestService.updateContestDirectly(contest);
                    fixed++;
                }
            }
            return ResponseEntity.ok("Fixed " + fixed + " contest(s). Times now in IST.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    /**
     * Force add +5:30 to all contest times (UTC to IST conversion).
     * Use this when all stored times are UTC and need IST adjustment.
     */
    @PostMapping("/fix-timezone-force")
    public ResponseEntity<String> forceFixTimezone() {
        try {
            int fixed = 0;
            for (Contest contest : contestService.getAllContests()) {
                if (contest.getStartTime() == null) continue;
                contest.setStartTime(contest.getStartTime().plusHours(5).plusMinutes(30));
                if (contest.getEndTime() != null)
                    contest.setEndTime(contest.getEndTime().plusHours(5).plusMinutes(30));
                contestService.updateContestDirectly(contest);
                fixed++;
            }
            return ResponseEntity.ok("Force-fixed " + fixed + " contest(s). All times adjusted by +5:30 for IST.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    /** Health check */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        long count = contestService.getAllContests().size();
        return ResponseEntity.ok("Contest API running. " + count + " contests in DB.");
    }
}
