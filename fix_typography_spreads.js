const fs = require('fs');
const path = require('path');

const TARGET_DIRS = [
    path.join(__dirname, 'src', 'components'),
    path.join(__dirname, 'src', 'screens')
];

function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // We want to find cases where `...typography.whatever,` is inside a style block, 
    // and move it to the very first line of that style block.
    // Since doing this with pure regex is extremely hard without AST, we can do a simpler replace:
    // If a block has `...typography.something,` AND `color: something,`, we just strip `color` from typography or something?
    // Actually, a simpler way: just replace `color:\s*([^,]+),\s*\.\.\.typography\.([a-zA-Z0-9_]+),?` with `...typography.$2,\ncolor: $1,`
    
    // Let's replace any order of them within a few lines by just swapping them if `color:` comes before `...typography.`
    content = content.replace(/(color:\s*[^,]+,\s*)\.\.\.typography\.([a-zA-Z0-9_]+),?/g, '...typography.$2,\n    $1');

    // Also fix typos in CustomDatePicker
    content = content.replace(/selectedDayTextcolor/g, 'selectedDayTextColor');
    content = content.replace(/bordercolor/gi, 'borderColor'); // for MascotAvatar

    // Add missing imports in MyDateTimePicker.web.tsx
    if (filePath.includes('MyDateTimePicker.web.tsx')) {
        if (!content.includes('import { colors')) {
            content = "import { colors, typography, spacing, borderRadius } from '../../theme';\n" + content;
        }
    }

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
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

TARGET_DIRS.forEach(processDirectory);
