/**
 * Korean Josa (Postposition) Helper Utility
 * Automatically attaches the grammatically correct particle based on final consonant (batchim).
 * Eliminates awkward parentheses like "상자을(를)", "책상(으)로".
 */
const KoreanJosa = {
    /**
     * Checks if the character has a final consonant (jongseong / batchim)
     */
    hasBatchim(str) {
        if (!str || typeof str !== 'string') return false;
        // Trim trailing spaces and special chars
        const clean = str.trim().replace(/[^가-힣a-zA-Z0-9]/g, '');
        if (!clean) return false;

        const lastChar = clean.charAt(clean.length - 1);
        const code = lastChar.charCodeAt(0);

        // Korean syllable unicode block: 0xAC00 ~ 0xD7A3
        if (code < 0xAC00 || code > 0xD7A3) {
            // For numbers or English alphabets
            const last = lastChar.toLowerCase();
            if ('lmnr136780'.includes(last)) return true;
            return false;
        }

        const jongseongIndex = (code - 0xAC00) % 28;
        return {
            has: jongseongIndex > 0,
            isRieul: jongseongIndex === 8 // 'ㄹ' batchim
        };
    },

    /**
     * Appends the appropriate particle to the word
     * @param {string} word - Target word (e.g., '상자', '책상', '곰인형')
     * @param {string} type - Particle type ('을/를', '이/가', '은/는', '으로/로', '과/와')
     */
    append(word, type) {
        if (!word) return '';
        const info = this.hasBatchim(word);
        const has = typeof info === 'object' ? info.has : !!info;
        const isRieul = typeof info === 'object' ? info.isRieul : false;

        switch (type) {
            case '을/를':
            case '을':
            case '를':
                return word + (has ? '을' : '를');

            case '이/가':
            case '이':
            case '가':
                return word + (has ? '이' : '가');

            case '은/는':
            case '은':
            case '는':
                return word + (has ? '은' : '는');

            case '으로/로':
            case '으로':
            case '로':
                // Special case for 'ㄹ' batchim (e.g. '교실' -> '교실로', '거실' -> '거실로')
                if (isRieul) {
                    return word + '로';
                }
                return word + (has ? '으로' : '로');

            case '과/와':
            case '과':
            case '와':
                return word + (has ? '과' : '와');

            case '아/야':
                return word + (has ? '아' : '야');

            default:
                return word;
        }
    }
};

window.KoreanJosa = KoreanJosa;
// Global shorthand
window.josa = (word, type) => KoreanJosa.append(word, type);
