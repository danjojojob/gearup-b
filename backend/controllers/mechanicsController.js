const pool = require('../config/db');
const {v4: uuidv4} = require('uuid');

const getAllMechanics = async (req, res) => {
    try {
        const query = `
            SELECT * 
            FROM mechanics 
            ORDER BY date_created DESC;
        `
        const { rows } = await pool.query(query);
        res.json({ mechanics: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

const addMechanic = async (req, res) => {
    try {
        const { name } = req.body;
        const id = 'mechanic-' + uuidv4();
        const query = `
            INSERT INTO mechanics (mechanic_id, mechanic_name)
            VALUES ($1, $2)
        `;

        const values = [id, name];

        await pool.query(query, values);
        res.status(201).json({ message: 'Success' });
    } catch (error) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
}

const editMechanic = async (req, res) => {
    try {
        const { name } = req.body;
        const { id } = req.params;
        const query = `
            UPDATE mechanics
            SET mechanic_name = $1, date_updated = NOW()
            WHERE mechanic_id = $2
        `;

        const values = [name, id];
        await pool.query(query, values);
        res.status(201).json({ message: 'Success' });
    } catch (error) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
}

const changeMechanicStatus = async (req, res) => {
    try {
        console.log('Archived');
        const { id } = req.params;
        const {status} = req.body;
        const query = `
            UPDATE mechanics
            SET status = $1, date_updated = NOW()
            WHERE mechanic_id = $2
        `;
        const values = [status, id];
        await pool.query(query, values);
        res.status(201).json({ message: 'Success' });
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

module.exports = {
    getAllMechanics,
    addMechanic,
    editMechanic,
    changeMechanicStatus
}