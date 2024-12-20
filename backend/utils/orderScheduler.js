const pool = require('../config/db');

const checkExpiredOrders = async () => {
    try {
        const result = await pool.query(`
            UPDATE orders
            SET order_status = 'expired', payment_status = 'failed'
            WHERE payment_status = 'failed' OR payment_status = 'pending'
            AND expires_at <= NOW()
            RETURNING *;
        `);
    } catch (error) {
        console.error("Error expiring orders.");
    }
};

// Function to start the scheduler
const startOrderExpiryScheduler = () => {
    // Check every 10 minutes (600000 ms)
    setInterval(checkExpiredOrders, 1 * 60 * 1000);
};

module.exports = startOrderExpiryScheduler;
