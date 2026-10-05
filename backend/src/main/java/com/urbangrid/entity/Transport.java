package com.urbangrid.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;


@Entity
@Table(name = "transports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Transport number is required")
    @Column(nullable = false, unique = true)
    private String transportNumber;

    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransportType type;

    private int capacity;

    
    public enum TransportType {
        BUS,
        TRAIN,
        METRO
    }
}
