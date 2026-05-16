export const DoxmaximaDeepL = {
    cleanKey: function(apiKey) {
        if (!apiKey) return '';
        // Sadece standart ASCII karakterleri (harf, rakam, sembol) kabul et, görünmez/bozuk/Türkçe vb. karakterleri sil
        return apiKey.replace(/[^\x20-\x7E]/g, '').trim();
    },

    getBaseUrl: function(apiKey) {
        const key = this.cleanKey(apiKey);
        return key.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com';
    },

    getSupportedLanguages: async function(apiKey) {
        try {
            const cleanApiKey = this.cleanKey(apiKey);
            if (!cleanApiKey) throw new Error("API Anahtarı boş veya geçersiz!");
            
            const baseUrl = this.getBaseUrl(cleanApiKey);
            
            const [sourceRes, targetRes] = await Promise.all([
                fetch(`${baseUrl}/v2/languages?type=source`, {
                    headers: { 'Authorization': `DeepL-Auth-Key ${cleanApiKey}` }
                }),
                fetch(`${baseUrl}/v2/languages?type=target`, {
                    headers: { 'Authorization': `DeepL-Auth-Key ${cleanApiKey}` }
                })
            ]);

            if (!sourceRes.ok || !targetRes.ok) throw new Error("Diller çekilemedi");

            const sourceLangs = await sourceRes.json();
            const targetLangs = await targetRes.json();

            return {
                source: sourceLangs,
                target: targetLangs
            };
        } catch (error) {
            console.error("DeepL Diller Alınamadı:", error);
            throw error;
        }
    },

    translate: async function(texts, apiKey, sourceLang = "auto", targetLang = "TR") {
        try {
            const cleanApiKey = this.cleanKey(apiKey);
            if (!cleanApiKey) throw new Error("API Anahtarı boş veya geçersiz!");

            const baseUrl = this.getBaseUrl(cleanApiKey);
            
            const body = {
                text: texts,
                target_lang: targetLang.toUpperCase()
            };
            
            if (sourceLang !== "auto") {
                body.source_lang = sourceLang.toUpperCase();
            }

            const res = await fetch(`${baseUrl}/v2/translate`, {
                method: 'POST',
                headers: {
                    'Authorization': `DeepL-Auth-Key ${cleanApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`DeepL API Hatası (${res.status}): ${errorData.message || res.statusText || "Çeviri hatası"}`);
            }

            const data = await res.json();
            return data.translations.map(t => t.text);
        } catch (error) {
            console.error("DeepL Çeviri Hatası:", error);
            throw error;
        }
    }
};
