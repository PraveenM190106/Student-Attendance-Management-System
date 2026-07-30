package com.attendance.system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AttendanceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AttendanceApplication.class, args);
        System.out.println("\n=======================================================");
        System.out.println("  Student Attendance Management Backend Service Started ");
        System.out.println("  URL: http://localhost:8080");
        System.out.println("=======================================================\n");
    }
}
