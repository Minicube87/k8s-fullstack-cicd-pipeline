
package com.todo.backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

@SpringBootApplication
public class TodoBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(TodoBackendApplication.class, args);
    }
}

@RestController
class TodoController {
    private final Logger logger = Logger.getLogger(TodoController.class.getName());
    private final List<String> tasks = new ArrayList<>();

    @PostMapping("/add-task")
    public String addTask(@RequestBody String task) {
        tasks.add(task);
        logger.info("New task added: " + task);
        return "Task added successfully";
    }

    @GetMapping("/tasks")
    public List<String> getTasks() {
        return tasks;
    }
}
