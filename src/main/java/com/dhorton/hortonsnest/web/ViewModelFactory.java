package com.dhorton.hortonsnest.web;

import com.dhorton.hortonsnest.data.AppDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * @author David Horton
 */
@Component
public class ViewModelFactory {

    @Autowired
    private AppDao dao;

    public ViewModel createViewModel() {
        ViewModel viewModel = new ViewModel();
        viewModel.setPageViews(dao.getAndIncrementSiteVisitCount());
        viewModel.setLeaders(dao.getLeaders());
        return viewModel;
    }

}
