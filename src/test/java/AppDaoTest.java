import com.dhorton.hortonsnest.data.AppDao;
import org.junit.Ignore;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

/**
 * @author David Horton
 */
@Ignore
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "classpath:test-servlet-config.xml")
public class AppDaoTest {

    @Autowired
    private AppDao dao;

    @Test
    public void testGetLeaders() {
        dao.getLeaders();
    }

    @Test
    public void testGetAndIncrementSiteVisitCount() {
        Integer visitCount = dao.getAndIncrementSiteVisitCount();
        System.out.println("Visit count is: " + visitCount);
    }

}
