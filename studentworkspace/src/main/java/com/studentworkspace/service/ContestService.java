package com.studentworkspace.service;

import java.time.LocalDateTime;
import java.util.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.studentworkspace.model.Contest;
import com.studentworkspace.model.User;
import com.studentworkspace.repository.ContestRepository;
import com.studentworkspace.repository.UserRepository;
import com.studentworkspace.exception.ResourceNotFoundException;

@Service
public class ContestService {

    @Autowired
    private ContestRepository contestRepository;

    @Autowired
    private UserRepository userRepository;

    // Get all contests sorted by start time (upcoming first)
    public List<Contest> getAllContests() {
        // For now, just return all contests without filtering to debug the issue
        try {
            List<Contest> all = contestRepository.findAll();
            System.err.println("getAllContests: Found " + all.size() + " total contests");
            return all;
        } catch (Exception e) {
            System.err.println("Error in getAllContests: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    // Get contests by platform
    public List<Contest> getContestsByPlatform(String platform) {
        try {
            return contestRepository.findUpcomingContestsByPlatform(LocalDateTime.now(), platform);
        } catch (Exception e) {
            System.err.println("Error in findUpcomingContestsByPlatform: " + e.getMessage());
            e.printStackTrace();
            return contestRepository.findByPlatform(platform);
        }
    }

    // Get all unique platforms
    public List<String> getAllPlatforms() {
        List<Contest> contests = contestRepository.findAll();
        Set<String> platforms = new HashSet<>();
        for (Contest contest : contests) {
            platforms.add(contest.getPlatform());
        }
        return new ArrayList<>(platforms);
    }

    // Get next contest (countdown timer)
    public Contest getNextContest() {
        List<Contest> upcomingContests = contestRepository.findUpcomingContests(LocalDateTime.now());
        return upcomingContests.isEmpty() ? null : upcomingContests.get(0);
    }

    // Get all upcoming contests (future contests only)
    public List<Contest> getUpcomingContests() {
        try {
            return contestRepository.findUpcomingContests(LocalDateTime.now());
        } catch (Exception e) {
            System.err.println("Error in findUpcomingContests: " + e.getMessage());
            e.printStackTrace();
            return contestRepository.findAll();
        }
    }

    // Set reminder for a contest
    public Contest setReminder(Long contestId, Long userId) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        contest.setReminderSet(true);
        contest.setUser(user);
        return contestRepository.save(contest);
    }

    // Remove reminder for a contest
    public Contest removeReminder(Long contestId) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest not found"));

        contest.setReminderSet(false);
        contest.setUser(null);
        return contestRepository.save(contest);
    }

    // Get user's reminders
    public List<Contest> getUserReminders(Long userId) {
        return contestRepository.findUserReminders(userId);
    }

    // Create contest (mainly used by scheduler)
    public Contest createContest(Contest contest) {
        // Check if contest already exists
        Optional<Contest> existing = contestRepository.findByContestNameAndPlatform(
                contest.getContestName(),
                contest.getPlatform());

        if (existing.isPresent()) {
            return existing.get(); // Return existing contest (no duplicate)
        }

        return contestRepository.save(contest);
    }

    // Update contest
    public Contest updateContest(Long contestId, Contest updatedContest) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest not found"));

        contest.setContestName(updatedContest.getContestName());
        contest.setPlatform(updatedContest.getPlatform());
        contest.setStartTime(updatedContest.getStartTime());
        contest.setEndTime(updatedContest.getEndTime());
        contest.setUrl(updatedContest.getUrl());
        contest.setLogoUrl(updatedContest.getLogoUrl());

        return contestRepository.save(contest);
    }

    // Delete contest
    public String deleteContest(Long contestId) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest not found"));

        contestRepository.delete(contest);
        return "Contest deleted successfully!";
    }

    // Get contest by ID
    public Contest getContestById(Long contestId) {
        return contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest not found"));
    }

    // Get contests within date range (for timeline)
    public List<Contest> getContestsBetween(LocalDateTime start, LocalDateTime end) {
        return contestRepository.findContestsBetween(start, end);
    }
    /** Delete all contests so they can be re-synced with correct timezone data */
    public void deleteAllContests() {
        contestRepository.deleteAll();
    }

    /** Save a contest entity directly (for timezone correction) */
    public com.studentworkspace.model.Contest updateContestDirectly(com.studentworkspace.model.Contest contest) {
        return contestRepository.save(contest);
    }

}
