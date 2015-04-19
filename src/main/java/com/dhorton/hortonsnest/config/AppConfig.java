package com.dhorton.hortonsnest.config;

import org.postgresql.Driver;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ResourceLoader;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.web.servlet.ViewResolver;
import org.springframework.web.servlet.view.mustache.MustacheTemplateLoader;
import org.springframework.web.servlet.view.mustache.MustacheViewResolver;

import java.util.Properties;

/**
 * @author David Horton
 */
@Configuration
public class AppConfig {

    @Bean
    public ViewResolver getViewResolver(ResourceLoader resourceLoader) {
        MustacheViewResolver mustacheViewResolver = new MustacheViewResolver();
        mustacheViewResolver.setPrefix("/WEB-INF/views/");
        mustacheViewResolver.setSuffix(".html");
        mustacheViewResolver.setCache(false);
        mustacheViewResolver.setContentType("text/html;charset=utf-8");

        MustacheTemplateLoader mustacheTemplateLoader = new MustacheTemplateLoader();
        mustacheTemplateLoader.setResourceLoader(resourceLoader);

        mustacheViewResolver.setTemplateLoader(mustacheTemplateLoader);
        return mustacheViewResolver;
    }

    @Value("${database.url}")
    private String url;
    @Value("${database.username}")
    private String username;
    @Value("${database.password}")
    private String password;

    @Bean
    public DriverManagerDataSource appDataSource() {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName(Driver.class.getName());
        //ssl=true&amp;sslfactory=org.postgresql.ssl.NonValidatingFactory
        Properties prop = new Properties();
        prop.setProperty("ssl", "true");
        prop.setProperty("sslfactory", "org.postgresql.ssl.NonValidatingFactory");
        dataSource.setConnectionProperties(prop);
        dataSource.setUrl(url);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        return dataSource;
    }

    @Bean
    @Autowired
    public DataSourceTransactionManager dataSourceTransactionManager(DriverManagerDataSource dataSource) {
        DataSourceTransactionManager dataSourceTransactionManager = new DataSourceTransactionManager();
        dataSourceTransactionManager.setDataSource(dataSource);
        return dataSourceTransactionManager;
    }

}
