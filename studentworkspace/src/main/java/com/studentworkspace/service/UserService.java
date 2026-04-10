package com.studentworkspace.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.studentworkspace.model.User;
import com.studentworkspace.repository.UserRepository;
import com.studentworkspace.exception.DuplicateResourceException;
import com.studentworkspace.exception.ResourceNotFoundException;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User registerUser(User user) {

        // Check if email already exists
        if (userRepository.findByEmail(user.getEmail()) != null) {
            throw new DuplicateResourceException("Email already registered!");
        }

        // Encrypt password
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        return userRepository.save(user);
    }
    
    public User loginUser(String email, String password) {

        User user = userRepository.findByEmail(email);

        if (user == null) {
            throw new ResourceNotFoundException("User not found!");
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new ResourceNotFoundException("Invalid password!");
        }

        return user;
    }

}

