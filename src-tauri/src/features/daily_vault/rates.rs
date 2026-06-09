use crate::features::daily_vault::ExchangeRatesSummary;

fn parse_tcmb_rate(xml: &str, kod: &str, rate_tag: &str) -> Option<f64> {
    let search_str = format!("Kod=\"{}\"", kod);
    let currency_start = xml.find(&search_str)?;
    
    let currency_block = &xml[currency_start..];
    let currency_end = currency_block.find("</Currency>")?;
    let block = &currency_block[..currency_end];
    
    let start_tag = format!("<{}>", rate_tag);
    let end_tag = format!("</{}>", rate_tag);
    let start_idx = block.find(&start_tag)? + start_tag.len();
    let end_idx = block[start_idx..].find(&end_tag)?;
    let val_str = &block[start_idx..start_idx + end_idx];
    
    val_str.trim().parse::<f64>().ok()
}

fn parse_f64_from_val(val: Option<&serde_json::Value>) -> Option<f64> {
    let val = val?;
    if let Some(n) = val.as_f64() {
        return Some(n);
    }
    if let Some(s) = val.as_str() {
        return s.trim().parse::<f64>().ok();
    }
    None
}

pub async fn fetch_tcmb_rates(last_gold: f64) -> Result<ExchangeRatesSummary, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| format!("HTTP Client başlatılamadı: {}", e))?;

    let response = client
        .get("https://www.tcmb.gov.tr/kurlar/today.xml")
        .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .send()
        .await
        .map_err(|e| format!("TCMB kurları çekilemedi: {}", e))?;

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("TCMB yanıtı okunamadı: {}", e))?;

    let xml = String::from_utf8_lossy(&bytes);

    let usd_buy = parse_tcmb_rate(&xml, "USD", "ForexBuying")
        .ok_or_else(|| "TCMB USD Alış kuru bulunamadı".to_string())?;
    let usd_sell = parse_tcmb_rate(&xml, "USD", "ForexSelling")
        .ok_or_else(|| "TCMB USD Satış kuru bulunamadı".to_string())?;
    let eur_buy = parse_tcmb_rate(&xml, "EUR", "ForexBuying")
        .ok_or_else(|| "TCMB EUR Alış kuru bulunamadı".to_string())?;
    let eur_sell = parse_tcmb_rate(&xml, "EUR", "ForexSelling")
        .ok_or_else(|| "TCMB EUR Satış kuru bulunamadı".to_string())?;

    Ok(ExchangeRatesSummary {
        usd_buy,
        usd_sell,
        eur_buy,
        eur_sell,
        gold_buy: last_gold,
        gold_sell: last_gold,
    })
}

pub async fn fetch_altin_api_rates(api_key: &str) -> Result<ExchangeRatesSummary, String> {
    if api_key.trim().is_empty() {
        return Err("AltınAPI için API Key girmelisiniz.".to_string());
    }

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| format!("HTTP Client başlatılamadı: {}", e))?;

    let response = client
        .get("https://api.altinapi.com/v1/latest")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .send()
        .await
        .map_err(|e| format!("AltınAPI bağlantı hatası: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("AltınAPI hatası (HTTP {}): API Key geçersiz veya süresi dolmuş olabilir.", response.status().as_u16()));
    }

    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("AltınAPI yanıtı JSON olarak çözümlenemedi: {}", e))?;

    let data = json.get("data").ok_or_else(|| "AltınAPI yanıtında 'data' alanı bulunamadı".to_string())?;

    let mut usd_buy = 0.0;
    let mut usd_sell = 0.0;
    let mut eur_buy = 0.0;
    let mut eur_sell = 0.0;
    let mut gold_buy = 0.0;
    let mut gold_sell = 0.0;

    if let Some(arr) = data.as_array() {
        for item in arr {
            if let Some(code) = item.get("code").and_then(|v| v.as_str()) {
                let buy = parse_f64_from_val(item.get("buying")).unwrap_or(0.0);
                let sell = parse_f64_from_val(item.get("selling")).unwrap_or(0.0);
                match code {
                    "USD" => { usd_buy = buy; usd_sell = sell; }
                    "EUR" => { eur_buy = buy; eur_sell = sell; }
                    "GA" | "gram-altin" | "has-altin" => { gold_buy = buy; gold_sell = sell; }
                    _ => {}
                }
            }
        }
    } else if let Some(obj) = data.as_object() {
        for (code, val) in obj {
            let buy = parse_f64_from_val(val.get("buying")).unwrap_or(0.0);
            let sell = parse_f64_from_val(val.get("selling")).unwrap_or(0.0);
            match code.as_str() {
                "USD" => { usd_buy = buy; usd_sell = sell; }
                "EUR" => { eur_buy = buy; eur_sell = sell; }
                "GA" | "gram-altin" | "has-altin" => { gold_buy = buy; gold_sell = sell; }
                _ => {}
            }
        }
    }

    if usd_buy <= 0.0 || eur_buy <= 0.0 || gold_buy <= 0.0 {
        if let Some(obj) = data.as_object() {
            for (code, val) in obj {
                let buy = parse_f64_from_val(val.get("buying")).unwrap_or(0.0);
                let sell = parse_f64_from_val(val.get("selling")).unwrap_or(0.0);
                match code.as_str() {
                    "USDTRY" => { usd_buy = buy; usd_sell = sell; }
                    "EURTRY" => { eur_buy = buy; eur_sell = sell; }
                    "GA" | "gram-altin" | "ALTIN" => { gold_buy = buy; gold_sell = sell; }
                    _ => {}
                }
            }
        }
    }

    if usd_buy <= 0.0 || eur_buy <= 0.0 || gold_buy <= 0.0 {
        return Err("AltınAPI'den çekilen kurlar geçerli bulunamadı. Lütfen API sağlayıcınızı kontrol edin.".to_string());
    }

    Ok(ExchangeRatesSummary {
        usd_buy,
        usd_sell,
        eur_buy,
        eur_sell,
        gold_buy,
        gold_sell,
    })
}

pub async fn fetch_genel_para_rates(api_key: &str) -> Result<ExchangeRatesSummary, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| format!("HTTP Client başlatılamadı: {}", e))?;

    let url = if api_key.trim().is_empty() {
        "https://api.genelpara.com/json/".to_string()
    } else {
        format!("https://api.genelpara.com/json/?key={}", api_key)
    };

    let response = client
        .get(&url)
        .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .send()
        .await
        .map_err(|e| format!("GenelPara bağlantı hatası: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("GenelPara hatası (HTTP {}).", response.status().as_u16()));
    }

    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("GenelPara kurları çözümlenemedi (IP adresiniz engellenmiş olabilir): {}", e))?;

    let usd_buy = parse_f64_from_val(json.get("USD").and_then(|v| v.get("alis")))
        .ok_or_else(|| "GenelPara USD Alış bulunamadı".to_string())?;
    let usd_sell = parse_f64_from_val(json.get("USD").and_then(|v| v.get("satis")))
        .ok_or_else(|| "GenelPara USD Satış bulunamadı".to_string())?;
    let eur_buy = parse_f64_from_val(json.get("EUR").and_then(|v| v.get("alis")))
        .ok_or_else(|| "GenelPara EUR Alış bulunamadı".to_string())?;
    let eur_sell = parse_f64_from_val(json.get("EUR").and_then(|v| v.get("satis")))
        .ok_or_else(|| "GenelPara EUR Satış bulunamadı".to_string())?;
    
    let gold_buy = parse_f64_from_val(json.get("GA").and_then(|v| v.get("alis")))
        .or_else(|| parse_f64_from_val(json.get("ALTIN").and_then(|v| v.get("alis"))))
        .ok_or_else(|| "GenelPara Altın Alış bulunamadı".to_string())?;
    let gold_sell = parse_f64_from_val(json.get("GA").and_then(|v| v.get("satis")))
        .or_else(|| parse_f64_from_val(json.get("ALTIN").and_then(|v| v.get("satis"))))
        .ok_or_else(|| "GenelPara Altın Satış bulunamadı".to_string())?;

    Ok(ExchangeRatesSummary {
        usd_buy,
        usd_sell,
        eur_buy,
        eur_sell,
        gold_buy,
        gold_sell,
    })
}
