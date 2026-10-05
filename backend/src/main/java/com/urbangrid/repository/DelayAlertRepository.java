package com.urbangrid.repository;

import com.urbangrid.entity.DelayAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface DelayAlertRepository extends JpaRepository<DelayAlert, Long> {
    
}
