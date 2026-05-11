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
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.Set;

@Service
public class ContestSyncService {

    private static final Logger logger = LoggerFactory.getLogger(ContestSyncService.class);

    // Allowed platforms - must match normalized form of clist.by host field
    private static final Set<String> ALLOWED_PLATFORMS = Set.of(
        "codeforces.com",
        "leetcode.com",
        "codechef.com",
        "hackerrank.com",
        "atcoder.jp",
        "kaggle.com",
        "topcoder.com"
    );

    // Display names for platforms stored in DB
    private static final java.util.Map<String, String> PLATFORM_DISPLAY = new java.util.HashMap<>();
    static {
        PLATFORM_DISPLAY.put("codeforces.com",  "Codeforces");
        PLATFORM_DISPLAY.put("leetcode.com",    "LeetCode");
        PLATFORM_DISPLAY.put("codechef.com",    "CodeChef");
        PLATFORM_DISPLAY.put("hackerrank.com",  "HackerRank");
        PLATFORM_DISPLAY.put("atcoder.jp",      "AtCoder");
        PLATFORM_DISPLAY.put("kaggle.com",      "Kaggle");
        PLATFORM_DISPLAY.put("topcoder.com",    "TopCoder");
    }

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

    /** Scheduled auto-sync every day at 2 AM */
    @Scheduled(cron = "${contest.sync.cron:0 0 2 * * ?}")
    public void syncContests() {
        if (!syncEnabled) return;
        logger.info("Starting scheduled contest sync…");
        doSync();
    }

    /** Called by controller for manual sync */
    public void syncContestsManually() {
        logger.info("Manual contest sync triggered");
        doSync();
    }

    /** Core sync logic */
    private void doSync() {
        try {
            String json = fetchFromAPI();
            if (json == null || json.isBlank()) {
                logger.warn("Empty response from contest API");
                return;
            }
            parseAndSave(json);
        } catch (Exception e) {
            logger.error("Contest sync failed: {}", e.getMessage(), e);
            throw new RuntimeException("Sync failed: " + e.getMessage(), e);
        }
    }

    /**
     * Fetch contests from clist.by API v4.
     *
     * FIX 1: Use exchange() with HttpEntity so Authorization header is sent.
     *        getForEntity(url, class, entity) passes entity as a URI variable,
     *        NOT as an HttpEntity — so auth headers were never sent → 403 Forbidden.
     *
     * FIX 2: clist.by v4 uses "Authorization: ApiKey username:key" header.
     */
    private String fetchFromAPI() {
        // Build URL — fetch upcoming contests from all allowed platforms
        String resourceFilter = String.join(",", ALLOWED_PLATFORMS);
        String url = apiUrl
            + "?upcoming=true"
            + "&order_by=start"
            + "&limit=100"
            + "&resource__in=" + resourceFilter;

        // FIX: set Authorization header correctly
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "ApiKey " + apiUsername + ":" + apiKey);
        headers.set("Accept", "application/json");
        headers.set("User-Agent", "StudentWorkspace/1.0");

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        logger.info("Fetching contests from clist.by (user={})", apiUsername);

        // FIX: use exchange() — getForEntity() does NOT support passing HttpEntity
        ResponseEntity<String> response = restTemplate.exchange(
            url, HttpMethod.GET, entity, String.class
        );

        if (response.getStatusCode().is2xxSuccessful()) {
            logger.info("Fetched contest data successfully ({} chars)", 
                response.getBody() != null ? response.getBody().length() : 0);
            return response.getBody();
        } else {
            logger.error("API returned {}", response.getStatusCode());
            return null;
        }
    }

    /**
     * Parse clist.by JSON and upsert contests into DB.
     *
     * FIX 3: normalizePlatform was broken — "leetcode.com".replaceAll("\\.(com|...)$","")
     *        produced "leetcodcom" not "leetcode". Now we keep the full host string
     *        and compare against the full ALLOWED_PLATFORMS set directly.
     *
     * FIX 4: UTC times are converted to IST before storing so DB always holds IST wall-clock.
     */
    private void parseAndSave(String json) throws Exception {
        JsonNode root = objectMapper.readTree(json);
        JsonNode objects = root.get("objects");

        if (objects == null || !objects.isArray()) {
            logger.warn("No 'objects' array in API response");
            return;
        }

        int created = 0, updated = 0, skipped = 0;

        for (JsonNode node : objects) {
            try {
                String externalId   = node.path("id").asText();
                String host         = node.path("host").asText().toLowerCase().trim();
                String title        = node.path("event").asText();
                String startTimeStr = node.path("start").asText();
                String endTimeStr   = node.path("end").asText();
                String url          = node.path("href").asText();

                // FIX: compare full host string against ALLOWED_PLATFORMS
                if (!ALLOWED_PLATFORMS.contains(host)) {
                    skipped++;
                    continue;
                }

                // Display name (e.g. "codeforces.com" → "Codeforces")
                String displayName = PLATFORM_DISPLAY.getOrDefault(host, host);

                // FIX: convert UTC → IST correctly
                LocalDateTime startIst = parseToIST(startTimeStr);
                LocalDateTime endIst   = parseToIST(endTimeStr);

                if (startIst == null) {
                    logger.warn("Skipping contest with unparseable time: {}", startTimeStr);
                    continue;
                }

                Optional<Contest> existing = contestRepository.findByExternalId(externalId);
                if (existing.isPresent()) {
                    Contest c = existing.get();
                    c.setContestName(title);
                    c.setStartTime(startIst);
                    c.setEndTime(endIst);
                    c.setUrl(url);
                    c.setPlatform(displayName);
                    contestRepository.save(c);
                    updated++;
                } else {
                    Contest c = new Contest();
                    c.setExternal_id(externalId);
                    c.setPlatform(displayName);
                    c.setContestName(title);
                    c.setStartTime(startIst);
                    c.setEndTime(endIst);
                    c.setUrl(url);
                    contestRepository.save(c);
                    created++;
                }
            } catch (Exception e) {
                logger.warn("Error processing contest node: {}", e.getMessage());
            }
        }
        logger.info("Sync done — created:{}, updated:{}, skipped:{}", created, updated, skipped);
    }

    /**
     * Parse an ISO-8601 UTC string (e.g. "2026-05-13T09:00:00Z") and convert to IST LocalDateTime.
     * Result: stores "2026-05-13T14:30:00" in DB (14:30 IST wall-clock).
     * ContestResponse then wraps this as "2026-05-13T14:30:00+05:30" for the frontend.
     */
    private LocalDateTime parseToIST(String str) {
        if (str == null || str.isBlank() || str.equals("null")) return null;
        try {
            ZonedDateTime utc = ZonedDateTime.parse(str, DateTimeFormatter.ISO_DATE_TIME);
            return utc.withZoneSameInstant(ZoneId.of("Asia/Kolkata")).toLocalDateTime();
        } catch (Exception e1) {
            try {
                // Fallback: treat as-is if no TZ info
                return LocalDateTime.parse(str.replaceAll("[Z+].*$", ""),
                    DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (Exception e2) {
                logger.warn("Cannot parse datetime '{}': {}", str, e2.getMessage());
                return null;
            }
        }
    }
}
