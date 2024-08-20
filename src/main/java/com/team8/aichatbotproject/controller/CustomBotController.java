package com.team8.aichatbotproject.controller;

import com.github.benmanes.caffeine.cache.Cache;
import com.team8.aichatbotproject.dto.GptRequest;
import com.team8.aichatbotproject.dto.GptResponse;
import org.h2.mvstore.MVMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/bot")
public class CustomBotController {

    @Value("${openai.model}")
    private String model;

    @Value("${openai.api.url}")
    private String apiURL;

    @Autowired
    private RestTemplate template;

    @Autowired
    private Cache<String, String> gptResponseCache;

    @GetMapping("/chat")
    public String chat(@RequestParam(name = "prompt") String prompt) {
        // 캐시에서 응답 확인
        String cachedResponse = gptResponseCache.getIfPresent(prompt);
        if (cachedResponse != null) {
            return cachedResponse;
        }

        // 캐시에 응답이 없으면 API 호출
        GptRequest request = new GptRequest(model, prompt);
        GptResponse gptResponse = template.postForObject(apiURL, request, GptResponse.class);
        String responseContent = gptResponse.getChoices().get(0).getMessage().getContent();

        // 응답을 캐시에 저장
        gptResponseCache.put(prompt, responseContent);

        return responseContent;
    }
}
