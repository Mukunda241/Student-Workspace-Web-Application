package com.studentworkspace.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.studentworkspace.model.User;

public interface UserRepository extends JpaRepository<User, Long> {

    User findByEmail(String email);

}
