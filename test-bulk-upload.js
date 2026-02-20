const fs = require('fs');
const FormData = require('form-data');
const http = require('http');

// Read the Excel file
const fileContent = fs.readFileSync('complete_product_mapping.xlsx');

// Create form data
const form = new FormData();
form.append('file', fileContent, {
  filename: 'complete_product_mapping.xlsx',
  contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
});

// Send the request
const options = {
  method: 'POST',
  host: 'localhost',
  port: 4040,
  path: '/api/admin/bulk-price-update/preview',
  headers: form.getHeaders()
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    console.log('Response Body:', data.substring(0, 1000));
  });
});

form.pipe(req);

req.on('error', (e) => {
  console.error('Request Error:', e);
});
