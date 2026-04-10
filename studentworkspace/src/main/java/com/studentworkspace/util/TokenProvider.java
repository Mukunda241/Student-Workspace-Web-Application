package com.studentworkspace.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;

/**
 * JWT Token Provider
 * Handles token generation, validation, and user ID extraction
 */
@Component
public class TokenProvider {

    @Value("${app.jwtSecret:MySecureSecretKeyFor256BitHS256AlgorithmEncryption}")
    private String jwtSecret;

    @Value("${app.jwtExpirationInMs:86400000}") // 24 hours default
    private long jwtExpirationInMs;

    /**
     * Generate JWT token for authenticated user
     * @param userId User ID to encode in token
     * @return JWT token string
     */
    public String generateToken(Long userId) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        return Jwts.builder()
                .setSubject(userId.toString())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Validate JWT token and extract user ID
     * @param token JWT token to validate
     * @return Optional containing user ID if valid, empty if invalid/expired
     */
    public Optional<Long> validateAndGetUserId(String token) {
        try {
            if (token == null || token.isEmpty()) {
                return Optional.empty();
            }

            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String userId = claims.getSubject();
            return Optional.of(Long.parseLong(userId));

        } catch (ExpiredJwtException ex) {
            System.err.println("Expired JWT token: " + ex.getMessage());
            return Optional.empty();
        } catch (UnsupportedJwtException ex) {
            System.err.println("Unsupported JWT token: " + ex.getMessage());
            return Optional.empty();
        } catch (MalformedJwtException ex) {
            System.err.println("Malformed JWT token: " + ex.getMessage());
            return Optional.empty();
        } catch (SignatureException ex) {
            System.err.println("Invalid JWT signature: " + ex.getMessage());
            return Optional.empty();
        } catch (IllegalArgumentException ex) {
            System.err.println("JWT claims string is empty: " + ex.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Extract token from Authorization header
     * Expected format: "Bearer {token}"
     * @param authorizationHeader Authorization header value
     * @return Token string if valid format, empty otherwise
     */
    public Optional<String> extractTokenFromHeader(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return Optional.empty();
        }
        return Optional.of(authorizationHeader.substring(7)); // Remove "Bearer " prefix
    }
}
