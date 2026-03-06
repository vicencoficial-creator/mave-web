const fs = require('fs');

const original = fs.readFileSync('original.html', 'utf8');
const astro = fs.readFileSync('astro_rendered.html', 'utf8');

function extractTags(html) {
    const matches = html.match(/<[a-zA-Z0-9]+[^>]*>/g) || [];
    return matches.map(m => {
        let tagMatch = m.match(/<([a-zA-Z0-9]+)/);
        let tag = tagMatch ? tagMatch[1].toLowerCase() : '';
        
        // No matchear cierre
        if(m.startsWith('</')) return null;

        let idMatch = m.match(/id=(?:'|")([^'"]+)(?:'|")/);
        let id = idMatch ? '#' + idMatch[1] : '';

        // Simplifica clases (quita clases de astro)
        let classMatch = m.match(/class=(?:'|")([^'"]+)(?:'|")/);
        let cls = '';
        if (classMatch) {
            let classes = classMatch[1].split(' ').filter(c => !c.startsWith('astro-'));
            if (classes.length > 0) {
                cls = '.' + classes.join('.');
            }
        }

        return tag + id + cls;
    }).filter(t => t && !['br', 'meta', 'link', 'style', 'script', 'title', 'html', 'head', 'body', '!doctype'].includes(t.split('#')[0].split('.')[0]));
}

const origTags = extractTags(original);
const astroTags = extractTags(astro);

console.log('Original total relevant tags: ' + origTags.length);
console.log('Astro total relevant tags:    ' + astroTags.length);

console.log('\n--- Comparing Tags ---');
const minLen = Math.min(origTags.length, astroTags.length);
let diffCount = 0;
for(let i = 0; i < minLen; i++) {
    if(origTags[i] !== astroTags[i]) {
        console.log(`Diff at position ${i}:`);
        console.log(`  Orig:  ${origTags[i]}`);
        console.log(`  Astro: ${astroTags[i]}`);
        diffCount++;
        if(diffCount > 10) break;
    }
}

if(origTags.length !== astroTags.length) {
    console.log(`\nLength mismatch! Orig:${origTags.length} vs Astro:${astroTags.length}`);
} else if (diffCount === 0) {
    console.log(`\nPERFECT MATCH: The HTML structure and classes are identical!`);
}
