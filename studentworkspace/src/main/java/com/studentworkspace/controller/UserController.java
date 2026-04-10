package com.studentworkspace.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.studentworkspace.model.User;
import com.studentworkspace.service.UserService;
import com.studentworkspace.util.TokenProvider;
import com.studentworkspace.dto.UserRegisterRequest;
import com.studentworkspace.dto.UserLoginRequest;
import com.studentworkspace.dto.UserResponse;
import com.studentworkspace.dto.UserLoginResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private TokenProvider tokenProvider;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody UserRegisterRequest request) {
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        
        User registeredUser = userService.registerUser(user);
        UserResponse response = new UserResponse(registeredUser.getId(), registeredUser.getName(), registeredUser.getEmail());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    @PostMapping("/login")
    public ResponseEntity<UserLoginResponse> login(@Valid @RequestBody UserLoginRequest request) {
        User user = userService.loginUser(request.getEmail(), request.getPassword());
        
        // Generate JWT token for this user
        String token = tokenProvider.generateToken(user.getId());
        
        UserLoginResponse response = new UserLoginResponse(
            user.getId(), 
            user.getName(), 
            user.getEmail(), 
            token
        );
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
