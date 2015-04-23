package com.dhorton.hortonsnest.web;

import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Component
public class UrlBuilder {

    public String buildSubmitScoreUrl() {
        return makeUrlWithAppContext("/submitScore");
    }

    public String buildGetLeadersUrl() {
        return makeUrlWithAppContext("/leaders");
    }

    private String makeUrlWithAppContext(String url) {
        return getApplicationContextPath() + url;
    }

    private String getApplicationContextPath() {
        return ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest().getContextPath();
    }

}