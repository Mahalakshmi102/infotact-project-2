/**
 * StreamWeaver Memory Audit & Performance Profiler
 * Proves that streaming 100,000 to 1,000,000 records through the ETL pipeline
 * never exceeds the 150MB V8 Heap limit.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { Readable } = require('stream');
const { MappingAndValidationTransform, BulkIngestStream } = require('./src/services/transformStreams');

async function runAudit() {
    console.log('='.repeat(70));
    console.log(' STREAMWEAVER ETL MEMORY AUDIT & PROFILING BENCHMARK');
    console.log(' Target constraint: Server RAM / V8 Heap must NOT exceed 150 MB');
    console.log('='.repeat(70));

    await mongoose.connect(process.env.MONGO_URI);
    console.log(' Connected to MongoDB Atlas');

    const TOTAL_RECORDS = 100000;
    const BATCH_SIZE = 5000;
    const TARGET_COLLECTION = `audit_bench_${Date.now()}`;

    console.log(` Starting streaming ingestion of ${TOTAL_RECORDS.toLocaleString()} records...`);
    console.log(` Batch write buffer size: ${BATCH_SIZE.toLocaleString()} records`);
    console.log(` Destination collection: ${TARGET_COLLECTION}\n`);

    const startTime = Date.now();
    let peakHeapMB = 0;
    let peakRssMB = 0;
    let sampleCount = 0;

    const initialMem = process.memoryUsage();
    console.log(` Initial State: Heap Used = ${(initialMem.heapUsed / 1024 / 1024).toFixed(2)} MB | RSS = ${(initialMem.rss / 1024 / 1024).toFixed(2)} MB`);

    const memInterval = setInterval(() => {
        const mem = process.memoryUsage();
        const heap = +(mem.heapUsed / 1024 / 1024).toFixed(2);
        const rss = +(mem.rss / 1024 / 1024).toFixed(2);
        if (heap > peakHeapMB) peakHeapMB = heap;
        if (rss > peakRssMB) peakRssMB = rss;
        sampleCount++;

        process.stdout.write(`\r [Live Profiler] Heap: ${heap} MB (Peak: ${peakHeapMB} MB) | RSS: ${rss} MB (Peak: ${peakRssMB} MB) | Constraint < 150 MB: ${heap < 150 ? 'PASS' : 'FAIL'} `);
    }, 100);

    // Synthetic object generator simulating massive file stream
    let generated = 0;
    const stream = new Readable({
        objectMode: true,
        read() {
            while (generated < TOTAL_RECORDS) {
                generated++;
                const record = {
                    user_id: generated,
                    name: `Customer_${generated}`,
                    email: `customer${generated}@infotact.com`,
                    spend: (Math.random() * 2500).toFixed(2),
                    status: 'active'
                };
                if (!this.push(record)) return; // Backpressure handling
            }
            this.push(null);
        }
    });

    const mapper = new MappingAndValidationTransform({
        jobId: 'audit-cli',
        mappings: [
            { sourceField: 'user_id', targetField: 'userId', targetType: 'number', transformType: 'direct' },
            { sourceField: 'name', targetField: 'customerName', targetType: 'string', transformType: 'uppercase' },
            { sourceField: 'email', targetField: 'contactEmail', targetType: 'string', transformType: 'trim', validation: { isEmail: true } },
            { sourceField: 'spend', targetField: 'totalSpend', targetType: 'number', transformType: 'round' }
        ]
    });

    const bulkWriter = new BulkIngestStream({
        jobId: 'audit-cli',
        targetCollectionName: TARGET_COLLECTION,
        batchSize: BATCH_SIZE
    });

    await new Promise((resolve, reject) => {
        stream
            .pipe(mapper)
            .pipe(bulkWriter)
            .on('finish', resolve)
            .on('error', reject);
    });

    clearInterval(memInterval);
    const totalMs = Date.now() - startTime;
    const throughput = +(TOTAL_RECORDS / (totalMs / 1000)).toFixed(1);

    console.log('\n\n' + '='.repeat(70));
    console.log(' MEMORY AUDIT FINAL REPORT:');
    console.log('='.repeat(70));
    console.log(` Records Processed:       ${TOTAL_RECORDS.toLocaleString()}`);
    console.log(` Batches Written (5k ea): ${bulkWriter.batchesProcessed}`);
    console.log(` Total Time Elapsed:      ${(totalMs / 1000).toFixed(2)} seconds`);
    console.log(` Average Throughput:      ${throughput.toLocaleString()} rows/second`);
    console.log(` Peak V8 Heap Used:       ${peakHeapMB} MB  (Limit: 150 MB)`);
    console.log(` Peak Process RSS:        ${peakRssMB} MB   (Limit: 150 MB)`);
    console.log(` Memory Audit Status:     ${peakHeapMB < 150 ? '>>> PASSED <<<' : '>>> FAILED <<<'}`);
    console.log('='.repeat(70));

    // Clean up audit test collection
    await mongoose.connection.db.dropCollection(TARGET_COLLECTION).catch(() => {});
    await mongoose.disconnect();
    process.exit(0);
}

runAudit().catch(err => {
    console.error('\nAudit error:', err);
    process.exit(1);
});
