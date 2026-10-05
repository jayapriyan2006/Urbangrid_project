package com.urbangrid.controller;

import com.urbangrid.entity.DelayAlert;
import com.urbangrid.repository.DelayAlertRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;


@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final DelayAlertRepository alertRepository;

    public AlertController(DelayAlertRepository alertRepository) {
        this.alertRepository = alertRepository;
    }


    @GetMapping
    public List<DelayAlert> getAll() {
        return alertRepository.findAll();
    }

   
    @PostMapping
    public DelayAlert create(@RequestBody DelayAlert alert) {
        
        alert.setCreatedAt(LocalDateTime.now());
        return alertRepository.save(alert);
    }
}
