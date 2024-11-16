# book-notes
Book notes project to save notes about the books I read

# steps to execute locally
# Step 1 
configure your postgres db connection in the index.js file 
Here's my configuration...

const pool = new pg.Pool({
    host: "localhost",
    post: 5432,
    database: "book_notes",
    user: "postgres",
    password: "123456"
});

# Step 2 execute commands
npm install
npm run start
