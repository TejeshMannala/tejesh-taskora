import http from 'http';

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/subjects',
  method: 'GET',
};

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('BODY:', data.substring(0, 200)));
});

req.on('error', e => console.error(`ERROR: ${e.message}`));
req.end();
