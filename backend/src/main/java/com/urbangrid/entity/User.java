package com.urbangrid.entity;

import jakarta.persistence.*;
import lombok.*;


@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    
    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private String fullName;

    @Column(unique = true)
    private String email;

    private String phone;


    public enum Role {
        ROLE_ADMIN,
        ROLE_OPERATOR,
        ROLE_COMMUTER
    }
}
