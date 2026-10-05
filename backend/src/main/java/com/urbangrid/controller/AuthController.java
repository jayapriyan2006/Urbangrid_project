package com.urbangrid.controller;
import com.urbangrid.dto.JwtResponse;
import com.urbangrid.dto.LoginRequest;
import com.urbangrid.dto.SignupRequest;
import com.urbangrid.entity.User;
import com.urbangrid.repository.UserRepository;
import com.urbangrid.security.JwtUtils;
import com.urbangrid.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

/**
 * Handles user authentication (login) and registration.
 * All endpoints are PUBLIC — no JWT required.
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthController(AuthenticationManager authenticationManager,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtils jwtUtils) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
                
        }
    // ── POST /api/auth/login ──────────────────────────────────

    /**
     * Authenticates the user and returns a JWT token.
     * The frontend stores the full response in localStorage as "user".
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {

        // Authenticate using Spring Security's AuthenticationManager
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()));

        // Store authentication in the security context
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Generate JWT token
        String jwt = jwtUtils.generateJwtToken(authentication);

        // Extract user details from the authenticated principal
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        // Extract role (each user has exactly one role)
        String role = userDetails.getAuthorities()
                .iterator().next()
                .getAuthority();

        return ResponseEntity.ok(new JwtResponse(
                jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                role));
    }

    // ── POST /api/auth/register ───────────────────────────────

    /**
     * Registers a new user.
     * Defaults role to ROLE_COMMUTER if not provided.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody SignupRequest signUpRequest) {

        // Check for duplicate username
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity.badRequest().body("Error: Username is taken!");
        }
        // Build and save the new user
        User user = User.builder()
                .username(signUpRequest.getUsername())
                .password(passwordEncoder.encode(signUpRequest.getPassword()))
                .email(signUpRequest.getEmail())
                .fullName(signUpRequest.getFullName())
                // Default to COMMUTER if role not specified
                .role(signUpRequest.getRole() != null
                        ? signUpRequest.getRole()
                        : User.Role.ROLE_COMMUTER)
                .build();

        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully!");
    }
}
