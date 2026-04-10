package com.studentworkspace.service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import com.studentworkspace.model.Contest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class ContestScheduler {

    @Autowired
    private ContestService contestService;

    @Autowired
    private RestTemplate restTemplate;

    // Cron: Runs every day at 2:00 AM
    @Scheduled(cron = "0 0 2 * * ?")
    public void fetchAndSaveContests() {
        System.out.println("🚀 Starting scheduled contest fetch at: " + LocalDateTime.now());

        try {
            // Fetch from Clist.by API
            String url = "https://clist.by/api/v2/contest/?limit=100&offset=0";
            String response = restTemplate.getForObject(url, String.class);

            if (response != null) {
                parseAndSaveContests(response);
                System.out.println("✅ Contest fetch completed successfully");
            }
        } catch (RestClientException e) {
            System.err.println("❌ Error fetching contests from external API: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("❌ Error processing contests: " + e.getMessage());
        }
    }

    // Parse JSON response and save contests
    private void parseAndSaveContests(String jsonResponse) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonResponse);
            JsonNode resultsArray = root.get("objects");

            if (resultsArray != null && resultsArray.isArray()) {
                int savedCount = 0;

                for (JsonNode contestNode : resultsArray) {
                    try {
                        Contest contest = extractContestFromJson(contestNode);

                        // Save contest via service (which handles duplicates)
                        contestService.createContest(contest);
                        savedCount++;
                    } catch (Exception e) {
                        System.err.println("⚠️ Error parsing individual contest: " + e.getMessage());
                        // Continue processing other contests
                    }
                }

                System.out.println("📊 Processed and saved: " + savedCount + " contests");
            }
        } catch (Exception e) {
            System.err.println("❌ Error parsing JSON response: " + e.getMessage());
        }
    }

    // Extract contest details from JSON node
    private Contest extractContestFromJson(JsonNode node) {
        Contest contest = new Contest();

        // Extract platform (resource in Clist API)
        String resource = node.has("resource") ? node.get("resource").asText("Unknown") : "Unknown";
        contest.setPlatform(normalizePlatformName(resource));

        // Extract contest name
        String contestName = node.has("event") ? node.get("event").asText("Unknown") : "Unknown";
        contest.setContestName(contestName);

        // Extract start time (Clist uses UNIX timestamp)
        if (node.has("start")) {
            long timestamp = node.get("start").asLong();
            LocalDateTime startTime = LocalDateTime.ofInstant(
                    Instant.ofEpochSecond(timestamp),
                    ZoneId.systemDefault());
            contest.setStartTime(startTime);
        }

        // Extract end time
        if (node.has("end")) {
            long timestamp = node.get("end").asLong();
            LocalDateTime endTime = LocalDateTime.ofInstant(
                    Instant.ofEpochSecond(timestamp),
                    ZoneId.systemDefault());
            contest.setEndTime(endTime);
        }

        // Extract URL
        String url = node.has("url") ? node.get("url").asText("") : "";
        contest.setUrl(url);

        // Set default logo (can be updated with actual platform logos)
        contest.setLogoUrl(getLogoUrlForPlatform(contest.getPlatform()));

        return contest;
    }

    // Normalize platform names from Clist API response
    private String normalizePlatformName(String resource) {
        // Clist API returns names like "LeetCode", "Codeforces", "HackerRank", etc.
        return resource.trim();
    }

    // Get logo URL based on platform
    private String getLogoUrlForPlatform(String platform) {
        switch (platform.toLowerCase()) {
            case "leetcode":
                return "https://assets.leetcode.com/static_assets/media/favicon.ico";
            case "codeforces":
                return "https://codeforces.com/favicon.ico";
            case "hackerrank":
                return "https://www.hackerrank.com/favicon.ico";
            case "codechef":
                return "https://s3.amazonaws.com/codechef_shared/sites/all/themes/abessive/favicon.ico";
            case "atcoder":
                return "https://atcoder.jp/favicon.ico";
            default:
                return "https://via.placeholder.com/16";
        }
    }
}
