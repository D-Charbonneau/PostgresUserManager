const express = require("express");
const app = express();

const uuidv4 = require("uuid").v4;

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const port = process.env.PORT || 80;

const pg = require("pg");
const client = new pg.Client({
    connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
    ssl: {
        rejectUnauthorized: false
    }
});

client.connect();



client.query(
    "select * from users",
    (err, result) =>
    {
        if (err !== null)
        {
            client.query(
                `create table users (
                firstname varchar(200),
                lastname varchar(200),
                age int,
                email varchar(300),
                createddate bigint,
                _id varchar(200)
                )`,
                (err, result) =>
                {
                    console.log("Created table 'users'")
                })
        }
    }
);

app.get("/", (req, res) =>
{
    res.send(`
    <a href="/newuser">New User</a>
    <a href="/userlist">User List</a>
    `);
})

app.get("/userlist", (req, res) =>
{
    client.query(
        "select * from users",
        (err, result) =>
        {
            let users = "";
            if (result)
            {
                let dbData = result.rows;
                dbData.sort((a, b) => (a.firstname > b.firstname ? 1 : -1))
                for (let i = 0; i < dbData.length; i++)
                {
                    users += `
            <li>
                ${dbData[i].firstname + " " + dbData[i].lastname}: (<a href="users/${dbData[i].firstname}">Edit</a>)
                <ul>
                    <li>Email: ${dbData[i].email}</li>
                    <li>Age: ${dbData[i].age}</li>
                </ul>
            </li>
        `
                }
            }
            res.send(`
        <a href="/">Home</a>
        <a href="/newuser">New User</a>
        <div>
            <form action="/userlist" method="POST">
                <input id="search" name="searchterm" placeholder="Search" />
            </form>
            <h2>Users: (<a href="/userlist/descending">Ascending</a>)</h2>
            <ol id="userlist">
                ${users}
            </ol>
        </div>
        `);
        }
    );
})

app.get("/userlist/descending", (req, res) =>
{
    client.query(
        "select * from users",
        (err, result) =>
        {
            let users = "";
            if (result)
            {
                let dbData = result.rows;
                dbData.sort((a, b) => (a.firstname < b.firstname ? 1 : -1))
                for (let i = 0; i < dbData.length; i++)
                {
                    users += `
            <li>
                ${dbData[i].firstname + " " + dbData[i].lastname}: (<a href="users/${dbData[i].firstname}">Edit</a>)
                <ul>
                    <li>Email: ${dbData[i].email}</li>
                    <li>Age: ${dbData[i].age}</li>
                </ul>
            </li>
        `
                }
            }
            res.send(`
        <a href="/">Home</a>
        <a href="/newuser">New User</a>
        <div>
            <form action="/userlist" method="POST">
                <input id="search" name="searchterm" placeholder="Search" />
            </form>
            <h2>Users: (<a href="/userlist">Descending</a>)</h2>
            <ol id="userlist">
                ${users}
            </ol>
        </div>
        `);
        }
    );
})


app.post("/userlist", (req, res) =>
{
    if (req.body.searchterm)
    {
        app.post("POST /userlist (search)")
        let users = "";
        client.query("select * from users", (err, result) =>
        {
            if (result)
            {
                let dbData = result.rows;
                dbData.sort((a, b) => (a.firstname > b.firstname ? 1 : -1))
                for (let i = 0; i < dbData.length; i++)
                {
                    const search = dbData[i].firstname + " " + dbData[i].lastname;
                    const searchTerm = req.body.searchterm;
                    if (search.toLowerCase().includes(searchTerm.toLowerCase()))
                    {
                        users += `
                            <li>
                                ${dbData[i].firstname + " " + dbData[i].lastname}: (<a href="users/${dbData[i].firstname}">Edit</a>)
                                <ul>
                                    <li>Email: ${dbData[i].email}</li>
                                    <li>Age: ${dbData[i].age}</li>
                                </ul>
                            </li>
                        `
                    }
                }
                res.send(`
                    <a href="/">Home</a>
                    <a href="/newuser">New User</a>
                    <div>
                        <form action="/userlist" method="POST">
                            <input id="search" name="searchterm" placeholder="Search" value="${req.body.searchterm}" />
                        </form>
                        <h2>Users:</h2>
                        <ol id="userlist">
                            ${users}
                        </ol>
                    </div>
                    `);
            }
        })
    }
    else
    {
        //TODO: DELETE USER
        client.query(
            `delete from users where firstname = '${req.body.user}';`,
            () =>
            {
                client.query(
                    "select * from users",
                    (err, result) =>
                    {
                        if (result)
                        {
                            let users = "";
                            let dbData = result.rows;
                            dbData.sort((a, b) => (a.firstname > b.firstname ? 1 : -1))
                            for (let i = 0; i < dbData.length; i++)
                            {
                                users += `
                <li>
                    ${dbData[i].firstname + " " + dbData[i].lastname}: (<a href="users/${dbData[i].firstname}">Edit</a>)
                    <ul>
                        <li>Email: ${dbData[i].email}</li>
                        <li>Age: ${dbData[i].age}</li>
                    </ul>
                </li>
            `

                            }
                            res.send(`
        <a href="/">Home</a>
        <a href="/newuser">New User</a>
        <div>
            <form action="/userlist" method="POST">
                <input id="search" name="searchterm" placeholder="Search" />
            </form>
            <h2>Users:</h2>
            <ol id="userlist">
                ${users}
            </ol>
        </div>
        `);
                        }
                    }
                )
            }
        )
    }
})

const newUserPage = `
<a href="/">Home</a>
<a href="/userlist">User List</a>
<form action="/newuser" method="POST">
    <input name="firstname" type="text" placeholder="First Name"/>
    <input name="lastname" type="text" placeholder="Last Name"/>
    <input name="email" type="email" placeholder="Email"/>
    <input name="age" type="number" placeholder="Age"/>
    <button type="submit">Submit</button>
</form>
`

app.get("/users/:user", (req, res) =>
{
    client.query(
        `select * from users where firstname = '${req.params.user}'`,
        (err, result) =>
        {
            if (result)
            {
                let dbData = result.rows;
                if (dbData.length == 0)
                {
                    res.send("404 Not Found")
                }
                else
                {
                    res.send(`
                        <a href="/">Home</a>
                        <a href="/userlist">User List</a>
                        <form action="/users/${dbData[0].firstname}" method="POST">
                            <input name="firstname" type="text" placeholder="First Name" value="${dbData[0].firstname}"/>
                            <input name="lastname" type="text" placeholder="Last Name" value="${dbData[0].lastname}"/>
                            <input name="email" type="email" placeholder="Email" value="${dbData[0].email}"/>
                            <input name="age" type="number" placeholder="Age" value="${dbData[0].age}"/>
                            <button type="submit">Submit</button>
                        </form>
                        <form action="/userlist" method="POST">
                            <input type="hidden" name="user" value="${dbData[0].firstname}" />
                            <button type="delete">Delete User</button>
                        </form>
                    `);
                }
            }
        }
    )
})

app.post("/users/:user", (req, res) =>
{
    console.log(`POST /user/${req.params.user}`);
    client.query(
        `update users set firstname = '${req.body.firstname}', lastname = '${req.body.lastname}', age = '${req.body.age}', email = '${req.body.email}' where firstname = '${req.params.user}'`,
        (err, result) => { }
    )
    client.query(
        "select * from users",
        (err, result) =>
        {
            if (result)
            {
                let users = "";
                let dbData = result.rows;
                for (let i = 0; i < dbData.length; i++)
                {
                    users += `
                        <li>
                            ${dbData[i].firstname + " " + dbData[i].lastname}: (<a href="../users/${dbData[i].firstname}">Edit</a>)
                            <ul>
                                <li>Email: ${dbData[i].email}</li>
                                <li>Age: ${dbData[i].age}</li>
                            </ul>
                        </li>
                    `
                }
                res.send(`
                    <a href="/">Home</a>
                    <a href="/newuser">New User</a>
                    <div>
                        <h2>Users:</h2>
                        <ol>
                            ${users}
                        </ol>
                    </div>
                `);

            }
        }

    )
})

app.get("/newuser", (req, res) =>
{
    res.send(newUserPage);
})

app.post("/newuser", (req, res) =>
{
    console.log("POST /newuser")


    client.query(
        `insert into users values ('${req.body.firstname}', '${req.body.lastname}', ${req.body.age}, '${req.body.email}', ${Date.now()}, '${uuidv4()}')`,
        (err, result) => { console.log(err ? err : "") }
    )
    console.log(`Saving new user's data`);
    res.send(newUserPage)
})

app.listen(port, () =>
{
    console.log("Server listening on port 80")
})