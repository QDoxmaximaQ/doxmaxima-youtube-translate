window.DoxmaximaSubFilter = {
    filterSubtitle: function(cleanVttText) {
        const lines = cleanVttText.split('\n');
        let result = [];
        let index = 1;
        let isHeader = true;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.includes('-->')) {
                // Zaman kodunun yerine sadece [index] yazıyoruz
                result.push(`[${index}]`);
                index++;
                isHeader = false;
            } else {
                // Diğer satırları aynen tutuyoruz (Header ve Metinler)
                result.push(line);
            }
        }
        
        return result.join('\n');
    }
};
