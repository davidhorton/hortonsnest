package com.dhorton.hortonsnest;

import com.dhorton.hortonsnest.data.AppDao;
import com.dhorton.hortonsnest.data.Leader;
import com.dhorton.hortonsnest.web.ViewModelFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.servlet.ModelAndView;

import java.util.List;

/**
 * @author David Horton
 */
@Controller
public class GameController {

    @Autowired
    private ViewModelFactory viewModelFactory;
    @Autowired
    private AppDao dao;

    @RequestMapping(value = "/", method = RequestMethod.GET)
    public ModelAndView index() {
        return new ModelAndView("index", "viewModel", viewModelFactory.createViewModel());
    }

    @RequestMapping(value = "/submitScore", method = RequestMethod.POST)
    @ResponseStatus(value = HttpStatus.OK)
    public void submitScore(Leader newLeader) {
        dao.insertNewLeader(newLeader);
    }

    @RequestMapping(value = "/leaders", method = RequestMethod.GET)
    public @ResponseBody List<Leader> refreshLeaders() {
        return dao.getLeaders();
    }


}
