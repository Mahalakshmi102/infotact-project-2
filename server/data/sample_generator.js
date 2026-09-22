const fs = require('fs');
const path = require('path');

const samplesDir = path.join(__dirname, 'samples');
if (!fs.existsSync(samplesDir)) {
  fs.mkdirSync(samplesDir, { recursive: true });
}

function generateCsv(filePath, targetRows, label) {
  return new Promise((resolve, reject) => {
    console.log(`[Generator] Generating ${label} dataset (${targetRows.toLocaleString()} rows) -> ${filePath}`);
    const writeStream = fs.createWriteStream(filePath, { encoding: 'utf8' });

    // CSV Header
    writeStream.write('id,first_name,last_name,email,gender,ip_address,transaction_amount,status,timestamp\n');

    const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'Chris', 'Jessica', 'Hari', 'Alex'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor'];
    const genders = ['Male', 'Female', 'Non-Binary', 'Other'];
    const statuses = ['COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'];

    let i = 1;

    function write() {
      let ok = true;
      do {
        const id = i;
        const fn = firstNames[i % firstNames.length];
        const ln = lastNames[(i * 3) % lastNames.length];
        const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`;
        const gender = genders[i % genders.length];
        const ip = `192.168.${i % 255}.${(i * 7) % 255}`;
        const amount = (Math.random() * 1000).toFixed(2);
        const status = statuses[i % statuses.length];
        const timestamp = new Date(Date.now() - (targetRows - i) * 60000).toISOString();

        const row = `${id},${fn},${ln},${email},${gender},${ip},${amount},${status},${timestamp}\n`;

        if (i === targetRows) {
          writeStream.write(row);
          writeStream.end();
          break;
        } else {
          // See if we should continue, or wait for drain
          ok = writeStream.write(row);
        }
        i++;
      } while (i <= targetRows && ok);

      if (i <= targetRows) {
        // Had to stop early! Write some more once it drains
        writeStream.once('drain', write);
      }
    }

    writeStream.on('finish', () => {
      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`[Generator] Finished ${label}: ${targetRows.toLocaleString()} rows (${sizeMB} MB)`);
      resolve(filePath);
    });

    writeStream.on('error', reject);

    write();
  });
}

async function main() {
  console.log('--- Generating Day 4 Sample Datasets ---');
  // Small: 100 rows
  await generateCsv(path.join(samplesDir, 'small.csv'), 100, 'small.csv');

  // Medium: 10,000 rows
  await generateCsv(path.join(samplesDir, 'medium.csv'), 10000, 'medium.csv');

  // Large: 100,000 rows
  await generateCsv(path.join(samplesDir, 'large.csv'), 100000, 'large.csv');

  console.log('--- All sample datasets generated successfully! ---');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateCsv };
