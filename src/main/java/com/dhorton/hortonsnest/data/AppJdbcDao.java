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
        String sql = "SELECT * from \"leaders\" order by \"score\" DESC LIMIT 10";

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
        //trimmedLeaders.add(makeDavidHortonAwesome());
        for(int i = 0; i < 10 && i < leaders.size(); i++) {
            trimmedLeaders.add(leaders.get(i));
        }

        return trimmedLeaders;
    }

    @Override
    public Integer getAndIncrementSiteVisitCount() {
        //Get current site count
        String sql = "select \"count\" from \"siteVisits\" where \"id\" = 1";
        Integer visitCount = getJdbcTemplate().queryForInt(sql);

        //Increment the site count
        String updateSql = "UPDATE \"siteVisits\" SET \"count\"=((select \"count\" from \"siteVisits\" where \"id\" = 1) + 1) WHERE \"id\"=1";
        getJdbcTemplate().update(updateSql);

        return visitCount;
    }

    @Override
    public void insertNewLeader(Leader leader) {
        String sql = "INSERT into \"leaders\" (\"name\", \"score\") VALUES (?, ?);";
        getJdbcTemplate().update(sql, leader.getName(), leader.getScore());

    }

    /**
     * Yup, you got it - I am shamelessly making it so I always have the highest score. -David Horton
     * @return David Horton in an awesome state
     */
    private Leader makeDavidHortonAwesome() {
        Leader myself = new Leader();
        myself.setName("David Horton");
        myself.setScore(988642287);
        return myself;
    }

    /**
     * For sorting the leaders list by score
     */
    public class CustomComparator implements Comparator<Leader> {
        @Override
        public int compare(Leader o1, Leader o2) {
            return o2.getScore().compareTo(o1.getScore());
        }
    }

}
