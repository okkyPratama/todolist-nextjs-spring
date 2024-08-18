package com.example.test_springboot.service;

import com.example.test_springboot.api.model.Task;
import com.example.test_springboot.repository.TaskRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TaskService {
    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @Transactional
    public Task saveTask(Task task) {
        return taskRepository.save(task);
    }

    public List<Task> getAllTasks() {
        return taskRepository.findAll();

    }

    public Optional<Task> getTaskById(Integer id) {
        return taskRepository.findById(id);
    }

    @Transactional
    public void deleteTask(Integer id) {
        if(!taskRepository.existsById(id)) {
            throw new EntityNotFoundException("Task not found with id: " + id);
        }
        taskRepository.deleteById(id);
    }

    @Transactional
    public Task updateTask(Integer id, Task taskDetails) {
       return taskRepository.findById(id)
               .map(existingTask -> {
                   existingTask.setTitle(taskDetails.getTitle());
                   existingTask.setStatus(taskDetails.getStatus());
                   existingTask.setDescription(taskDetails.getDescription());
                   existingTask.setDeadline(taskDetails.getDeadline());
                   return taskRepository.save(existingTask);
               })
               .orElseThrow(() -> new EntityNotFoundException("Task not found with id: " + id));
    }



}
