window.DoxmaximaSubRebuild = {
    rebuildSubtitle: function(originalVtt, translatedText) {
        // originalVtt: Orijinal zaman kodlarını içeren altyazı
        // translatedText: [1]\nÇeviri1\n[2]\nÇeviri2
        
        const origLines = originalVtt.split('\n');
        const translatedDict = {};
        
        // translatedText'i parse edelim
        const regex = /\[(\d+)\]\s*([\s\S]*?)(?=\s*\[\d+\]|$)/g;
        let match;
        while ((match = regex.exec(translatedText)) !== null) {
            const index = parseInt(match[1]);
            const text = match[2].trim();
            translatedDict[index] = text;
        }

        let result = [];
        let index = 1;
        
        for (let i = 0; i < origLines.length; i++) {
            const line = origLines[i];
            
            if (line.includes('-->')) {
                result.push(line);
                const translated = translatedDict[index] || "";
                
                if (translated) {
                    result.push(translated);
                    result.push(""); // boşluk
                }
                
                // Orijinaldeki bu bloğun metin satırlarını atla
                while(i + 1 < origLines.length && origLines[i+1].trim() !== "" && !origLines[i+1].includes('-->')) {
                    i++;
                }
                index++;
            } else {
                if (index === 1) {
                    result.push(line);
                }
            }
        }
        
        return result.join('\n');
    }
};
