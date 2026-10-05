package com.urbangrid.controller;

import com.urbangrid.entity.Schedule;
import com.urbangrid.repository.ScheduleRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {

    private final ScheduleRepository scheduleRepository;

    public ScheduleController(ScheduleRepository scheduleRepository) {
        this.scheduleRepository = scheduleRepository;
    }

   
    @GetMapping
    @PreAuthorize("hasAnyRole('OPERATOR', 'ADMIN', 'COMMUTER')")
    public List<Schedule> getAll() {
        return scheduleRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Schedule create(@RequestBody Schedule schedule) {
        return scheduleRepository.save(schedule);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Schedule update(@PathVariable Long id, @RequestBody Schedule schedule) {
        schedule.setId(id);
        return scheduleRepository.save(schedule);
    }

    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        scheduleRepository.deleteById(id);
        return ResponseEntity.ok("Schedule deleted successfully.");
    }
}
