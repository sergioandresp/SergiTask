const fs = require('fs');
const file = 'src/components/Objectives/Sergiplot.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /const payloadMessages = updatedMessages\.map\(\(m, index\) => \{[\s\S]*?return base;\s*\}\);/;
const replaceWith = `const payloadMessages = updatedMessages.map(m => ({
                role: m.role,
                content: m.content || ""
            })).filter(m => m.content !== "");`;

code = code.replace(regex, replaceWith);
fs.writeFileSync(file, code);
console.log("Sergiplot rewritten!");

const apiFile = 'src/app/api/chat/route.ts';
let apiCode = fs.readFileSync(apiFile, 'utf8');

// replace the catch block
const catchRegex = /\} catch \(error: any\) \{[\s\S]*?\}\s*\}\s*$/;
const newCatch = `} catch (error: any) {
        console.error("[CHAT_API_ERROR]:", error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}`;

apiCode = apiCode.replace(catchRegex, newCatch);

// Import NextResponse
if (!apiCode.includes('NextResponse')) {
    apiCode = `import { NextResponse } from 'next/server';\n` + apiCode;
}

fs.writeFileSync(apiFile, apiCode);
console.log("api route rewritten!");
