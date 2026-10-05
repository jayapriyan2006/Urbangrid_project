package com.urbangrid.controller;

import com.urbangrid.repository.*;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/reports")
public class ReportsController {

    private final RouteRepository routeRepository;
    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private final TransportRepository transportRepository;
    private final DelayAlertRepository alertRepository;

    public ReportsController(RouteRepository routeRepository,
                              ScheduleRepository scheduleRepository,
                              UserRepository userRepository,
                              TransportRepository transportRepository,
                              DelayAlertRepository alertRepository) {
        this.routeRepository = routeRepository;
        this.scheduleRepository = scheduleRepository;
        this.userRepository = userRepository;
        this.transportRepository = transportRepository;
        this.alertRepository = alertRepository;
    }

    
    @GetMapping("/stats")
    public Map<String, Long> getStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalRoutes",     routeRepository.count());
        stats.put("totalSchedules",  scheduleRepository.count());
        stats.put("totalUsers",      userRepository.count());
        stats.put("totalTransports", transportRepository.count());
        stats.put("totalAlerts",     alertRepository.count());
        return stats;
    }

    
    @GetMapping("/volume")
    public List<Map<String, Object>> getVolume() {
  
        return List.of(
                Map.of("day", "Monday",    "schedules", scheduleRepository.count()),
                Map.of("day", "Tuesday",   "schedules", Math.max(0, scheduleRepository.count() - 1)),
                Map.of("day", "Wednesday", "schedules", Math.max(0, scheduleRepository.count() - 2))
        );
    }

   

    @GetMapping("/share")
    public List<Map<String, Object>> getShare() {
        long total = transportRepository.count();
        
        return List.of(
                Map.of("type", "BUS",   "count", total > 0 ? 2 : 0),
                Map.of("type", "TRAIN", "count", total > 1 ? 1 : 0),
                Map.of("type", "METRO", "count", total > 2 ? 1 : 0)
        );
    }
}
