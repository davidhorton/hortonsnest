package com.dhorton.hortonsnest;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

/**
 * @author David Horton
 */
@Controller
public class GameController {

    @RequestMapping(value = "/hortonsnest", method = RequestMethod.GET)
    public String index() {
        return "index";
    }


}
