import axios from "axios";
import express from "express";
import pg from "pg";

const app = express();
const pool = new pg.Pool({
    host: "localhost",
    post: 5432,
    database: "book_notes",
    user: "postgres",
    password: "123456"
});
let errors = {};
const port = 3000;

let books = [];

app.use(express.urlencoded());
app.use(express.json());
app.use(express.static("public"))

process.on('SIGTERM', () => {
    pool.end(() => {
        console.log('Pool has been closed.');
    });
});


app.get("/", async (req, res) => {
    try {
        books = await getBooks();;

        res.render("index.ejs", { books: books, pageTitle: "Book Notes" });

    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }




});

app.get("/books/:isbn", async (req, res) => {
    const isbn = req.params["isbn"];
    try {

        const response = await pool.query("SELECT * FROM BOOK WHERE ISBN = $1", [isbn]);

        const data = response.rows;

        if (data.length === 0) {
            res.status(404).json(JSON.stringify({
                error: "book not found"
            }));

        } else {
            res.render("notes.ejs", { book: data[0], pageTitle: data[0].title });
        }




    } catch (err) {
        console.error("Error getting book ");
        res.sendStatus(500);

    }

});


app.put("/books/:id", async (req, res) => {
    
    const id = req.params.id;
    errors = validate(req);
    const title = req.body.title;
    const description = req.body.description;
    const date = req.body.date;
    const recommendation = req.body.recommendation;
    const isbn = req.body.isbn;
    const notes = req.body.notes;

    

    if (Object.keys(errors).length > 0) {
        res.redirect("/update/"+id);

    } else {
        // ....
        try {
            const response = await axios.get(`https://bookcover.longitood.com/bookcover/${isbn}`);
            if (response.status !== 200) {
                

                throw new Error(response.body);
            }
            const coverImgUrl = response.data.url;
            
            try {
                const response= await pool.query("UPDATE  BOOK SET title = $1, isbn= $2, date_read= $3, description= $4, recommendation= $5, notes= $6, cover_img_url= $7 where id=$8  ", [title, isbn, new Date(date), description, recommendation, notes, coverImgUrl, id]);
                
                
                res.sendStatus(300);



            } catch (err) {
                console.error("Error updating book " + err.message);
                throw err;

            }

            
        } catch (err) {
            errors.isbn = "Invalid ISBN Number";

            // res.redirect("/add");

            res.sendStatus(404).json({ "error": "Invalid ISBN" });

        }




    }





});

app.post("/books", async (req, res) => {
    errors = validate(req);
    const title = req.body.title;
    const description = req.body.description;
    const date = req.body.date;
    const recommendation = req.body.recommendation;
    const isbn = req.body.isbn;
    const notes = req.body.notes;


    if (Object.keys(errors).length > 0) {
        res.redirect("/add");

    } else {

        try {
            const response = await axios.get(`https://bookcover.longitood.com/bookcover/${isbn}`);
            if (response.status !== 200) {
                

                throw new Error(response.body);
            }
            const coverImgUrl = response.data.url;
            
            try {

                await pool.query("UPDATE BOOK SET title=$1 isbn=$2 date_read=$3 description=$4 recommendation=$5 notes=$6 cover_img_url=$7  WHERE id=$8", [title, isbn, new Date(date), description, recommendation, notes, coverImgUrl, bookId]);


            } catch (err) {
                console.error("Error inserting book " + err.message);
                throw err;

            }

            res.redirect("/");
        } catch (err) {


            console.error(err);
            res.status(500).json(JSON.stringify({ error: err }));



        }




    }


});

function validate(req) {
    const errors = {};


    if (!req.body.description) {
        errors.description = "Description is required";
    }

    return errors;



}

app.get("/add", (req, res) => {
    res.render("add.ejs", { errors: errors, pageTitle: "Add new book" });

});

app.get("/update/:id", (req, res) => {
    const bookId = parseInt(req.params["id"]);


    const book = books.find((book) => book.id === bookId);
    if (!book) {
        res.status(404).json(JSON.stringify({ error: "book not found" }));
    } else {
        res.render("update.ejs", { pageTitle: book.title, book });

    }


});

async function getBooks() {
    try {
        
        let response = await pool.query("SELECT * FROM BOOK");
        
        
        return response.rows;

    } catch (err) {
        console.error("Error getting data " + err);
        throw err;
    }




}

app.delete("/books/:id", async (req, res) => {
    const bookId = req.params["id"];
    const bookToDelete = books.find((book) => book.id == bookId);
    if (bookToDelete) {
        
        
        try {
            await pool.query("DELETE FROM BOOK WHERE ID = $1 ", [bookId]);
        
            res.sendStatus(303);
        } catch (err) {
            
            res.status(500).json(JSON.stringify(err));
        }

    } else {
        res.status(404).json({ error: "book not found" });
    }

});

app.listen(port, () => {
    console.log(`App is listening on port ${port}`);
});


