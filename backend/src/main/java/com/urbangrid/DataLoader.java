package com.urbangrid;

import com.urbangrid.entity.User;
import com.urbangrid.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;


@Component
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataLoader(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
    
        if (!userRepository.existsByUsername("admin")) {
            userRepository.save(User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .role(User.Role.ROLE_ADMIN)
                    .fullName("System Admin")
                    .email("admin@urbangrid.com")
                    .phone("9000000001")
                    .build());
            System.out.println("✅ Demo ADMIN user created: admin / admin123");
        }

       
        if (!userRepository.existsByUsername("operator1")) {
            userRepository.save(User.builder()
                    .username("operator1")
                    .password(passwordEncoder.encode("op123"))
                    .role(User.Role.ROLE_OPERATOR)
                    .fullName("John Operator")
                    .email("operator@urbangrid.com")
                    .phone("9000000002")
                    .build());
            System.out.println("✅ Demo OPERATOR user created: operator1 / op123");
        }

      
        if (!userRepository.existsByUsername("commuter1")) {
            userRepository.save(User.builder()
                    .username("commuter1")
                    .password(passwordEncoder.encode("com123"))
                    .role(User.Role.ROLE_COMMUTER)
                    .fullName("Jane Commuter")
                    .email("commuter@urbangrid.com")
                    .phone("9000000003")
                    .build());
            System.out.println("✅ Demo COMMUTER user created: commuter1 / com123");
        }
    }
}
