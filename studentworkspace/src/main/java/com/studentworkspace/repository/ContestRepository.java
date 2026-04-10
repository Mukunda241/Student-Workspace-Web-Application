package com.studentworkspace.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.studentworkspace.model.Contest;

@Repository
public interface ContestRepository extends JpaRepository<Contest, Long> {

    List<Contest> findByPlatform(String platform);

    List<Contest> findByStartTimeAfter(LocalDateTime dateTime);

    @Query("SELECT c FROM Contest c WHERE c.startTime >= ?1 ORDER BY c.startTime ASC")
    List<Contest> findUpcomingContests(LocalDateTime dateTime);

    @Query("SELECT c FROM Contest c WHERE c.platform = ?1 ORDER BY c.startTime ASC")
    List<Contest> findByPlatformOrderByStartTime(String platform);

    @Query("SELECT c FROM Contest c WHERE c.startTime >= ?1 AND c.platform = ?2 ORDER BY c.startTime ASC")
    List<Contest> findUpcomingContestsByPlatform(LocalDateTime dateTime, String platform);

    Optional<Contest> findByContestNameAndPlatform(String contestName, String platform);

    @Query("SELECT c FROM Contest c WHERE c.external_id = :externalId")
    Optional<Contest> findByExternalId(@Param("externalId") String externalId);

    @Query("SELECT c FROM Contest c WHERE c.user.id = ?1 AND c.reminderSet = true")
    List<Contest> findUserReminders(Long userId);

    @Query("SELECT c FROM Contest c WHERE c.startTime BETWEEN ?1 AND ?2 ORDER BY c.startTime ASC")
    List<Contest> findContestsBetween(LocalDateTime start, LocalDateTime end);
}
