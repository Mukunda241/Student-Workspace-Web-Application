package com.studentworkspace.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studentworkspace.model.Contest;
import com.studentworkspace.repository.ContestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Optional;
import java.util.Set;

/**
 * Service to sync contests from external API (clist.by) to database.
 * Runs automatically every 24 hours (at 2 AM by default).
 * 
 * Security Note: API credentials are stored in application.properties (server-side only),
 * never exposed to frontend JavaScript.
 * 
 * Filtering: Only contests from allowed platforms are saved to database (database efficiency).
 */
@Service
public class ContestSyncService {

    private static final Logger logger = LoggerFactory.getLogger(ContestSyncService.class);
    
    /**
     * Allowed platforms for filtering.
     * These are normalized platform names (lowercase, without .com/.by etc).
     * Easy to update - just add/remove platform names.
     */
    private static final Set<String> ALLOWED_PLATFORMS = Set.of(
        "codeforces",
        "leetcode", 
        "codechef",
        "hackerrank",
        "atcoder",
        "topcoder",
        "kickstart",
        "kaggle"
    );

    @Autowired
    private ContestRepository contestRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${contest.api.url}")
    private String apiUrl;

    @Value("${contest.api.username}")
    private String apiUsername;

    @Value("${contest.api.key}")
    private String apiKey;

    @Value("${contest.sync.enabled:true}")
    private boolean syncEnabled;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Scheduled task to sync contests from external API.
     * Runs every 24 hours at 2 AM (cron: "0 0 2 * * ?")
     */
    @Scheduled(cron = "${contest.sync.cron:0 0 2 * * ?}")
    public void syncContests() {
        if (!syncEnabled) {
            logger.info("Contest sync is disabled");
            return;
        }

        logger.info("Starting contest sync from external API...");
        try {
            // Fetch contests from external API
            String jsonResponse = fetchFromExternalAPI();

            if (jsonResponse == null || jsonResponse.isEmpty()) {
                logger.warn("No data received from external API");
                return;
            }

            // Parse JSON and save to database
            parseAndSaveContests(jsonResponse);
            logger.info("Contest sync completed successfully");

        } catch (Exception e) {
            logger.error("Error during contest sync: {}", e.getMessage(), e);
        }
    }

    /**
     * Fetches contests from clist.by API v4 using query parameters.
     * Returns raw JSON response.
     */
    private String fetchFromExternalAPI() {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            // Make API call with query parameters (v4 API uses query params, not Basic Auth)
            String url = apiUrl + "?username=" + apiUsername + "&api_key=" + apiKey + "&upcoming=true&order_by=start&limit=50";
            logger.info("Fetching contests from: {}", url.replace(apiKey, "***")); // Log without exposing API key

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class, entity);

            if (response.getStatusCode().is2xxSuccessful()) {
                logger.info("Successfully fetched data from external API");
                return response.getBody();
            } else {
                logger.error("API returned status code: {}", response.getStatusCode());
                return null;
            }

        } catch (Exception e) {
            logger.error("Error fetching from external API: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Parses JSON response and saves/updates contests in database.
     * Uses upsert logic: if external_id exists, update; otherwise create.
     */
    private void parseAndSaveContests(String jsonResponse) {
        try {
            if (jsonResponse == null || jsonResponse.isEmpty()) {
                logger.warn("Received empty API response");
                return;
            }

            logger.info("Raw API response length: {} chars", jsonResponse.length());
            logger.info("Response preview: {}", jsonResponse.substring(0, Math.min(500, jsonResponse.length())));

            JsonNode rootNode = objectMapper.readTree(jsonResponse);
            
            // Log root node structure
            java.util.List<String> fieldNames = new ArrayList<>();
            rootNode.fieldNames().forEachRemaining(fieldNames::add);
            logger.info("Root node fields: {}", fieldNames);
            
            // clist.by API v4 returns data in "objects" array, not "results"
            JsonNode contestsArray = rootNode.get("objects");

            if (contestsArray == null || !contestsArray.isArray()) {
                logger.warn("No 'objects' array found in API response. Raw response: {}", jsonResponse.substring(0, Math.min(500, jsonResponse.length())));
                return;
            }

            int savedCount = 0;
            int updatedCount = 0;

            for (JsonNode contestNode : contestsArray) {
                try {
                    // Map clist.by API fields to our Contest model
                    // API fields: id, event, host, href, start, end, etc.
                    String externalId = contestNode.get("id").asText();
                    String hostName = contestNode.get("host").asText();  // e.g., "kaggle.com"
                    String normalizedPlatform = normalizePlatform(hostName);  // e.g., "kaggle"
                    String title = contestNode.get("event").asText();     // e.g., "Contest name"
                    String startTimeStr = contestNode.get("start").asText(); // ISO 8601 format
                    String url = contestNode.get("href").asText();        // Contest URL

                    logger.debug("Processing contest - Host: {}, Normalized: {}, Title: {}", hostName, normalizedPlatform, title);

                    // **LAYER 2: FILTERING LOGIC**
                    // Only save contests from allowed platforms (database efficiency)
                    if (!ALLOWED_PLATFORMS.contains(normalizedPlatform)) {
                        logger.debug("Skipping contest from platform: {} (not in allowed list)", normalizedPlatform);
                        continue; // Skip this contest, move to next
                    }

                    // Parse start time (ISO 8601 format)
                    LocalDateTime startTime = LocalDateTime.parse(
                        startTimeStr.replace("Z", ""),
                        DateTimeFormatter.ISO_LOCAL_DATE_TIME
                    );

                    // Check if contest already exists (upsert logic)
                    Optional<Contest> existingContest = contestRepository.findByExternalId(externalId);

                    if (existingContest.isPresent()) {
                        // Update existing contest
                        Contest contest = existingContest.get();
                        contest.setContestName(title);
                        contest.setStartTime(startTime);
                        contest.setUrl(url);
                        contest.setPlatform(hostName);  // Store original hostname
                        contestRepository.save(contest);
                        updatedCount++;
                        logger.debug("Updated contest: {} on {}", title, hostName);
                    } else {
                        // Create new contest
                        Contest newContest = new Contest();
                        newContest.setExternal_id(externalId);
                        newContest.setPlatform(hostName);  // Store original hostname
                        newContest.setContestName(title);
                        newContest.setStartTime(startTime);
                        newContest.setUrl(url);
                        contestRepository.save(newContest);
                        savedCount++;
                        logger.debug("Saved new contest: {} on {}", title, hostName);
                    }

                } catch (Exception e) {
                    logger.warn("Error parsing contest record: {}", e.getMessage());
                    // Continue with next contest
                }
            }

            logger.info("Sync summary - Created: {}, Updated: {}", savedCount, updatedCount);

        } catch (Exception e) {
            logger.error("Error parsing API response: {}", e.getMessage(), e);
        }
    }

    /**
     * Manually trigger sync (useful for testing).
     * Can be called via endpoint if needed.
     */
    public void syncContestsManually() {
        logger.info("Manual contest sync triggered");
        syncContests();
    }

    /**
     * Normalize platform name from hostname to match ALLOWED_PLATFORMS list.
     * Examples: "codeforces.com" -> "codeforces", "kaggle.com" -> "kaggle"
     */
    private String normalizePlatform(String host) {
        if (host == null || host.isEmpty()) {
            return "";
        }
        
        // Remove common TLDs and get the main domain
        String normalized = host.toLowerCase()
            .replaceAll("\\.(com|by|io|net|org)$", "")
            .replaceAll("\\.", "")
            .trim();
        
        return normalized;
    }
}
