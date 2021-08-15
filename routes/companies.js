const express = require("express");
const ExpressError = require("../expressError")
const slugify = require("slugify");
const router = new express.Router();

const db = require("../db");

router.get("/", async function (req, res, next) {
    try {
        const result = await db.query(
            `SELECT code, name 
            FROM companies 
            ORDER BY name`
        );
        return res.json({"companies": result.rows});
    } catch (err) {
        return next(err)
    }
});

router.get('/:code', async function (req, res, next) {
    try {
        const code = req.params.code
        const result = await db.query(
            `SELECT * FROM companies 
             WHERE code= $1 `, [code]);

        
        if (result.rows.length === 0) {
            throw new ExpressError(`No such company: ${code}`, 404);
        }

        const iresults = await db.query(
            `SELECT id
             FROM invoices
             WHERE comp_code = $1`, [code]);  

        const comp = result.rows[0]
        const invoices = iresults.rows

        comp.invoices = invoices.map(i => i.id)
        return res.json({'company': comp});
    } catch(err) {
        return next(err)
    }
});

router.post("/", async function (req, res, next) {
    try {
        let {name, description} = req.body;
        let code = slugify(name, {lower: true});

        const result = await db.query(
            `INSERT INTO companies (code, name, description) 
            VALUES ($1, $2, $3) 
            RETURNING code, name, description`,
            [code, name, description]);

        return res.status(201).json({"company": result.rows[0]});
    }

    catch (err) {
        return next(err);
    }
});

router.patch('/:code', async function (req, res, next) {
    try {
        let code = req.params.code
        const { name, description } = req.body;
        const result = await db.query(                 
                 `UPDATE companies SET code=$1, name=$2, description=$3 WHERE code=$4
                  RETURNING code, name, description`, 
                  [code, name, description, req.params.code]);
        
        if (result.rows.length === 0) {
            throw new ExpressError(`No such company: ${code}`, 404);
        }

        return res.status(201).json({company: result.rows[0]});
    } catch(err) {
        return next(err)
    }
});

router.delete('/:code', async function (req, res, next) {
    try {
        let code = req.params.code;
    
        const result = await db.query(
              `DELETE FROM companies
               WHERE code=$1
               RETURNING code`,
            [code]);
    
        if (result.rows.length == 0) {
          throw new ExpressError(`No such company: ${code}`, 404)
        } else {
          return res.json({"status": "deleted"});
        }
    } catch(err) {
        return next(err)
    }

});


module.exports = router