package com.urbangrid.dto;


public class JwtResponse {

    private String accessToken;   
    private String type = "Bearer";

    private Long id;
    private String username;
    private String email;
    private String role;           

    public JwtResponse(String accessToken, Long id, String username, String email, String role) {
        this.accessToken = accessToken;
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
    }

    
    public String getAccessToken() { return accessToken; }
    public String getType()        { return type; }
    public Long getId()            { return id; }
    public String getUsername()    { return username; }
    public String getEmail()       { return email; }
    public String getRole()        { return role; }
}
