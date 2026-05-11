package com.studentworkspace.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * FIX: Removed duplicate WebMvcConfigurer CORS config that conflicted with
 * SecurityConfig.corsConfigurationSource(). CORS is now handled exclusively
 * by Spring Security's cors() filter (SecurityConfig).
 */
@Configuration
public class CorsConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
