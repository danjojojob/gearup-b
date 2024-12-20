const pool = require('../config/db');

const getDashboardData = async (req, res) => {
    try {
        // Query to get the total number of items available
        const totalItemsQuery = 'SELECT COUNT(*) FROM items WHERE status = true and is_deleted = false';
        const totalItemsResult = await pool.query(totalItemsQuery);
        const totalItems = parseInt(totalItemsResult.rows[0].count, 10) || 0;

        // Query to get the total number of low stock items
        const lowStockItemsQuery = `
            SELECT 
                COUNT(*)
            FROM items
            LEFT JOIN rop_summary_view rop ON rop.item_id = items.item_id
            WHERE
                stock_count > 0 
                AND
                (
                    (lead_time_demand + safety_stock = 0 AND stock_count <= 5) -- Fallback case
                    OR
                    (lead_time_demand + safety_stock > 0 AND stock_count <= lead_time_demand + safety_stock) -- Normal case
                )
                AND status = true
                AND is_deleted = false`;
                
        const lowStockItemsResult = await pool.query(lowStockItemsQuery);
        const lowStockItems = parseInt(lowStockItemsResult.rows[0].count, 10) || 0;

        // Define today's date to use in queries

        // Query to get sold_today from sales_items
        const soldTodayQuery = `
            SELECT 
                SUM(
                    CASE 
                        WHEN DATE(si.date_created AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Manila') = DATE(NOW() AT TIME ZONE 'Asia/Manila') THEN
                            CASE 
                                WHEN si.refund_qty = 0 AND si.return_qty = 0 THEN si.item_qty 
                                WHEN si.refund_qty = si.item_qty OR si.return_qty = si.item_qty THEN 0
                                WHEN si.refund_qty < si.item_qty THEN (si.item_qty - si.refund_qty)
                                WHEN si.return_qty < si.item_qty THEN (si.item_qty - si.return_qty)
                            END
                        ELSE 0 
                    END
                ) AS sold_today
            FROM sales_items si
            WHERE si.sale_item_type = 'sale';

        `;
        const soldTodayResult = await pool.query(soldTodayQuery);
        const soldToday = parseInt(soldTodayResult.rows[0].sold_today, 10) || 0;

        // Query to get rendered_today from sales_mechanics
        const renderedTodayQuery = `
            SELECT 
                COUNT(CASE WHEN DATE(sm.date_created AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Manila') = DATE(NOW() AT TIME ZONE 'Asia/Manila') THEN sm.sale_service_id ELSE NULL END) AS rendered_today
            FROM sales_mechanics sm
            JOIN sales s ON sm.sale_id = s.sale_id
            WHERE s.status = true
        `;
        const renderedTodayResult = await pool.query(renderedTodayQuery);
        const renderedToday = parseInt(renderedTodayResult.rows[0].rendered_today, 10) || 0;

        // Send all the gathered data in the response
        res.status(200).json({
            totalItems,
            lowStockItems,
            soldToday,
            renderedToday
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getProductLeaderBoard = async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: "No token provided " });
    }

    const { start, end } = req.query;

    try {
        const query = `
            SELECT item_name, 
                SUM(
                    CASE 
                        WHEN si.refund_qty = 0 AND si.return_qty = 0 THEN si.item_qty 
                        WHEN si.refund_qty = si.item_qty OR si.return_qty = si.item_qty THEN 0
                        WHEN si.refund_qty < si.item_qty THEN (si.item_qty - si.refund_qty)
                        WHEN si.return_qty < si.item_qty THEN (si.item_qty - si.return_qty)
                    ELSE (COALESCE(si.item_qty,0) - COALESCE(si.refund_qty,0) - COALESCE(si.return_qty,0))
                    END
                ) AS item_qty
                    FROM sales_items SI
                    JOIN items I ON SI.item_id = I.item_id
                    JOIN sales S ON SI.sale_id = S.sale_id
                    WHERE (SI.date_created)::date BETWEEN $1 AND $2 AND S.status = true AND Si.sale_item_type = 'sale'
                    GROUP BY item_name
                    HAVING SUM(
                        CASE 
                            WHEN si.refund_qty = 0 AND si.return_qty = 0 THEN si.item_qty 
                            WHEN si.refund_qty = si.item_qty OR si.return_qty = si.item_qty THEN 0
                            WHEN si.refund_qty < si.item_qty THEN (si.item_qty - si.refund_qty)
                            WHEN si.return_qty < si.item_qty THEN (si.item_qty - si.return_qty)
                        ELSE (COALESCE(si.item_qty,0) - COALESCE(si.refund_qty,0) - COALESCE(si.return_qty,0))
                        END
                    ) > 0
                    ORDER BY item_qty DESC
                LIMIT 10;
        `;
        const values = [start, end];

        const { rows } = await pool.query(query, values);
        res.json({ leaderBoards: rows });
    } catch (error) {
        res.status(500).json({ error: "Error fetching product leaderboard" });
    }
};

const getSummaryRecords = async (req, res) => {
    try {
        const token = req.cookies.token;
        if(!token) return res.status(401).json({message: "Unauthorized"});

        const { date } = req.query;

        const getMechanicPercentage = `
            SELECT 
                setting_value
            FROM settings
            WHERE setting_key = 'mechanic_percentage';
        `;
        const value = await pool.query(getMechanicPercentage);
        const mechanicPercentage = value.rows[0].setting_value;
        
        const query = `
            SELECT 'items' as record_type, item_name, item_total_price, si.date_created as date, pos_name, s.sale_id as record_id, si.sale_item_id as record_item_id, si.refund_qty as refund_qty, si.item_qty as item_qty, item_unit_price, si.return_qty as return_qty 
                FROM sales_items SI 
                JOIN items I on SI.item_id = i.item_id
                JOIN sales S on SI.sale_id = s.sale_id
                JOIN pos_users P on SI.pos_id = p.pos_id
                WHERE DATE(si.date_created AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Manila') = $1 AND s.status = true AND si.sale_item_type = 'sale'
            UNION
            SELECT 'mechanic' as record_type, mechanic_name, service_price, sm.date_created as date, pos_name, s.sale_id as record_id, sm.sale_service_id as record_item_id, '0' as refund_qty, '1' as item_qty, service_price as item_unit_price, '0' as return_qty
                FROM sales_mechanics SM 
                JOIN mechanics M on SM.mechanic_id = M.mechanic_id
                JOIN sales S on SM.sale_id = s.sale_id
                JOIN pos_users P on SM.pos_id = p.pos_id
                WHERE DATE(sm.date_created AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Manila') = $1 AND s.status = true
            UNION
            SELECT 'expense' AS record_type, expense_name, expense_amount, e.date_created as date, pos_name, e.expense_id as record_id, e.expense_id as record_item_id, '0' as refund_qty, '1' as item_qty, expense_amount as item_unit_price, '0' as return_qty
                FROM expenses e JOIN pos_users P on e.pos_id = p.pos_id
                WHERE DATE(e.date_created AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Manila') = $1 AND e.status = 'active'
                ORDER BY date DESC, item_name ASC;
        `
        const values = [date];
        const { rows } = await pool.query(query, values);
        res.json({ records: rows, mechanicPercentage });
        
    } catch (error) {
        res.status(500).json({message: "Error"});
    }
}

const getReceiptOverview = async (req, res) => {
    try {
        const query = `
            SELECT 
                EXTRACT(HOUR FROM (r.date_created)) AS hour,
                SUM(((COALESCE(si.item_qty, 0) - COALESCE(si.refund_qty, 0) - COALESCE(si.return_qty, 0)) * COALESCE(si.item_unit_price,0)) 
                    + COALESCE(sm.service_price, 0)) 
                AS total_cost
            FROM 
                receipts r
            JOIN 
                sales s ON r.sale_id = s.sale_id
            LEFT JOIN 
                sales_items si ON si.sale_id = s.sale_id
            LEFT JOIN 
                sales_mechanics sm ON sm.sale_id = s.sale_id
            WHERE 
                DATE(r.date_created AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Manila') = DATE(NOW() AT TIME ZONE 'Asia/Manila')
                AND s.status = true 
                AND 
                (
                    si.sale_item_type = 'sale'
                    OR
                    si.sale_item_type IS NULL
                )   
            GROUP BY 
                EXTRACT(HOUR FROM (r.date_created))
            ORDER BY 
                hour;
        `;

        const { rows } = await pool.query(query);
        res.json({ data: rows });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch receipt overview' });
    }
};


module.exports = {
    getDashboardData,
    getProductLeaderBoard,
    getSummaryRecords,
    getReceiptOverview

};
