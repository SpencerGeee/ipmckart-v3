const xlsx = require('xlsx');
const workbook = xlsx.readFile('/var/www/ipmckart/Product Discription.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet).slice(0, 5);
console.log(JSON.stringify(data, null, 2));
