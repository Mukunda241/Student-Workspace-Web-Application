package com.studentworkspace;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class StudentworkspaceApplication {

    public static void main(String[] args) {
        SpringApplication.run(StudentworkspaceApplication.class, args);
    }
}
