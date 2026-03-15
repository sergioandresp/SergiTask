const fs = require('fs');
const file = 'src/components/Objectives/Sergiplot.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /\{msg\.toolInvocations\?\.map\(\(toolInvocation: any\) => \{[\s\S]*?\}\)\}/;

if (regex.test(code)) {
    code = code.replace(regex, '');
    fs.writeFileSync(file, code);
    console.log("Removido toolInvocations!");
} else {
    console.log("No se encontró el bloque / ya estaba borrado");
}
