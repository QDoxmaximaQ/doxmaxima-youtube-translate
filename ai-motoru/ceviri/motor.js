export class DoxmaximaTranslator {
    /**
     * Filtrelenmiş metni okur ve belirtilen chunkSize'a göre parçalara böler.
     * @param {string} filteredText - filtreli.txt formatındaki içerik ([1]\nMetin...)
     * @param {number} chunkSize - Her bir parçada bulunacak index sayısı
     * @returns {Array<Array<string>>} Çeviri motoruna gönderilmeye hazır parçalanmış dizi
     */
    static createChunks(filteredText, chunkSize) {
        // Regex: [index]\nText kalıbını eşleştirir
        const regex = /^\[(\d+)\]\s*\n(.*?)(?=\n^\[\d+\]|\n*$)/gms;
        const items = [];
        
        let match;
        while ((match = regex.exec(filteredText)) !== null) {
            items.push(`[${match[1]}]\n${match[2].trim()}`);
        }

        const chunks = [];
        for (let i = 0; i < items.length; i += chunkSize) {
            chunks.push(items.slice(i, i + chunkSize));
        }

        return chunks;
    }

    /**
     * Çevrilmiş metinleri alır ve index numaralarını temizleyerek sıraya koyar.
     * @param {Array<Array<string>>} translatedChunks - Çevrilmiş metinlerin blokları
     * @returns {Array<string>} Temizlenmiş çeviri metinleri
     */
    static rebuildFromChunks(translatedChunks) {
        const flatList = translatedChunks.flat();
        const results = [];
        
        for (let i = 0; i < flatList.length; i++) {
            let txt = flatList[i];
            // Baştaki [id] kısmını temizle
            txt = txt.replace(/^\[\d+\]\s*/, '');
            results.push(txt.trim());
        }
        
        return results;
    }
}
