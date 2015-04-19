package com.dhorton.hortonsnest.data;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.support.JdbcDaoSupport;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.stereotype.Repository;

import java.util.*;

/**
 * @author David Horton
 */
@Repository
public class AppJdbcDao extends JdbcDaoSupport implements AppDao {

    @Autowired
    public AppJdbcDao(DriverManagerDataSource dataSource) {
        this.setDataSource(dataSource);
    }

    @Override
    public List<Leader> getLeaders() {
        String sql = "SELECT * from \"leaders\"";

        List<Map<String, Object>> rows = getJdbcTemplate().queryForList(sql);

        List<Leader> leaders = new ArrayList<>();
        for(Map row : rows) {
            Leader leader = new Leader();
            leader.setId((Long) row.get("id"));
            leader.setName((String) row.get("name"));
            leader.setScore((Integer) row.get("score"));
            leaders.add(leader);
        }

        Collections.sort(leaders, new CustomComparator());

        ArrayList<Leader> trimmedLeaders = new ArrayList<>();
        for(int i = 0; i < 9 && i < leaders.size(); i++) {
            trimmedLeaders.add(leaders.get(i));
        }

        return trimmedLeaders;
    }

    public class CustomComparator implements Comparator<Leader> {
        @Override
        public int compare(Leader o1, Leader o2) {
            return o1.getScore().compareTo(o2.getScore());
        }
    }

}
