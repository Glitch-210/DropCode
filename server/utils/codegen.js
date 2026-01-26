/**
 * Generates a random alphanumeric code.
 * Excludes ambiguous characters (0, O, I, L) for better readability if desired, 
 * but for MVP we'll stick to simple alphanumeric.
 */
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed I, 1, 0, O for clarity

function generateCode(length = 5) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    }
    return result;
}

module.exports = { generateCode };
