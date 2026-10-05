package com.urbangrid.controller;

import com.urbangrid.entity.Route;
import com.urbangrid.service.RouteService;
import com.urbangrid.repository.RouteRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/routes")
public class RouteController {

    private final RouteService routeService;
    private final RouteRepository routeRepository;

    public RouteController(RouteService routeService, RouteRepository routeRepository) {
        this.routeService = routeService;
        this.routeRepository = routeRepository;
    }

    
    @GetMapping
    @PreAuthorize("hasAnyRole('OPERATOR', 'ADMIN')")
    public ResponseEntity<List<Route>> getAll() {
        return ResponseEntity.ok(routeService.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OPERATOR', 'ADMIN')")
    public ResponseEntity<Route> getById(@PathVariable Long id) {
        return ResponseEntity.ok(routeService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> create(@Valid @RequestBody Route route) {
        routeService.create(route);
        return new ResponseEntity<>("Route created successfully.", HttpStatus.CREATED);
    }

    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> update(@PathVariable Long id,
                                         @Valid @RequestBody Route route) {
        routeService.update(id, route);
        return ResponseEntity.ok("Route updated successfully.");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        routeService.delete(id);
        return ResponseEntity.ok("Route deleted successfully.");
    }
    

  
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('OPERATOR', 'ADMIN', 'COMMUTER')")
    public List<Route> search(@RequestParam String source,
                               @RequestParam String destination) {
        return routeRepository
                .findBySourceContainingIgnoreCaseAndDestinationContainingIgnoreCase(
                        source, destination);
    }
}
