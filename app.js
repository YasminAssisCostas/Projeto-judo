const express = require('express');
const app = express();
const mysql = require('mysql');
const bcrypt = require("bcrypt");
const saltRounds = 10;
const formidable = require('formidable');
const session = require('express-session');

module.exports = app;
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(express.json());

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "projeto_judo"
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Conectado!");
});

app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: '2C44-4D44-WppQ38S',
    resave: false,
    saveUninitialized: true
}));

app.get('/', (req, res) => {
    res.render('main.ejs');
});

app.get('/quizz', (req, res) => {
    res.render('quizz.ejs');
});

app.get('/addConteudo', (req, res) => {
    res.render('addConteudo.ejs');
});

app.post('/addConteudo', function (req, res) {
    var id = req.session.id_usuario;
    var titulo = req.body['titulo'];
    var conteudo = req.body['conteudo'];
    var link = req.body['link'];

    var sql = "INSERT INTO tb_conteudo (titulo, conteudo, id_faixa, id_user, link_video, imagem, autor) VALUES ?"
    var values = [
        [titulo, conteudo, '2', '2', link, '4', 'josé']
    ];

    con.query(sql, [values], function (err, result) {
        if (err) throw err;
        console.log("Numero de registros inseridos: " + result.affectedRows);
    });
    res.redirect('/conteudo');
});

app.get('/inicio', (req, res) => {
    if (req.session.logado) {
        const query = "SELECT * FROM tb_faixa";
        con.query(query, (err, result) => {
            if (err) throw err;
            res.render('inicio.ejs', { faixas: result, id_usuario: req.session.id_usuario });
        });
    } else {
        res.render('login.ejs', { mensagem: "Realize login ou cadastre-se para ter acesso a essa página" });
    }
});

app.get('/menu', (req, res) => {
    res.render('menu.ejs');
});

app.get('/login', (req, res) => {
    res.render('login.ejs');
});

app.post('/login', function (req, res) {
    var senha = req.body['senha'];
    var email = req.body['email'];
    var sql = "SELECT * FROM tb_usuario where email = ?";
    con.query(sql, [email], function (err, result) {
        if (err) throw err;
        if (result.length) {
            bcrypt.compare(senha, result[0]['senha'], function (err, resultado) {
                if (err) throw err;
                if (resultado) {
                    req.session.logado = true;
                    req.session.username = result[0]['nome'];
                    req.session.id_usuario = result[0]['id_usuario'];
                    req.session.email = result[0]['email'];
                    res.redirect('/inicio');
                } else { 
                    res.render('login', { mensagem: "Senha inválida" });
                }
            });
        } else { 
            res.render('login.ejs', { mensagem: "Usuário inexistente" });
        }
    });
});

app.get('/cadastro', (req, res) => {
    res.render('cadastro.ejs');
});

app.post('/cadastro', function (req, res) {
    bcrypt.hash(req.body['senha'], saltRounds, function (err, hash) {
        var nome = req.body['nome'];
        var email = req.body['email'];
        var sql = "SELECT * FROM tb_usuario where email = ?";
        con.query(sql, [email], function (err, result) {
            if (err) throw err;
            if (result.length > 0) {
                res.redirect('/cadastro');
            } else {
                var sql = "INSERT INTO tb_usuario (nome, email, senha) VALUES ?";
                var values = [[nome, email, hash]];
                con.query(sql, [values], function (err, result) {
                    if (err) throw err;
                    console.log("Número de registros inseridos: " + result.affectedRows);
                });
                res.redirect('/login');
            }
        });
    });
});

app.get('/verMaterial', (req, res) => {
    if (req.session.logado) {
        const idConteudo = req.query.id_conteudo;
        const query = "SELECT * FROM tb_conteudo WHERE id_conteudo = ?";
        con.query(query, [idConteudo], (err, result) => {
            if (err) throw err;
            if (result.length > 0) {
                const conteudo = result[0];
                res.render('verMaterial.ejs', { conteudo });
            } else {
                res.send('Conteúdo não encontrado.');
            }
        });
    } else {
        res.render('login.ejs', { mensagem: "Realize login ou cadastre-se para ter acesso a essa página" });
    }
});

app.get('/addConteudo', (req, res) => {
    if (req.session.logado) {
        res.render('addConteudo.ejs');
    } else {
        res.render('login.ejs', { mensagem: "Realize login ou cadastre-se para ter acesso a essa página" });
    }
});

app.post('/addConteudo', function (req, res) {
    if (req.session.logado) {
        var id = req.session.id_usuario;
        var descricao = req.body.meta;
        var sql = "INSERT INTO tb_conteudo (titulo, conteudo, id_faixa, id_user, link_video, imagem, autor) VALUES ?";
        var values = [['1', '1', '2', '2', '3', '4', 'josé']];
        con.query(sql, [values], function (err, result) {
            if (err) throw err;
            console.log("Número de registros inseridos: " + result.affectedRows);
        });
        res.redirect('/conteudo');
    } else {
        res.render('login.ejs', { mensagem: "Realize login ou cadastre-se para ter acesso a essa página" });
    }
});

app.get('/conteudo', (req, res) => {
    if (req.session.logado) {
        const faixaId = req.query.faixa;
        if (!faixaId) {
            return res.status(400).send('Faixa não especificada.');
        }
        const query = "SELECT * FROM tb_conteudo WHERE id_faixa = ?";
        con.query(query, [faixaId], (err, result) => {
            if (err) throw err;
            res.render('conteudo.ejs', { conteudos: result });
        });
    } else {
        res.render('login.ejs', { mensagem: "Realize login ou cadastre-se para ter acesso a essa página" });
    }
});



app.get('/quizzes', (req, res) => {
    const id_conteudo = req.query.id_conteudo; 

    if (!id_conteudo) {
        return res.status(400).send('ID de conteúdo não especificado.');
    }

    const query = "SELECT * FROM tb_questao WHERE id_conteudo = ?";
    con.query(query, [id_conteudo], (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            res.render('quizzes', { quizzes: result });
        } else {
            res.send('Nenhum quiz encontrado para este conteúdo.');
        }
    });
});
 

app.get('/questoes', (req, res) => {
    const id_questao = req.query.id_questao; 

    if (!id_questao) {
        return res.status(400).send('ID de questão não especificado.');
    }

    const query = "SELECT * FROM tb_questao WHERE id_questao = ?";
    con.query(query, [id_questao], (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            // Acessar o primeiro item do array result
            res.render('quizz.ejs', { quiz: result[0] });
        } else {
            res.send('Nenhum quiz encontrado para este conteúdo.');
        }
    });
});






app.post('/quizz', (req, res) => {
    const { id_usuario, id_questao, resposta_um, resposta_dois, resposta_tres, resposta_quatro } = req.body;

    const query = `
        INSERT INTO tb_questao_usuario (id_usuario, id_questao, resposta_um, resposta_dois, resposta_tres, resposta_quatro)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    con.query(query, [id_usuario, id_questao, resposta_um, resposta_dois, resposta_tres, resposta_quatro], (err) => {
        if (err) throw err;
        res.redirect('/quizz?id_questao=' + id_questao);
    });
});

app.get('/sair', (req, res) => {
   
    req.session.destroy((err) => {
        if (err) {
            console.error("Erro ao destruir a sessão:", err);
            return res.redirect('/'); 
        }
        res.redirect('/'); 
    });
});


app.listen(3000, function () {
    console.log("Servidor Escutando na porta 3000");
});
