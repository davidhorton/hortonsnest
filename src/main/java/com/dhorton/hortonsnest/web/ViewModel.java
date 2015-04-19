package com.dhorton.hortonsnest.web;

import com.dhorton.hortonsnest.data.Leader;

import java.util.List;

public class ViewModel {

    private List<Leader> leaders;
    private Integer pageViews;

    public List<Leader> getLeaders() {
        return leaders;
    }

    public void setLeaders(List<Leader> leaders) {
        this.leaders = leaders;
    }

    public Integer getPageViews() {
        return pageViews;
    }

    public void setPageViews(Integer pageViews) {
        this.pageViews = pageViews;
    }
}
