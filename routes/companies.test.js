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
    test("Should return list of companies", async function () {
        const response = await request(app).get("/companies");
        expect(response.body).toEqual({
        "companies": [
            {code: "apple", name: "Apple"},
            {code: "ibm", name: "IBM"},
        ]
        });
    })
});

describe("GET /ibm", function () {
    test("Should return info on ibm", async function () {
        const response = await request(app).get("/companies/ibm");
        expect(response.body).toEqual({
            "company": {
              code: "ibm",
              name: "IBM",
              description: "Big blue.",
              invoices: [3],
            }
          });
    })
});

describe("POST /", function () {
    test("Should add company", async function () {
        const response = await request(app).post("/companies")
            .send({name: "Amazon", description: "the marketplace"});
        expect(response.body).toEqual(
            {
                "company": {
                    code: "amazon",
                    name: "Amazon",
                    description: "the marketplace",
                }
            }
        );
    });
});

describe("PATCH /", function () {
    test("Should update company", async function () {
        const response = await request(app).patch("/companies/apple")
            .send({name: "Apple", description: "creator of the mac"});
        expect(response.body).toEqual({
                "company": {
                    code: 'apple',
                    name: 'Apple',
                    description: 'creator of the mac'
                }
            });
      });
});

describe("DELETE /", function () {
    test("Should delete company", async function () {
        const response = await request(app).delete("/companies/apple")
        expect(response.body).toEqual({
            status: "deleted"
        });
    });
});