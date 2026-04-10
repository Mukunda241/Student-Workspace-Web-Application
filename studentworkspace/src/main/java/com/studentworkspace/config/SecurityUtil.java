package com.studentworkspace.config;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Utility class to extract current authenticated user from SecurityContext
 * 
 * Usage in any service/controller:
 *   Long userId = SecurityUtil.getCurrentUserId();
 *   if (userId == null) throw new UnauthorizedException();
 */
@Component
public class SecurityUtil {

    /**
     * Get current authenticated user ID from SecurityContext
     * 
     * @return userId if authenticated, null if not
     */
    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.isAuthenticated()) {
            try {
                return Long.parseLong(authentication.getPrincipal().toString());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        
        return null;
    }

    /**
     * Verify that current user owns the resource
     * 
     * Usage:
     *   if (!SecurityUtil.ownsResource(task.getUserId())) {
     *       throw new ForbiddenException("You don't own this resource");
     *   }
     */
    public static boolean ownsResource(Long resourceUserId) {
        Long currentUserId = getCurrentUserId();
        return currentUserId != null && currentUserId.equals(resourceUserId);
    }

    /**
     * Check if user is authenticated
     */
    public static boolean isAuthenticated() {
        return SecurityContextHolder.getContext().getAuthentication() != null &&
               SecurityContextHolder.getContext().getAuthentication().isAuthenticated();
    }
}
