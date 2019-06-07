const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const dateFormat = require('dateformat');
const app = express()
app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}))
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded());
app.set('view engine', 'pug');

app.use('/static', express.static('./static'));
let user = '';
let db = new sqlite3.Database('./notes.db');


app.get('/', (request, response) => {
    if (user == '') {
        response.render('login');
    } else {
        response.redirect('/notes')
    }
});

app.post('/login', (req, res) => {
    user = req.body.username;
    res.redirect('/notes');
});

app.get('/notes', (req, res) => {
    if (user != '') {
        let data = getNotesForCurrentUser().then((data) => {
            res.render('note', {'cards': data, 'name': user});
        });
    } else {
        return res.redirect('/');
    }
});

app.post('/notes/add', (req, res) => {
    addNewNote(req.body.content)
    .then(() => {
        res.redirect('/notes');
    })
    .catch((err) => {
        console.log(err);
    });
});

app.post('/notes/delete', (req, res) => {
    deleteNote(req.body.id).then(() => {
        res.redirect('/notes')
    });
});

app.post('/logout', (req, res) => {
    user = '';
    res.redirect('/');
});

app.listen(3000, () => {
    console.log("Server started!");
});

function deleteNote(id) {
    let sql = 'DELETE FROM NOTES WHERE id = ?';
    return new Promise((resolve, reject) => {
        db.run(sql, [id], (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        })
    });
}

function addNewNote(content) {
    let sql = 'INSERT INTO NOTES(username, text, date) values(?, ?, ?)';
    return new Promise((resolve, reject) => {
        db.run(sql, [user, content, dateFormat(new Date(), 'yyyy-mm-dd HH:MM')], (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}

function getNotesForCurrentUser() {
    let sql = 'SELECT * FROM NOTES WHERE username = ?';
    return new Promise((resolve, reject) => {
        db.all(sql, user, (err, rows) => {
            if (err) {
                reject();
            }
            resolve(rows);
        });
    });
}

