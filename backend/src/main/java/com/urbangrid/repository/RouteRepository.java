package com.urbangrid.repository;

import com.urbangrid.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface RouteRepository extends JpaRepository<Route, Long> {

   
    List<Route> findBySourceContainingIgnoreCaseAndDestinationContainingIgnoreCase(
            String source, String destination);

  
    @Query("SELECT r FROM Route r WHERE r.routeName LIKE %?1%")
    List<Route> findByRouteNameCustom(String routeName);
}
