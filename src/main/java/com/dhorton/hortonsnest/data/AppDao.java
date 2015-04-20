package com.dhorton.hortonsnest.data;

import java.util.List;

/**
 * @author David Horton
 */
public interface AppDao {

    List<Leader> getLeaders();
    Integer getAndIncrementSiteVisitCount();
    void insertNewLeader(String name, Integer score);

}
