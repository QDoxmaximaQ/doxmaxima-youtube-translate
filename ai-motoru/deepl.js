export class DeepLClient {
    static getBaseUrl(apiKey) {
        // DeepL Free API keys end with ':fx'
        return apiKey.endsWith(':fx') ? 'https://api-free.deepl.com/v2' : 'https://api.deepl.com/v2';
    }

    static async getLanguages(apiKey, type = 'target') {
        if (!apiKey) throw new Error("DeepL API anahtarı gerekli.");
        const url = `${this.getBaseUrl(apiKey)}/languages?type=${type}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `DeepL-Auth-Key ${apiKey}`
                }
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`DeepL API Hatası (${response.status}): ${errText}`);
            }

            const data = await response.json();
            return data.map(l => ({ code: l.language, name: l.name }));
        } catch (error) {
            console.error("[Doxmaxima] DeepL getLanguages error:", error);
            throw error;
        }
    }

    static async translate(texts, apiKey, targetLang = "TR", sourceLang = "auto") {
        if (!apiKey) throw new Error("DeepL API anahtarı gerekli.");
        const url = `${this.getBaseUrl(apiKey)}/translate`;

        const body = {
            text: texts,
            target_lang: targetLang
        };
        
        if (sourceLang && sourceLang !== "auto") {
            body.source_lang = sourceLang;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `DeepL-Auth-Key ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`DeepL Çeviri Hatası (${response.status}): ${errText}`);
            }

            const data = await response.json();
            // Metinleri çevrilmiş olarak geri dön
            return data.translations.map(t => t.text);
        } catch (error) {
            console.error("[Doxmaxima] DeepL translate error:", error);
            throw error;
        }
    }
}
