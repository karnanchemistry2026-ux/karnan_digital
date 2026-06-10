const fs = require('fs');

// 1. Read chapters
const chaptersText = fs.readFileSync('c:\\\\Users\\\\RAKESH\\\\Desktop\\\\karnan_digital\\\\js\\\\data\\\\chapters.js', 'utf8');
const chapterLines = chaptersText.split('\n');
const chapters = [];
let inChapters = false;
chapterLines.forEach(line => {
    if (line.includes('export const CHAPTERS = [')) inChapters = true;
    if (inChapters && line.includes('{ id:')) {
        const match = line.match(/{ id: '([^']+)', name: '([^']+)',\s*subject: '([^']+)',\s*class: (11|12) }/);
        if (match) {
            chapters.push({ id: match[1], name: match[2], subject: match[3], class: parseInt(match[4], 10) });
        }
    }
});

console.log('Parsed chapters:', chapters.length);

// 2. Read existing questions
let content = fs.readFileSync('c:\\\\Users\\\\RAKESH\\\\Desktop\\\\karnan_digital\\\\js\\\\data\\\\questions.js', 'utf8');
content = content.replace(/\];\s*$/, ''); // remove end bracket

const questions = [];

chapters.forEach(ch => {
    // Generate 3 questions per chapter
    for(let i=0; i<3; i++) {
        const isPro = i === 2; // 3rd question is pro
        questions.push({
            id: `${ch.id}_gen${i+1}`,
            subject: ch.subject,
            chapter: ch.name,
            class: ch.class,
            text: `Sample question ${i+1} for ${ch.name} (${ch.subject} Class ${ch.class}). What is the correct answer?`,
            options: [
                `Option A for ${ch.name}`,
                `Option B for ${ch.name}`,
                `Option C for ${ch.name}`,
                `Option D for ${ch.name}`
            ],
            correct: Math.floor(Math.random() * 4),
            explanation: `This is the explanation for question ${i+1} of ${ch.name}. It helps you understand the core concepts.`,
            ncertRef: `NCERT Page ${Math.floor(Math.random() * 200) + 10}`,
            isPro: isPro
        });
    }
});

questions.forEach(q => {
    content += '  ' + JSON.stringify(q) + ',\n';
});
content += '];\n';

fs.writeFileSync('c:\\\\Users\\\\RAKESH\\\\Desktop\\\\karnan_digital\\\\js\\\\data\\\\questions.js', content);
console.log('Appended generated questions.');
