var express = require("express");
var mysql = require("mysql")
var cors = require("cors")
var bcrypt = require("bcrypt")
var session = require('express-session')
var app = express();
var porta = 8081

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(session({
    secret: 'cupSession',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 
    }
}))

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'CUP'
});

app.listen(porta, ()=>{
    console.log("Il server è attivo sulla porta " + porta);
});

app.use(express.json());
connection.connect();

function getIdUtenteDaRichiesta(richiesta) {
    const idDaSessione = Number(richiesta.session?.utente?.idUtente || 0)
    if (idDaSessione) {
        return idDaSessione
    }

    return Number(richiesta.body?.idUtente || 0)
}

app.get("/toponimi", (richiesta, risposta)=>{
    query = "SELECT * FROM toponimi WHERE ValToponimo = ' '";
    console.log("/toponimi");
    
    connection.query(query, 
        function (error, results, fields) {
            if(error){
                risposta.statusCode = 500
                risposta.statusMessage = "Errore di connessione con il db"
                risposta.send("Errore nell'esecuzione della query" + error)
            }else
                risposta.send(results)
    });
})

app.get("/province", (richiesta, risposta)=>{
    query = "SELECT * FROM province WHERE ValProvincia = ' '";
    console.log("/province");
    
    connection.query(query, 
        function (error, results, fields) {
            if(error){
                risposta.statusCode = 500
                risposta.statusMessage = "Errore di connessione con il db"
                risposta.send("Errore nell'esecuzione della query" + error)
            }else
                risposta.send(results)
    });
})

app.post("/comuni", (richiesta, risposta)=>{
    query = "SELECT * FROM comuni WHERE IDProvincia = ? AND ValComune = ' '";
    console.log("/comuni", richiesta.body.idProvincia);
    connection.query(query, [richiesta.body.idProvincia],
        function (error, results, fields) {
            if(error){
                risposta.statusCode = 500
                risposta.statusMessage = "Errore di connessione con il db"
                risposta.send("Errore nell'esecuzione della query" + error)
            }else
                risposta.send(results)
    });
})

app.post("/registrazione", (richiesta, risposta)=>{
    const utenteQuery = `
        INSERT INTO utenti
        (Nome, Cognome, DataNascita, Genere, Telefono, Email, Password, CodiceFiscale, IdToponimo, Indirizzo, NCivico, IdComune, Amministratore, ValUtente)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ' ')
    `;

    const pazienteQuery = `
        INSERT INTO pazienti
        (IDUtente, GruppoSanguigno, Peso, Altezza, ValPaziente)
        VALUES (?, ?, ?, ?, ' ')
    `;

    

    console.log("/registrazione", richiesta.body);
    bcrypt.hash(richiesta.body.password, 10, (errorHash, passwordHash) => {
        if(errorHash){
            risposta.statusCode = 500
            risposta.statusMessage = "Errore durante hashing password"
            risposta.send("Errore hashing password: " + errorHash)
            return;
        }

        connection.query(utenteQuery, [
            richiesta.body.nome,
            richiesta.body.cognome,
            richiesta.body.dataNascita,
            richiesta.body.genere,
            richiesta.body.telefono,
            richiesta.body.email,
            passwordHash,
            richiesta.body.codiceFiscale,
            richiesta.body.idToponimo,
            richiesta.body.indirizzo,
            richiesta.body.ncivico,
            richiesta.body.idComune
        ], (error, results, fields) => {
            if(error){
                if (error.code === "ER_DUP_ENTRY") {
                    const messaggioSql = (error.sqlMessage || error.message || "").toLowerCase();

                    if (messaggioSql.includes("email")) {
                        risposta.status(409).send({
                            result: "error",
                            field: "email",
                            message: "Email già in uso"
                        });
                        return;
                    }

                    if (messaggioSql.includes("codicefiscale") || messaggioSql.includes("codice_fiscale")) {
                        risposta.status(409).send({
                            result: "error",
                            field: "codiceFiscale",
                            message: "Codice fiscale già in uso"
                        });
                        return;
                    }

                    risposta.status(409).send({
                        result: "error",
                        field: "duplicate",
                        message: "Dati già presenti"
                    });
                    return;
                }

                risposta.statusCode = 500
                risposta.statusMessage = "Errore di connessione con il db"
                risposta.send({result: "error", message: "Errore nell'esecuzione della query"})
            }else{
                const idUtente = results.insertId;
                connection.query(pazienteQuery, [
                    idUtente,
                    richiesta.body.gruppoSanguigno,
                    richiesta.body.peso,
                    richiesta.body.altezza
                ], (error, results, fields) => {
                    if(error){
                        risposta.statusCode = 500
                        risposta.statusMessage = "Errore di connessione con il db"
                        risposta.send({result: "error", message: "Errore nell'esecuzione della query"})
                    }else{
                        richiesta.session.utente = {
                            idUtente: idUtente,
                            nome: richiesta.body.nome,
                            cognome: richiesta.body.cognome,
                            email: richiesta.body.email
                        }

                        risposta.send({
                            result: "success",
                            idUtente: idUtente,
                            nome: richiesta.body.nome,
                            cognome: richiesta.body.cognome,
                            email: richiesta.body.email
                        })
                    }
                })
            }
        })
    })

    
})

app.post("/login", (richiesta, risposta)=>{
    const query = "SELECT ID, Nome, Cognome, Email, Password FROM utenti WHERE Email = ? AND ValUtente = ' ' LIMIT 1";
    console.log("/login", richiesta.body);

    connection.query(query, [richiesta.body.email], (error, results) => {
        if (error) {
            risposta.statusCode = 500
            risposta.statusMessage = "Errore di connessione con il db"
            risposta.send("Errore nell'esecuzione della query" + error)
            return;
        }

        if (!results || results.length === 0) {
            risposta.status(401).send({ result: "credenziali-non-valide" })
            return;
        }

        const utente = results[0];
        bcrypt.compare(richiesta.body.password, utente.Password, (erroreCompare, match) => {
            if (erroreCompare) {
                risposta.statusCode = 500
                risposta.statusMessage = "Errore confronto password"
                risposta.send("Errore nel confronto password: " + erroreCompare)
                return;
            }

            if (!match) {
                risposta.status(401).send({ result: "credenziali-non-valide" })
                return;
            }

            richiesta.session.utente = {
                idUtente: utente.ID,
                nome: utente.Nome,
                cognome: utente.Cognome,
                email: utente.Email
            }

            risposta.send({
                result: "success",
                idUtente: utente.ID,
                nome: utente.Nome,
                cognome: utente.Cognome,
                email: utente.Email
            })
        })
    })
})

app.get("/utenteSessione", (richiesta, risposta) => {
    const utenteSessione = richiesta.session?.utente;

    if (!utenteSessione) {
        risposta.status(401).send({ result: "unauthorized" })
        return;
    }

    risposta.send({
        result: "success",
        idUtente: utenteSessione.idUtente,
        nome: utenteSessione.nome,
        cognome: utenteSessione.cognome,
        email: utenteSessione.email
    })
})

app.post("/nextThreeAppointments", (richiesta, risposta) => {
        const idUtente = getIdUtenteDaRichiesta(richiesta);
        if (!idUtente) {
            risposta.status(401).send({result: "unauthorized"})
            return;
        }

        const query = `SELECT pr.*, u.Nome AS NomeDottore, u.Cognome AS CognomeDottore
                                     FROM Prenotazioni pr
                                     JOIN Pazienti p ON pr.IDPaziente = p.ID
                                     JOIN Dottori d ON pr.IDDottore = d.ID
                                     JOIN Utenti u ON d.IDUtente = u.ID
                                     WHERE p.IDUtente = ?
                                         AND pr.DataOra > NOW()
                                         AND pr.ValPrenotazione = ' '
                                         AND p.ValPaziente = ' '
                                         AND d.ValDottore = ' '
                                         AND u.ValUtente = ' '
                   ORDER BY pr.DataOra ASC
                   LIMIT 3`;
    console.log("/nextThreeAppointments", richiesta.body);
    connection.query(query, [idUtente], (error, results) => {
        if (error) {
            risposta.statusCode = 500
            risposta.statusMessage = "Errore di connessione con il db"
            risposta.send({result: "error", message: "Errore nell'esecuzione della query"})
        } else {
            risposta.send({result: "success", prenotazioni: results})
        }
    })
})

app.post("/countNextMothAppointments", (richiesta, risposta) => {
    const idUtente = getIdUtenteDaRichiesta(richiesta);
    if (!idUtente) {
        risposta.status(401).send({result: "unauthorized"})
        return;
    }

        const query = `SELECT COUNT(*) AS count
                                     FROM Prenotazioni pr
                                     JOIN Pazienti p ON pr.IDPaziente = p.ID
                                     WHERE p.IDUtente = ?
                                         AND pr.DataOra > NOW()
                                         AND pr.DataOra < DATE_ADD(NOW(), INTERVAL 1 MONTH)
                                         AND pr.ValPrenotazione = ' '
                                         AND p.ValPaziente = ' '`;
    
    console.log("/countNextMothAppointments", richiesta.body);
    connection.query(query, [idUtente], (error, results) => {
        if (error) {
            risposta.statusCode = 500
            risposta.statusMessage = "Errore di connessione con il db"
            risposta.send({result: "error", message: "Errore nell'esecuzione della query"})
        } else {
            const count = results[0].count || 0;
            risposta.send({result: "success", count: count})
        }
    })
})

app.post("/totalToPay", (richiesta, risposta) => {
    const idUtente = getIdUtenteDaRichiesta(richiesta);
    if (!idUtente) {
        risposta.status(401).send({result: "unauthorized"})
        return;
    }

    const query = `SELECT SUM(d.PrezzoVisita) AS total
                   FROM Prenotazioni pr
                   JOIN Pazienti p ON pr.IDPaziente = p.ID
                   JOIN Dottori d ON pr.IDDottore = d.ID
                   WHERE p.IDUtente = ? AND pr.Pagata = 'N' AND pr.ValPrenotazione = ' ' AND p.ValPaziente = ' ' AND d.ValDottore = ' '`;
    console.log("/totalToPay", richiesta.body);
    connection.query(query, [idUtente], (error, results) => {
        if (error) {
            risposta.statusCode = 500
            risposta.statusMessage = "Errore di connessione con il db"
            risposta.send({result: "error", message: "Errore nell'esecuzione della query"})
        } else {
            const total = results[0].total || 0;
            risposta.send({result: "success", total: total})
        }
    })
})

app.post("/countToPayAppointments", (richiesta, risposta) => {
    const idUtente = getIdUtenteDaRichiesta(richiesta);
    if (!idUtente) {
        risposta.status(401).send({result: "unauthorized"})
        return;
    }

    const query = `SELECT COUNT(*) AS count
                   FROM Prenotazioni pr
                   JOIN Pazienti p ON pr.IDPaziente = p.ID
                   JOIN Dottori d ON pr.IDDottore = d.ID
                   WHERE p.IDUtente = ? AND pr.Pagata = 'N' AND pr.ValPrenotazione = ' ' AND p.ValPaziente = ' ' AND d.ValDottore = ' '`;
    console.log("/countToPayAppointments", richiesta.body);
    connection.query(query, [idUtente], (error, results) => {
        if (error) {
            risposta.statusCode = 500
            risposta.statusMessage = "Errore di connessione con il db"
            risposta.send({result: "error", message: "Errore nell'esecuzione della query"})
        } else {
            const count = results[0].count || 0;
            risposta.send({result: "success", count: count})
        }
    })
})

app.post("/recentToPay", (richiesta, risposta) => {
    const idUtente = getIdUtenteDaRichiesta(richiesta);
    if (!idUtente) {
        risposta.status(401).send({result: "unauthorized"})
        return;
    }

        const query = `SELECT pr.*, d.PrezzoVisita, u.Nome AS NomeDottore, u.Cognome AS CognomeDottore
                                     FROM Prenotazioni pr
                                     JOIN Pazienti p ON pr.IDPaziente = p.ID
                                     JOIN Dottori d ON pr.IDDottore = d.ID
                                     JOIN Utenti u ON d.IDUtente = u.ID
                   WHERE p.IDUtente = ?
                    AND pr.Pagata = 'N'
                    AND pr.ValPrenotazione = ' '
                    AND p.ValPaziente = ' '
                    AND d.ValDottore = ' '
                    AND u.ValUtente = ' '
                    AND pr.DataOra >= NOW()
                    AND pr.DataOra < DATE_ADD(NOW(), INTERVAL 1 WEEK)
                   ORDER BY pr.DataOra ASC`;
    console.log("/recentToPay", richiesta.body);
    connection.query(query, [idUtente], (error, results) => {
        if (error) {
            risposta.statusCode = 500
            risposta.statusMessage = "Errore di connessione con il db"
            risposta.send({result: "error", message: "Errore nell'esecuzione della query"})
        } else {
            risposta.send({result: "success", prenotazioni: results, prenotazione: results[0] || null})
        }
    })
})

app.get("/reparti", (richiesta, risposta)=>{
    query = "SELECT * FROM reparti WHERE ValReparto = ' '";
    console.log("/reparti");
        connection.query(query, 
        function (error, results, fields) {
            if(error){
                risposta.statusCode = 500
                risposta.statusMessage = "Errore di connessione con il db"
                risposta.send("Errore nell'esecuzione della query" + error)
            }else
                risposta.send(results)
    });
})

app.get("/dottoriReparto", (richiesta, risposta)=>{
    query = "SELECT d.ID, u.Nome, u.Cognome FROM dottori d JOIN utenti u ON d.IDUtente = u.ID WHERE d.ValDottore = ' ' AND u.ValUtente = ' ' AND d.IDReparto = ?";
    console.log("/dottoriReparto", richiesta.query);
    connection.query(query, [richiesta.query.repartoId], (error, results) => {
        if (error) {
            risposta.statusCode = 500
            risposta.statusMessage = "Errore di connessione con il db"
            risposta.send({result: "error", message: "Errore nell'esecuzione della query"})
        } else {
            risposta.send({result: "success", dottori: results})
        }
    })
})

app.post("/prenotazioni", (richiesta, risposta) => {
    const query = `SELECT * FROM Prenotazioni WHERE IDDottore= ? AND ValPrenotazione = ' ' ORDER BY DataOra DESC`;
    console.log("/prenotazioni", richiesta.body);
    connection.query(query, [richiesta.body.idDottore], (error, results) => {
        if (error) {
            risposta.statusCode = 500
            risposta.statusMessage = "Errore di connessione con il db"
            risposta.send({result: "error", message: "Errore nell'esecuzione della query"})
        } else {
            risposta.send({result: "success", prenotazioni: results})
        }
    })
})

app.post("/addPrenotazione", (richiesta, risposta) =>{
    console.log("/addPrenotazione", richiesta.body);

    const idPazienteBody = Number(richiesta.body.idPaziente || 0);
    const idUtenteBody = getIdUtenteDaRichiesta(richiesta);
    const idDottore = Number(richiesta.body.idDottore || 0);
    const dataOra = richiesta.body.dataOra;
    const tipoVisita = richiesta.body.tipoVisita;

    if (!idDottore || !dataOra || !tipoVisita || (!idPazienteBody && !idUtenteBody)) {
        risposta.status(400).send({result: "error", message: "Dati prenotazione mancanti o non validi"})
        return;
    }

    const inserisciConIdPaziente = (idPaziente) => {
        const queryInserimento = `INSERT INTO prenotazioni (IDPaziente, IDDottore, DataOra, TipoVisita, Pagata, ValPrenotazione) VALUES (?, ?, ?, ?, 'N', ' ')`;

        connection.query(queryInserimento, [idPaziente, idDottore, dataOra, tipoVisita], (error, results) => {
            if (error) {
                risposta.statusCode = 500
                risposta.statusMessage = "Errore di connessione con il db"
                risposta.send({result: "error", message: "Errore nell'esecuzione della query"})
            } else {
                risposta.send({result: "success", prenotazione: results})
            }
        })
    }

    if (idPazienteBody) {
        inserisciConIdPaziente(idPazienteBody);
        return;
    }

    const queryPaziente = `SELECT ID FROM pazienti WHERE IDUtente = ? AND ValPaziente = ' ' LIMIT 1`;
    connection.query(queryPaziente, [idUtenteBody], (errorePaziente, risultatiPaziente) => {
        if (errorePaziente) {
            risposta.statusCode = 500
            risposta.statusMessage = "Errore di connessione con il db"
            risposta.send({result: "error", message: "Errore nell'esecuzione della query"})
            return;
        }

        if (!Array.isArray(risultatiPaziente) || risultatiPaziente.length === 0) {
            risposta.status(404).send({result: "error", message: "Paziente non trovato"})
            return;
        }

        inserisciConIdPaziente(risultatiPaziente[0].ID);
    })
})

app.get("/prenotazioniPaziente", (richiesta, risposta) => {
    const idUtente = getIdUtenteDaRichiesta(richiesta);
    if (!idUtente) {
        risposta.status(401).send({result: "unauthorized"})
        return;
    }
    
    const query = `SELECT pr.*, 
                          u.Nome AS NomeDottore,
                          u.Cognome AS CognomeDottore,
                          u.Genere AS GenereDottore,
                          r.Reparto AS RepartoDottore
                   FROM Prenotazioni pr
                   JOIN Pazienti p ON pr.IDPaziente = p.ID
                   JOIN Dottori d ON pr.IDDottore = d.ID
                   JOIN Utenti u ON d.IDUtente = u.ID
                   JOIN Reparti r ON d.IDReparto = r.ID
                   WHERE p.IDUtente = ?
                     AND pr.ValPrenotazione = ' '
                     AND p.ValPaziente = ' '
                     AND d.ValDottore = ' '
                     AND u.ValUtente = ' '
                     AND r.ValReparto = ' '
                   ORDER BY pr.DataOra ASC`;
    connection.query(query, [idUtente], (error, results) => {
        if (error) {
            risposta.statusCode = 500
            risposta.statusMessage = "Errore di connessione con il db"
            risposta.send({result: "error", message: "Errore nell'esecuzione della query"})
        } else {
            risposta.send({result: "success", prenotazioni: results})
        }
    })
})

app.post("/pagaPrenotazione", (richiesta, risposta) => {
    const idUtente = getIdUtenteDaRichiesta(richiesta);
    if (!idUtente) {
        risposta.status(401).send({result: "unauthorized"})
        return;
    }
    const query = 'UPDATE Prenotazioni SET Pagata = "S" WHERE ID = ?';
    const idPrenotazione = richiesta.body.idPrenotazione;
    if (!idPrenotazione) {
        risposta.status(400).send({result: "error", message: "ID prenotazione mancante"})
        return;
    }
    connection.query(query, [idPrenotazione], (error, results) => {
        if (error) {
            risposta.statusCode = 500
            risposta.statusMessage = "Errore di connessione con il db"
            risposta.send({result: "error", message: "Errore nell'esecuzione della query"})
        } else {
            risposta.send({result: "success", prenotazione: results})
        }
    })
})

app.post("/logout", (richiesta, risposta) => {
    if (!richiesta.session) {
        risposta.status(200).send({ result: "success" });
        return;
    }

    richiesta.session.destroy(err => {
        if (err) {
            console.error("Errore logout:", err);
            risposta.status(500).send({ result: "error", message: "Impossibile terminare la sessione" });
            return;
        }

        risposta.clearCookie('connect.sid'); // cambiare se hai un nome cookie personalizzato
        console.log("/logout");
        risposta.send({ result: "success" });
    });
})

app.post("/datiPrenotazione" , (richiesta, risposta) => {
    const idUtente = getIdUtenteDaRichiesta(richiesta);
    if (!idUtente) {
        risposta.status(401).send({result: "unauthorized"})
        return;
    }
    const idPrenotazione = richiesta.body.idPrenotazione;
    if (!idPrenotazione) {
        risposta.status(400).send({result: "error", message: "ID prenotazione mancante"})
        return;
    }
    console.log("/datiPrenotazione", richiesta.body);
    const query = `SELECT pr.*,
                        u.Nome AS NomeDottore,
                        u.Cognome AS CognomeDottore,
                        r.Reparto AS RepartoDottore
                        FROM Prenotazioni pr
                        JOIN Pazienti p ON pr.IDPaziente = p.ID
                        JOIN Dottori d ON pr.IDDottore = d.ID
                        JOIN Utenti u ON d.IDUtente = u.ID
                        JOIN Reparti r ON d.IDReparto = r.ID
                        WHERE pr.ID = ?
                        AND p.IDUtente = ?
                        AND pr.ValPrenotazione = ' '
                        AND p.ValPaziente = ' '
                        AND d.ValDottore = ' '
                        AND u.ValUtente = ' '
                        AND r.ValReparto = ' '`;
        connection.query(query, [idPrenotazione, idUtente], (error, results) => {
        if (error) {
            risposta.statusCode = 500
            risposta.statusMessage = "Errore di connessione con il db"
            risposta.send({result: "error", message: "Errore nell'esecuzione della query"})
        } else {
            risposta.send({result: "success", prenotazione: results[0]})
        }
    })
})