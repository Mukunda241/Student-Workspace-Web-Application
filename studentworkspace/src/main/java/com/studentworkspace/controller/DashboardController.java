package com.studentworkspace.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.studentworkspace.service.DashboardService;
import com.studentworkspace.dto.DashboardResponse;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * Dashboard Controller
 * Aggregates data from multiple modules into a single summary view
 * 
 * Endpoints:
 * - GET /api/dashboard/summary/{userId} - Get complete dashboard data
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private static final Logger logger = LoggerFactory.getLogger(DashboardController.class);

    @Autowired
    private DashboardService dashboardService;

    /**
     * Get complete dashboard summary for a user
     * 
     * Returns:
     * - User statistics (total tasks, completed, time spent, ongoing projects)
     * - Top 3 urgent tasks (by deadline)
     * - Next 5 upcoming contests
     * 
     * @param userId The user ID
     * @return DashboardResponse with aggregated data
     */
    @GetMapping("/test")
    public String test() {
        return "OK";
    }

    @GetMapping("/summary/{userId}")
    public DashboardResponse getDashboardSummary(@PathVariable Long userId) {
        try {
            logger.info("Controller: getDashboardSummary called with userId: " + userId);
            DashboardResponse dashboardResponse = dashboardService.getDashboardSummary(userId);
            logger.info("Controller: Dashboard response retrieved successfully");
            return dashboardResponse;
        } catch (Exception e) {
            logger.error("Controller: Error in getDashboardSummary: " + e.getMessage(), e);
            throw new RuntimeException("Error fetching dashboard data", e);
        }
    }

    // Simple error response class
    public static class ErrorResponse {
        public String message;
        public ErrorResponse(String message) {
            this.message = message;
        }
        public String getMessage() { return message; }
    }
}
