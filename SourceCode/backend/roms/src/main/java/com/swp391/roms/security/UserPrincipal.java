package com.swp391.roms.security;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.swp391.roms.entity.User;
import com.swp391.roms.entity.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

@Getter
@AllArgsConstructor
@Builder
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String username;
    @JsonIgnore
    private final String password;
    private final String fullName;
    private final String email;
    private final String role;
    private final Collection<? extends GrantedAuthority> authorities;
    private final boolean active;
    private final boolean locked;

    public static UserPrincipal create(User user) {
        String roleName = user.getRole().getName().name();
        List<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority(roleName)
        );

        boolean isLocked = user.getStatus() == UserStatus.LOCKED ||
                (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now()));

        boolean isActive = user.getStatus() == UserStatus.ACTIVE && !isLocked;

        return UserPrincipal.builder()
                .id(user.getId())
                .username(user.getUsername())
                .password(user.getPasswordHash())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(roleName)
                .authorities(authorities)
                .active(user.getStatus() != UserStatus.INACTIVE)
                .locked(isLocked)
                .build();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !locked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
