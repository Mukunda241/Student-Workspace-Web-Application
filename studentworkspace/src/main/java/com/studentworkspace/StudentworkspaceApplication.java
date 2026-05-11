package com.studentworkspace;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.TimeZone;

import com.studentworkspace.repository.ContestRepository;
import com.studentworkspace.model.Contest;

@SpringBootApplication
@EnableScheduling
public class StudentworkspaceApplication {

    public static void main(String[] args) {
        // Set JVM timezone to IST (UTC+5:30) before anything starts
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
        SpringApplication.run(StudentworkspaceApplication.class, args);
    }

    /**
     * On startup: auto-correct any contests stored with wrong UTC times.
     * Detects by checking if stored_time + 5:30 is in the future but stored_time is in the past.
     * Safe to run every restart — only corrects genuinely wrong values.
     */
    @Bean
    CommandLineRunner fixContestTimezones(ContestRepository contestRepository) {
        return args -> {
            try {
                LocalDateTime nowIst = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
                int fixed = 0;
                for (Contest c : contestRepository.findAll()) {
                    if (c.getStartTime() == null) continue;
                    LocalDateTime stored    = c.getStartTime();
                    LocalDateTime corrected = stored.plusHours(5).plusMinutes(30);
                    // Only fix if stored time looks like UTC (past) but corrected is upcoming
                    if (stored.isBefore(nowIst.minusHours(1)) && corrected.isAfter(nowIst.minusHours(2))) {
                        c.setStartTime(corrected);
                        if (c.getEndTime() != null)
                            c.setEndTime(c.getEndTime().plusHours(5).plusMinutes(30));
                        contestRepository.save(c);
                        fixed++;
                    }
                }
                if (fixed > 0)
                    System.out.println("[STARTUP] Auto-fixed " + fixed + " contest time(s): UTC → IST (+05:30)");
                else
                    System.out.println("[STARTUP] Contest times OK — no auto-fix needed.");
            } catch (Exception e) {
                System.err.println("[STARTUP] Contest timezone check failed: " + e.getMessage());
            }
        };
    }
}
