package com.studentworkspace.dto;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

/**
 * FIX: startTime and endTime are now returned as ISO-8601 strings WITH explicit
 * "+05:30" offset so the frontend always knows these are IST times.
 * e.g. "2026-05-10T08:00:00+05:30"  (never ambiguous UTC vs IST again)
 */
public class ContestResponse {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private static final DateTimeFormatter ISO_IST =
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssxxx").withZone(IST);

    private Long id;
    private String platform;
    private String contestName;
    // Changed to String — carries explicit +05:30 offset
    private String startTime;
    private String endTime;
    private String url;
    private String logoUrl;
    private boolean reminderSet;
    private String createdAt;
    private String updatedAt;
    // Keep duration in minutes for frontend display
    private Long duration;

    public ContestResponse() {}

    public ContestResponse(Long id, String platform, String contestName,
                           LocalDateTime startTime, String url) {
        this.id = id;
        this.platform = platform;
        this.contestName = contestName;
        this.startTime = toIST(startTime);
        this.url = url;
    }

    public ContestResponse(Long id, String platform, String contestName,
                           LocalDateTime startTime, LocalDateTime endTime,
                           String url, String logoUrl, boolean reminderSet,
                           LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.platform = platform;
        this.contestName = contestName;
        this.startTime = toIST(startTime);
        this.endTime   = toIST(endTime);
        this.url = url;
        this.logoUrl = logoUrl;
        this.reminderSet = reminderSet;
        this.createdAt = toIST(createdAt);
        this.updatedAt = toIST(updatedAt);
        // Compute duration in minutes if both times present
        if (startTime != null && endTime != null) {
            this.duration = java.time.Duration.between(startTime, endTime).toMinutes();
        }
    }

    /** Convert LocalDateTime (assumed IST, no TZ) → ISO string with +05:30 */
    private static String toIST(LocalDateTime ldt) {
        if (ldt == null) return null;
        // The value stored in DB is the IST wall-clock time (e.g. 08:00 IST).
        // We wrap it in IST zone to produce "2026-05-10T08:00:00+05:30".
        return ZonedDateTime.of(ldt, IST).format(ISO_IST);
    }

    // Getters / Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }

    public String getContestName() { return contestName; }
    public void setContestName(String contestName) { this.contestName = contestName; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public boolean isReminderSet() { return reminderSet; }
    public void setReminderSet(boolean reminderSet) { this.reminderSet = reminderSet; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public Long getDuration() { return duration; }
    public void setDuration(Long duration) { this.duration = duration; }
}
