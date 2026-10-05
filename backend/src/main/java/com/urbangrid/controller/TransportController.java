package com.urbangrid.controller;

import com.urbangrid.entity.Transport;
import com.urbangrid.repository.TransportRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/transports")
public class TransportController {

    private final TransportRepository transportRepository;

    public TransportController(TransportRepository transportRepository) {
        this.transportRepository = transportRepository;
    }

    
    @GetMapping
    public List<Transport> getAll() {
        return transportRepository.findAll();
    }

    
    @PostMapping
    public Transport create(@RequestBody Transport transport) {
        return transportRepository.save(transport);
    }
}
