const fs = require('fs');
const path = require('path');
const https = require('https');

const inputPath = 'C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\368d58b5-fb76-4fe8-86ce-5732351ecfc4\\.system_generated\\steps\\28\\output.txt';
const outputDir = 'C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\368d58b5-fb76-4fe8-86ce-5732351ecfc4\\scratch';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, function(response) {
      response.pipe(file);
      file.on('finish', function() {
        file.close(resolve);
      });
    }).on('error', function(err) {
      fs.unlink(dest, () => reject(err));
    });
  });
};

async function main() {
  for (const screen of data.screens) {
    if (screen.htmlCode && screen.htmlCode.downloadUrl) {
      const filename = screen.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.html';
      const destPath = path.join(outputDir, filename);
      console.log(`Downloading ${screen.title} to ${destPath}...`);
      await download(screen.htmlCode.downloadUrl, destPath);
      console.log(`Downloaded ${screen.title}`);
    }
  }
}

main().catch(console.error);
