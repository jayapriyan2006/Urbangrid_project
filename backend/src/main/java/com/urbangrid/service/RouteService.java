package com.urbangrid.service;

import com.urbangrid.entity.Route;

import java.util.List;


public interface RouteService {

    List<Route> getAll();

    Route getById(Long id);

    Route create(Route route);

    Route update(Long id, Route route);

    void delete(Long id);
}
