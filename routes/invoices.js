const express = require("express");
const ExpressError = require("../expressError")
const router = new express.Router();

const db = require("../db");

router.get("/", async function (req, res, next) {
    try {
        const results = await db.query(
            `SELECT id, comp_code
             FROM invoices 
             ORDER BY id`
        );
        return res.json({'invoices': results.rows});
    } catch (err) {
        return next(err)
    }
});

router.get("/:id", async function (req, res, next) {
    try {
        let id = req.params.id
        const result = await db.query(
            `SELECT i.id, i.comp_code, i.amt, i.paid, 
             i.add_date, i.paid_date, c.name, c.description 
             FROM invoices AS i
             INNER JOIN companies AS c ON (i.comp_code = c.code)  
             WHERE id = $1`, [id]);

        if (result.rows.length === 0) {
            throw new ExpressError(`No such invoice: ${id}`, 404);
        }

        const data = result.rows[0];
        const invoice = {
          id: data.id,
          company: {
            code: data.comp_code,
            name: data.name,
            description: data.description,
          },
          amt: data.amt,
          paid: data.paid,
          add_date: data.add_date,
          paid_date: data.paid_date,
        };
        return res.json({'invoice': invoice});
    } catch (err) {
        return next(err)
    }
});

router.post('/', async function (req, res, next) {
  try {
    let {comp_code, amt} = req.body;
    const result = await db.query(
          `INSERT INTO invoices (comp_code, amt) 
           VALUES ($1, $2) 
           RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt]);

    return res.json({"invoice": result.rows[0]});
  }
  catch (err) {
    return next(err);
  }
});

router.patch('/:id', async function (req, res, next) {
    try {
        let { amt, paid } = req.body;
        let paid_date = null;
        let id = req.params.id
        const result = await db.query(
                `SELECT paid
                 FROM invoices
                 WHERE id = $1`, [id]);

        if (result.rows.length === 0) {
            throw new ExpressError(`No such invoice: ${id}`, 404);
        }

        if (!result.rows[0].paid_date && paid) {
            paid_date = new Date()
        } else if (!paid) {
            paid_date = null
        } else {
            paid_date = result.rows[0].paid_date 
        }
        const iresult = await db.query(
                `UPDATE invoices
                 SET amt=$1, paid=$2, paid_date=$3
                 WHERE id=$4
                 RETURNING id, comp_code, amt, paid, add_date, paid_date`, [amt, paid, paid_date, id]);

        return res.status(201).json({"invoices": iresult.rows[0]});
    } catch(err) {
        return next(err)
    }
});

router.delete('/:id', async function (req, res, next) {
    try {
        let id = req.params.id
        const result = await db.query(
            `DELETE FROM invoices
             WHERE id = $1
             RETURNING id`, [id]);

        if (result.rows.length === 0) {
            throw new ExpressError(`No such invoice: ${id}`, 404);
        }

        return res.json({status: "deleted"});
    } catch(err) {
        return next(err)
    }

});

module.exports = router