const fs = require('fs');
const https = require('https');
const vm = require('vm');

const aesCode = fs.readFileSync('d:/kaam/pm-zaika/aes.js', 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(aesCode, context);
const slowAES = context.slowAES;

function toNumbers(d){
  var e=[];
  d.replace(/(..)/g, function(d){e.push(parseInt(d,16));});
  return e;
}

function toHex(){
  var d = 1 == arguments.length && arguments[0].constructor == Array ? arguments[0] : arguments;
  var e = '';
  for(var f=0; f<d.length; f++) e += (16>d[f] ? '0' : '') + d[f].toString(16);
  return e.toLowerCase();
}

function getCookie(challengeHtml) {
  const scriptMatch = challengeHtml.match(/<script>(?:function toNumbers.*?location\.href.*?);?<\/script>/s);
  if (!scriptMatch) return null;
  const scriptContent = scriptMatch[0].replace(/<script>|<\/script>/g, '');
  const sandbox = {
    document: {},
    location: {}
  };
  vm.createContext(sandbox);
  vm.runInContext(aesCode, sandbox);
  vm.runInContext(scriptContent, sandbox);
  return sandbox.document.cookie ? sandbox.document.cookie.split(';')[0] : null;
}

function fetchUrl(url, cookie = '') {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': cookie,
        'Referer': 'https://pmzaikarestaurant.wuaze.com/'
      }
    };
    https.get(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data: Buffer.concat(chunks) }));
    }).on('error', reject);
  });
}

async function run() {
  const initial = await fetchUrl('https://pmzaikarestaurant.wuaze.com/?i=3');
  const cookie = getCookie(initial.data.toString());
  console.log('Obtained cookie:', cookie);

  const allImgs = JSON.parse(fs.readFileSync('d:/kaam/pm-zaika/all_imgs.json', 'utf8'));
  console.log(`Starting download of ${allImgs.length} images...`);

  for (let i = 0; i < allImgs.length; i++) {
    const url = allImgs[i];
    const filename = url.split('/').pop().split('?')[0];
    const dest = 'd:/kaam/pm-zaika/assets/images/' + filename;
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      continue;
    }
    try {
      const res = await fetchUrl(url, cookie);
      const preview = res.data.slice(0, 15).toString();
      if (!preview.includes('<html') && !preview.includes('<!DOC') && res.data.length > 500) {
        fs.writeFileSync(dest, res.data);
        console.log(`[${i+1}/${allImgs.length}] Saved: ${filename} (${res.data.length} bytes)`);
      } else {
        console.log(`[${i+1}/${allImgs.length}] Skipped/Failed: ${filename} (size: ${res.data.length})`);
      }
    } catch (err) {
      console.error(`Error downloading ${url}:`, err.message);
    }
  }

  // Also fetch subpages HTML
  const pages = ['foods', 'reservation', 'contact-us', 'about-us', 'gallery', 'cart'];
  for (const p of pages) {
    const res = await fetchUrl(`https://pmzaikarestaurant.wuaze.com/${p}/`, cookie);
    fs.writeFileSync(`d:/kaam/pm-zaika/${p}.html`, res.data);
    console.log(`Saved page: ${p}.html, size: ${res.data.length}`);
  }
}
run().catch(console.error);
