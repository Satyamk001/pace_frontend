const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'src', 'screens');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // A bit hacky but we target the `footer: { ... }` block exactly or just target known patterns
    // Often it looks like:
    // footer: {
    //     padding: spacing.l,
    //     backgroundColor: colors.background,
    // },
    // I specify the expected borderTop properties.
    if (content.includes('footer: {')) {
        // Regex to replace contents of `footer: { ... }` with the mandatory styles.
        // We'll just replace the `footer: {` and its inner `padding` / `backgroundColor` lines.
        content = content.replace(/footer:\s*\{\s*padding:\s*spacing\.l,\s*backgroundColor:\s*colors\.background,?\s*\}/g, `footer: {
        paddingHorizontal: spacing.l,
        paddingTop: spacing.m,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    }`);
    }

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated footer in: ${filePath}`);
    }
}

const files = fs.readdirSync(DIR);
for (const file of files) {
    if (file.endsWith('.tsx')) {
        processFile(path.join(DIR, file));
    }
}
