const request = require("supertest");

const app = require("../app");
const db = require("../db");

async function createData() {
    await db.query("DELETE FROM invoices");
    await db.query("DELETE FROM companies");
    await db.query("SELECT setval('invoices_id_seq', 1, false)");

    await db.query(`INSERT INTO companies (code, name, description)
                        VALUES ('apple', 'Apple', 'Maker of OSX.'),
                            ('ibm', 'IBM', 'Big blue.')`);

    const inv = await db.query(
            `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)
            VALUES ('apple', 100, false, '2018-01-01', null),
                    ('apple', 200, true, '2018-02-01', '2018-02-02'), 
                    ('ibm', 300, false, '2018-03-01', null)
            RETURNING id`);
}

beforeEach(createData);

afterAll(async () => {
    await db.end()
})

describe("GET /", function () {
    test("Should return list of invoices", async function () {
        const response = await request(app).get("/invoices");
        expect(response.body).toEqual({
            invoices:
                [ { id: 1, comp_code: 'apple' },
                  { id: 2, comp_code: 'apple' },
                  { id: 3, comp_code: 'ibm' } ]
        });
    })
});

describe("GET /1", function () {
    test("Should return the invoice of the id 1", async function () {
        const response = await request(app).get("/invoices/1");
        expect(response.body).toEqual({
            invoice: { id: 1,
                company:
                    {
                        code: 'apple',
                        name: 'Apple', 
                        description: 'Maker of OSX.' 
                    },
                amt: 100,
                paid: false,
                add_date: '2018-01-01T08:00:00.000Z',
                paid_date: null 
            } 
        });
    })
});

describe("POST /", function () {
    test("Should add a invoice", async function () {
        const response = await request(app).post("/invoices")
            .send({amt: 400, comp_code: 'ibm'});
        expect(response.body).toEqual(
            {
                invoice: { 
                    id: 4,
                    comp_code: 'ibm',
                    amt: 400,
                    paid: false,
                    add_date: '2021-08-14T07:00:00.000Z',
                    paid_date: null
                }
            }
        );
    });
});

describe("PATCH /", function () {
    test("Should update company", async function () {
        const response = await request(app).patch("/invoices/1")
            .send({amt: 100, paid: true});
        expect(response.body).toEqual({
            invoices: { 
                id: 1,
                comp_code: 'apple',
                amt: 100,
                paid: true,
                add_date: '2018-01-01T08:00:00.000Z',
                paid_date: '2021-08-14T07:00:00.000Z'
            }
        });
    });
});

describe("DELETE /", function () {
    test("Should delete company", async function () {
        const response = await request(app).delete("/invoices/1")
        expect(response.body).toEqual({
            status: "deleted"
        });
    });
});