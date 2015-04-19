package com.dhorton.hortonsnest;

import com.dhorton.hortonsnest.web.ViewModelFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.ModelAndView;

/**
 * @author David Horton
 */
@Controller
public class GameController {

    @Autowired
    private ViewModelFactory viewModelFactory;

    @RequestMapping(value = "/", method = RequestMethod.GET)
    public ModelAndView index() {
        return new ModelAndView("index", "viewModel", viewModelFactory.createViewModel());
    }


}
