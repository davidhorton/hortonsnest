package com.dhorton.hortonsnest.web;

public class ViewModel {

    private Integer pageViews;
    private String submitScoreUrl;
    private String getLeadersUrl;

    public Integer getPageViews() {
        return pageViews;
    }

    public void setPageViews(Integer pageViews) {
        this.pageViews = pageViews;
    }

    public String getSubmitScoreUrl() {
        return submitScoreUrl;
    }

    public void setSubmitScoreUrl(String submitScoreUrl) {
        this.submitScoreUrl = submitScoreUrl;
    }

    public String getGetLeadersUrl() {
        return getLeadersUrl;
    }

    public void setGetLeadersUrl(String getLeadersUrl) {
        this.getLeadersUrl = getLeadersUrl;
    }
}
