const fs = require('fs');

// Generate a sample CSV with 3,000 rows including some intentional errors for testing Week 4 quarantine
const csvLines = ['customer_id,first_name,last_name,email,spend_amount,country,signup_date'];
const countries = ['USA', 'India', 'Germany', 'UK', 'Canada', 'Australia', 'Japan'];

for (let i = 1; i <= 3000; i++) {
    const isError = (i % 60 === 0); // intentional invalid email
    const email = isError ? 'invalid-email-pattern' : `customer${i}@streamweaver.io`;
    const spend = (Math.random() * 2500 + 15).toFixed(2);
    const country = countries[i % countries.length];
    csvLines.push(`${i},Customer_${i},Enterprise,${email},${spend},${country},2026-06-12`);
}

fs.writeFileSync('sample-3000-customers.csv', csvLines.join('\n'));
console.log('Created sample-3000-customers.csv with', csvLines.length, 'records');

// Generate sample JSON array
const jsonRecords = [];
for (let i = 1; i <= 1000; i++) {
    jsonRecords.push({
        order_id: i,
        product: `Product_SKU_${i % 20}`,
        amount: Math.round(Math.random() * 500) + 20,
        status: i % 2 === 0 ? 'DELIVERED' : 'PENDING',
        customer_email: `buyer${i}@company.org`
    });
}
fs.writeFileSync('sample-1000-orders.json', JSON.stringify(jsonRecords, null, 2));
console.log('Created sample-1000-orders.json with', jsonRecords.length, 'records');
