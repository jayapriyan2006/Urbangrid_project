package com.urbangrid.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;


@Entity
@Table(name = "delay_alerts")
@Getter
@Setter
@AllArgsConstructor
@Builder
public class DelayAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String message;

    private String alertType;

    private LocalDateTime createdAt;

    
    @ManyToOne
    @JoinColumn(name = "schedule_id")
    private Schedule schedule;

    public DelayAlert() {
        this.createdAt = LocalDateTime.now();
    }
}
