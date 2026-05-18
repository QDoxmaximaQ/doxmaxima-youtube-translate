import { DoxmaximaDeepL } from '../deepl.js';

let engineCache = {
    videoId: null,
    targetLang: null,
    translatedText: null
};

export const DoxmaximaEngine = {
    // Paketlere (Chunk) Ayırma
    chunkArray: function(array, size) {
        const result = [];
        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }
        return result;
    },

    parseFilteredText: function(filteredText) {
        const regex = /\[(\d+)\]\s*([\s\S]*?)(?=\s*\[\d+\]|$)/g;
        let match;
        const payload = [];
        while ((match = regex.exec(filteredText)) !== null) {
            const index = parseInt(match[1]);
            const text = match[2].trim();
            payload.push({ index, text, originalText: text });
        }
        return payload;
    },

    translateProcess: async function(filteredText, apiKey, sourceLang = "auto", targetLang = "TR", chunkSize = 50, videoId = null) {
        if (videoId && engineCache.videoId === videoId && engineCache.targetLang === targetLang && engineCache.translatedText) {
            console.log("%c[Doxmaxima] Hedef dil ve video değişmemiş. Çeviri MOTOR ÖNBELLEĞİNDEN (cache) kullanılıyor!", "color: #10b981; font-weight: bold;");
            return engineCache.translatedText;
        }

        const payload = this.parseFilteredText(filteredText);
        const chunks = this.chunkArray(payload, chunkSize);
        
        let finalTranslations = {};

        console.log(`%c[Doxmaxima] Toplam ${payload.length} tane altyazı bloğu bulundu.`, 'color: #eab308; font-weight: bold; font-size: 12px;');
        console.log('%c[ÇEVİRİ BAŞLIYOR] Toplam paket sayısı: ' + chunks.length, 'color: magenta; font-weight: bold;');

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            
            // DeepL'e gönderilecek format: "[1]\ntext"
            const textsToTranslate = chunk.map(item => `[${item.index}]\n${item.text}`);
            
            console.groupCollapsed(`%c[DeepL GİDEN SAF VERİ - Paket ${i+1}/${chunks.length}]`, 'color: green; font-weight: bold;');
            textsToTranslate.forEach(t => console.log(`%c${t.replace(/\n/g, ' ')}`, 'color: green;'));
            console.groupEnd();
            
            try {
                const translatedTexts = await DoxmaximaDeepL.translate(textsToTranslate, apiKey, sourceLang, targetLang);
                
                console.groupCollapsed(`%c[DeepL GELEN SAF YANIT - Paket ${i+1}/${chunks.length}]`, 'color: blue; font-weight: bold;');
                translatedTexts.forEach(t => console.log(`%c${t.replace(/\n/g, ' ')}`, 'color: blue;'));
                console.groupEnd();

                // Test Aşaması (Index kontrolü)
                chunk.forEach((item, idx) => {
                    let translated = translatedTexts[idx];
                    let cleanTranslated = translated.replace(/^\[\d+\]\s*/, '').trim();
                    
                    const indexMatch = translated.match(/^\[(\d+)\]/);
                    let returnedIndex = indexMatch ? parseInt(indexMatch[1]) : item.index;

                    if (returnedIndex !== item.index || !cleanTranslated) {
                        console.warn(`%c[UYARI] İndex veya çeviri eşleşmedi! Orijinal: ${item.index}, Dönen: ${returnedIndex}`, 'color: orange;');
                        cleanTranslated = item.originalText;
                    }
                    
                    finalTranslations[item.index] = cleanTranslated;
                });
                
            } catch (error) {
                if (error.message === "QUOTA_EXCEEDED") {
                    // Kota doldu — kalan tüm paketler için orijinalleri doldur ve döngüyü kır
                    for (let j = i; j < chunks.length; j++) {
                        chunks[j].forEach(item => {
                            finalTranslations[item.index] = item.originalText;
                        });
                    }
                    break; // Daha fazla istek gönderme
                } else {
                    console.error(`%c[HATA] Paket ${i+1} çevrilemedi, orijinaller kullanılıyor.`, 'color: red;', error);
                    chunk.forEach(item => {
                        finalTranslations[item.index] = item.originalText;
                    });
                }
            }
        }
        
        let translatedTextBuilder = [];
        for (const [idx, text] of Object.entries(finalTranslations)) {
            translatedTextBuilder.push(`[${idx}]\n${text}`);
        }
        
        const finalResult = translatedTextBuilder.join('\n');
        
        // Başarılı çeviriyi cache'e kaydet
        if (videoId) {
            engineCache.videoId = videoId;
            engineCache.targetLang = targetLang;
            engineCache.translatedText = finalResult;
        }
        
        return finalResult;
    }
};
