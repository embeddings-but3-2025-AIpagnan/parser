package com.example.demo;

public class UserService {
    private DatabaseConnection connection;
    private String serviceName;
    
    public UserService(DatabaseConnection connection) {
        this.connection = connection;
        this.serviceName = "UserService";
    }
    
    public User findUserById(int userId) {
        String query = "SELECT * FROM users WHERE id = ?";
        return connection.executeQuery(query, userId);
    }
    
    public void createUser(String username, String email) {
        User newUser = new User(username, email);
        connection.save(newUser);
    }
}

class User {
    private String username;
    private String email;
    
    public User(String username, String email) {
        this.username = username;
        this.email = email;
    }
}