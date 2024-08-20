package com.team8.aichatbotproject.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;


// 반복적으로 API 호출하는 것을 방지
@Configuration
public class CacheConfig {

    @Bean
    public Cache<String, String> gptResponseCache() {
        return Caffeine.newBuilder()
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .maximumSize(100)
                .build();
    }
}
