/**
 * Load Testing Script for La Taco Atelier
 * Creates multiple orders to test system capacity
 */

const https = require('https');

// Configuration
const BASE_URL = 'https://localhost';
const NUM_ORDERS = 30;
const CONCURRENT = true; // Set to false for sequential orders

// Ignore self-signed certificate errors
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Sample menu items (adjust IDs based on your actual menu)
const SAMPLE_ITEMS = [
    { menu_item_id: 1, quantity: 2, customizations: 'Extra salsa' },
    { menu_item_id: 2, quantity: 1, customizations: 'No onions' },
    { menu_item_id: 3, quantity: 3, customizations: '' }
];

// Sample customer data
const generateCustomer = (index) => ({
    customer_name: `Test Customer ${index}`,
    customer_phone: `555-${String(1000 + index).padStart(4, '0')}`,
    customer_email: `test${index}@example.com`,
    order_type: index % 2 === 0 ? 'PICKUP' : 'DELIVERY',
    notes: `Load test order #${index}`,
    items: SAMPLE_ITEMS
});

// Create PaymentIntent
async function createPaymentIntent(items) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ items });

        const options = {
            hostname: 'localhost',
            port: 443,
            path: '/api/payments/create-intent',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    if (result.success) {
                        resolve(result.id);
                    } else {
                        reject(new Error(result.message || 'Failed to create payment intent'));
                    }
                } catch (err) {
                    reject(err);
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// Create Order
async function createOrder(orderData, paymentIntentId) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            ...orderData,
            paymentIntentId
        });

        const options = {
            hostname: 'localhost',
            port: 443,
            path: '/api/orders',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            },
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    if (result.success) {
                        resolve(result.data);
                    } else {
                        reject(new Error(result.message || 'Failed to create order'));
                    }
                } catch (err) {
                    reject(err);
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// Process single order
async function processOrder(index) {
    const startTime = Date.now();

    try {
        const customerData = generateCustomer(index);

        // Create payment intent
        const paymentIntentId = await createPaymentIntent(customerData.items);

        // Create order
        const order = await createOrder(customerData, paymentIntentId);

        const duration = Date.now() - startTime;

        return {
            success: true,
            orderNumber: index,
            orderId: order.id,
            duration,
            message: `✅ Order #${index} created (ID: ${order.id}) in ${duration}ms`
        };
    } catch (error) {
        const duration = Date.now() - startTime;
        return {
            success: false,
            orderNumber: index,
            duration,
            message: `❌ Order #${index} failed: ${error.message}`
        };
    }
}

// Main execution
async function runLoadTest() {
    console.log('🌮 La Taco Atelier Load Test');
    console.log('='.repeat(50));
    console.log(`Orders to create: ${NUM_ORDERS}`);
    console.log(`Mode: ${CONCURRENT ? 'CONCURRENT' : 'SEQUENTIAL'}`);
    console.log(`Target: ${BASE_URL}`);
    console.log('='.repeat(50));
    console.log('');

    const overallStartTime = Date.now();
    let results = [];

    if (CONCURRENT) {
        // Run all orders concurrently
        console.log('🚀 Starting concurrent orders...\n');
        const promises = [];
        for (let i = 1; i <= NUM_ORDERS; i++) {
            promises.push(processOrder(i));
        }
        results = await Promise.all(promises);
    } else {
        // Run orders sequentially
        console.log('🚀 Starting sequential orders...\n');
        for (let i = 1; i <= NUM_ORDERS; i++) {
            const result = await processOrder(i);
            results.push(result);
            console.log(result.message);
        }
    }

    const overallDuration = Date.now() - overallStartTime;

    // Print results if concurrent
    if (CONCURRENT) {
        results.forEach(result => console.log(result.message));
    }

    // Summary
    console.log('');
    console.log('='.repeat(50));
    console.log('📊 LOAD TEST SUMMARY');
    console.log('='.repeat(50));

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => r.success === false).length;
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const minDuration = Math.min(...results.map(r => r.duration));
    const maxDuration = Math.max(...results.map(r => r.duration));

    console.log(`Total Orders: ${NUM_ORDERS}`);
    console.log(`Successful: ${successful} (${(successful / NUM_ORDERS * 100).toFixed(1)}%)`);
    console.log(`Failed: ${failed} (${(failed / NUM_ORDERS * 100).toFixed(1)}%)`);
    console.log(`Total Time: ${(overallDuration / 1000).toFixed(2)}s`);
    console.log(`Orders/sec: ${(NUM_ORDERS / (overallDuration / 1000)).toFixed(2)}`);
    console.log('');
    console.log('Response Times:');
    console.log(`  Average: ${avgDuration.toFixed(0)}ms`);
    console.log(`  Min: ${minDuration}ms`);
    console.log(`  Max: ${maxDuration}ms`);
    console.log('='.repeat(50));

    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
}

// Run the test
runLoadTest().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
