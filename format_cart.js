const fs = require('fs');
const content = fs.readFileSync('cart-manager.js', 'utf8');
// Simple formatting: add newlines after ; { }
const formatted = content
  .replace(/;/g, ';\n')
  .replace(/{/g, '{\n')
  .replace(/}/g, '}\n')
  .replace(/,/g, ', ');
console.log(formatted);
