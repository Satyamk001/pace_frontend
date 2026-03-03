const fs = require('fs');
const path = require('path');

const TARGET_DIRS = [
    path.join(__dirname, 'src', 'components'),
    path.join(__dirname, 'src', 'screens')
];

const EXTENSIONS = ['.tsx', '.ts'];

const SPACING_MAP = {
    '4': 'spacing.xs',
    '8': 'spacing.sm',
    '10': 'spacing.sm', // Approximating 10 to sm
    '12': 'spacing.s',
    '14': 'spacing.md', // Approximating 14 to md
    '15': 'spacing.m',  // Approximating 15 to m
    '16': 'spacing.m',
    '20': 'spacing.lg',
    '24': 'spacing.l',
    '30': 'spacing.xl', // Approximating 30 to xl
    '32': 'spacing.xl',
    '40': 'spacing.xxl', // Approximating 40
    '48': 'spacing.xxl',
};

const RADII_MAP = {
    '4': 'borderRadius.s', // Approximating
    '5': 'borderRadius.s', // Approximating
    '6': 'borderRadius.s', // Approximating
    '8': 'borderRadius.s',
    '10': 'borderRadius.m', // Approximating
    '12': 'borderRadius.m',
    '14': 'borderRadius.md', // Approximating
    '15': 'borderRadius.md', // Approximating
    '16': 'borderRadius.md',
    '20': 'borderRadius.l', // Approximating
    '24': 'borderRadius.l',
    '25': 'borderRadius.l', // Approximating
    '30': 'borderRadius.lg', // Approximating
    '32': 'borderRadius.lg',
    '40': 'borderRadius.xl',
    '50': 'borderRadius.round', // Huge radius is likely round
    '100': 'borderRadius.round', 
    '999': 'borderRadius.round', 
    "'50%'": 'borderRadius.round'
};

const FONT_SIZE_MAP = {
    '10': '...typography.caption',
    '11': '...typography.caption',
    '12': '...typography.caption',
    '13': '...typography.caption',
    '14': '...typography.body',
    '15': '...typography.body',
    '16': '...typography.body', // default body
    '18': '...typography.subheader',
    '20': '...typography.h3',
    '22': '...typography.header',
    '24': '...typography.h2',
    '26': '...typography.h2',
    '28': '...typography.h1', // approx
    '30': '...typography.h1', // approx
    '32': '...typography.h1',
    '34': '...typography.h1',
};


function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // --- 1. PRE-REQUISITE IMPORTS ---
    // Ensure 'theme' imports contain the required tokens
    const themeImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"](?:\.\.\/)*theme['"];?/g;
    let hasThemeImport = false;
    
    content = content.replace(themeImportRegex, (match, importsStr) => {
        hasThemeImport = true;
        let tokens = importsStr.split(',').map(s => s.trim()).filter(s => s);
        
        // Remove shadows from imports
        tokens = tokens.filter(t => t !== 'shadows');
        
        // Add missing standard tokens
        const required = ['colors', 'typography', 'spacing', 'borderRadius'];
        required.forEach(req => {
            if (!tokens.includes(req)) tokens.push(req);
        });
        
        return match.replace(importsStr, tokens.join(', '));
    });

    // If no theme import, but we match style usages later, we should ideally inject it, 
    // but for safety in an automated script, we might just assume it's there or skip. 
    // We'll trust the manual pass for missing imports if TS complains.

    // --- 1. SHADOW REMOVAL ---
    content = content.replace(/^\s*\.\.\.shadows\.[a-zA-Z0-9_]+,?\s*$/gm, '');
    content = content.replace(/^\s*shadowColor:\s*[^,]+,?\s*$/gm, '');
    content = content.replace(/^\s*shadowOffset:\s*\{[^}]+\},?\s*$/gm, '');
    content = content.replace(/^\s*shadowOpacity:\s*[0-9.]+,?\s*$/gm, '');
    content = content.replace(/^\s*shadowRadius:\s*[0-9.]+,?\s*$/gm, '');
    content = content.replace(/^\s*elevation:\s*[0-9.]+,?\s*$/gm, '');
    
    // Inline shadows in flex properties (e.g. shadowOpacity: 0)
    content = content.replace(/,\s*elevation:\s*\d+/g, '');
    content = content.replace(/,\s*shadowOpacity:\s*\d+/g, '');
    
    // Remove "shadows" from code completely
    content = content.replace(/shadows\.[a-zA-Z]+/g, "{} /* removed shadow */");

    // --- 2. SPACING MAPPING ---
    const spacingProps = [
        'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical',
        'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'paddingHorizontal', 'paddingVertical',
        'gap', 'rowGap', 'columnGap'
    ];
    
    spacingProps.forEach(prop => {
        // Regex to match "prop: number," or "prop: number"
        const regex = new RegExp(`^(\\s*${prop}:\\s*)(\\d+)(,?)\\s*$`, 'gm');
        content = content.replace(regex, (match, prefix, numStr, comma) => {
            if (SPACING_MAP[numStr]) {
                return `${prefix}${SPACING_MAP[numStr]}${comma}`;
            }
            return match; // Leave unmapped numbers alone for manual review
        });
    });

    // --- 3. RADII MAPPING ---
    content = content.replace(/^(\s*borderRadius:\s*)(\d+|'50%')(,?)\s*$/gm, (match, prefix, numStr, comma) => {
        if (RADII_MAP[numStr]) {
            return `${prefix}${RADII_MAP[numStr]}${comma}`;
        }
        return match;
    });

    // --- 4. TYPOGRAPHY (FONT SIZE) MAPPING ---
    // Note: this approach replaces fontSize with a typography spread. 
    // Since spread syntax requires an object, we just inject it and remove the old fontSize/fontWeight.
    content = content.replace(/^(\s*)fontSize:\s*(\d+),?\s*$/gm, (match, prefix, numStr) => {
        if (FONT_SIZE_MAP[numStr]) {
            return `${prefix}${FONT_SIZE_MAP[numStr]},`;
        }
        return match;
    });
    
    // Strip random fontWeights as they should be covered by typography now
    content = content.replace(/^\s*fontWeight:\s*['"][a-zA-Z0-9]+['"],?\s*$/gm, '');

    // --- 5. COLORS ---
    // Replace hardcoded hex colors with semantic tokens where obvious.
    // Extremely hard to do perfectly via Regex. 
    // We will do some specific replacements:
    content = content.replace(/backgroundColor:\s*['"]#fff(?:fff)?['"]/gi, "backgroundColor: colors.surface");
    content = content.replace(/backgroundColor:\s*['"]#f0f0f0['"]/gi, "backgroundColor: colors.surfaceSoft");
    content = content.replace(/color:\s*['"]#fff(?:fff)?['"]/gi, "color: '#FFF'"); // Button text usually okay
    content = content.replace(/color:\s*['"]#666(?:666)?['"]/gi, "color: colors.textSecondary");
    content = content.replace(/color:\s*['"]#333(?:333)?['"]/gi, "color: colors.textPrimary");
    content = content.replace(/borderColor:\s*['"]#ccc['"]/gi, "borderColor: colors.border");
    content = content.replace(/borderColor:\s*['"]#eee['"]/gi, "borderColor: colors.border");
    content = content.replace(/borderColor:\s*['"]#ddd['"]/gi, "borderColor: colors.border");


    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function processDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (EXTENSIONS.includes(path.extname(fullPath))) {
            processFile(fullPath);
        }
    }
}

TARGET_DIRS.forEach(processDirectory);
console.log('Refactoring script complete.');
