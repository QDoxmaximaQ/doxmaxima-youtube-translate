import { DoxmaximaEngine } from './ai-motoru/ceviri/motor.js';

console.log("%c[Doxmaxima] Service Worker Başladı!", "color: #10b981; font-size: 14px; font-weight: bold;");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Content script'ten gelen çeviri isteği
    if (request.type === "START_TRANSLATE") {
        console.log("%c[Doxmaxima] Çeviri isteği alındı. İşlem Başlıyor...", "color: #eab308; font-weight: bold;");
        
        // Çeviri işlemini arka planda asenkron olarak yürütüyoruz
        DoxmaximaEngine.translateProcess(
            request.filteredText, 
            request.apiKey, 
            request.sourceLang, 
            request.targetLang, 
            request.chunkSize,
            request.videoId
        )
        .then(resultText => {
            console.log("%c[Doxmaxima] Tüm çeviri paketleri başarıyla tamamlandı!", "color: #10b981; font-weight: bold;");
            sendResponse({ success: true, translatedText: resultText });
        })
        .catch(err => {
            console.error("%c[Doxmaxima] Çeviri sırasında kritik hata:", "color: #ef4444; font-weight: bold;", err);
            sendResponse({ success: false, error: err.message });
        });
        
        // Asenkron sendResponse çalıştırabilmek için 'true' döndürmek şarttır.
        return true;
    }
});
