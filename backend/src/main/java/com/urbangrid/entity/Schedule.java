package com.urbangrid.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;


@Entity
@Table(name = "schedules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime departureTime;

    @Column(nullable = false)
    private LocalDateTime arrivalTime;

    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ScheduleStatus status = ScheduleStatus.ON_TIME;

    
    @ManyToOne
    @JoinColumn(name = "transport_id")
    private Transport transport;

    
    @ManyToOne
    @JoinColumn(name = "route_id")
    private Route route;

    
    @OneToMany(mappedBy = "schedule", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<DelayAlert> alerts;


    public enum ScheduleStatus {
        ON_TIME,
        DELAYED,
        CANCELLED
    }
}
