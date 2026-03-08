var express = require("express");
var mysql = require("mysql");
var cors = require("cors");
var bcrypt = require("bcrypt");
var session = require("express-session");
var app = express();
var porta = 8081;

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(
  session({
    secret: "cupSession",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "CUP",
});

app.listen(porta, () => {
  console.log("Il server è attivo sulla porta " + porta);
});

app.use(express.json());
connection.connect();

function getIdUtenteDaRichiesta(richiesta) {
  const idDaSessione = Number(richiesta.session?.utente?.idUtente || 0);
  if (idDaSessione) {
    return idDaSessione;
  }

  return Number(richiesta.body?.idUtente || 0);
}

app.get("/toponimi", (richiesta, risposta) => {
  query = "SELECT * FROM toponimi WHERE ValToponimo = ' '";
  console.log("/toponimi");

  connection.query(query, function (error, results, fields) {
    if (error) {
      risposta.statusCode = 500;
      risposta.statusMessage = "Errore di connessione con il db";
      risposta.send("Errore nell'esecuzione della query" + error);
    } else risposta.send(results);
  });
});

app.get("/province", (richiesta, risposta) => {
  query = "SELECT * FROM province WHERE ValProvincia = ' '";
  console.log("/province");

  connection.query(query, function (error, results, fields) {
    if (error) {
      risposta.statusCode = 500;
      risposta.statusMessage = "Errore di connessione con il db";
      risposta.send("Errore nell'esecuzione della query" + error);
    } else risposta.send(results);
  });
});

app.post("/comuni", (richiesta, risposta) => {
  query = "SELECT * FROM comuni WHERE IDProvincia = ? AND ValComune = ' '";
  console.log("/comuni", richiesta.body.idProvincia);
  connection.query(
    query,
    [richiesta.body.idProvincia],
    function (error, results, fields) {
      if (error) {
        risposta.statusCode = 500;
        risposta.statusMessage = "Errore di connessione con il db";
        risposta.send("Errore nell'esecuzione della query" + error);
      } else risposta.send(results);
    },
  );
});

app.post("/registrazione", (richiesta, risposta) => {
  const registrazioneDottoreDaAdmin =
    String(richiesta.session?.utente?.amministratore || "")
      .trim()
      .toUpperCase() === "S";

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

  const dottoreQuery = `
        INSERT INTO dottori
        (IDUtente, IDReparto, Ruolo, PrezzoVisita, ValDottore)
        VALUES (?, ?, ?, ?, ' ')
    `;

  console.log("/registrazione", richiesta.body);
  bcrypt.hash(richiesta.body.password, 10, (errorHash, passwordHash) => {
    if (errorHash) {
      risposta.statusCode = 500;
      risposta.statusMessage = "Errore durante hashing password";
      risposta.send("Errore hashing password: " + errorHash);
      return;
    }

    connection.query(
      utenteQuery,
      [
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
        richiesta.body.idComune,
      ],
      (error, results, fields) => {
        if (error) {
          if (error.code === "ER_DUP_ENTRY") {
            const messaggioSql = (
              error.sqlMessage ||
              error.message ||
              ""
            ).toLowerCase();

            if (messaggioSql.includes("email")) {
              risposta.status(409).send({
                result: "error",
                field: "email",
                message: "Email già in uso",
              });
              return;
            }

            if (
              messaggioSql.includes("codicefiscale") ||
              messaggioSql.includes("codice_fiscale")
            ) {
              risposta.status(409).send({
                result: "error",
                field: "codiceFiscale",
                message: "Codice fiscale già in uso",
              });
              return;
            }

            risposta.status(409).send({
              result: "error",
              field: "duplicate",
              message: "Dati già presenti",
            });
            return;
          }

          risposta.statusCode = 500;
          risposta.statusMessage = "Errore di connessione con il db";
          risposta.send({
            result: "error",
            message: "Errore nell'esecuzione della query",
          });
        } else {
          const idUtente = results.insertId;

          if (registrazioneDottoreDaAdmin) {
            connection.query(
              dottoreQuery,
              [
                idUtente,
                richiesta.body.reparto,
                richiesta.body.ruolo,
                richiesta.body.prezzoVisita,
              ],
              (error, results, fields) => {
                if (error) {
                  risposta.statusCode = 500;
                  risposta.statusMessage = "Errore di connessione con il db";
                  risposta.send({
                    result: "error",
                    message: "Errore nell'esecuzione della query",
                  });
                } else {
                  risposta.send({
                    result: "success",
                    idUtente: idUtente,
                    nome: richiesta.body.nome,
                    cognome: richiesta.body.cognome,
                    email: richiesta.body.email,
                  });
                }
              },
            );
            return;
          }

          connection.query(
            pazienteQuery,
            [
              idUtente,
              richiesta.body.gruppoSanguigno,
              richiesta.body.peso,
              richiesta.body.altezza,
            ],
            (error, results, fields) => {
              if (error) {
                risposta.statusCode = 500;
                risposta.statusMessage = "Errore di connessione con il db";
                risposta.send({
                  result: "error",
                  message: "Errore nell'esecuzione della query",
                });
              } else {
                richiesta.session.utente = {
                  idUtente: idUtente,
                  nome: richiesta.body.nome,
                  cognome: richiesta.body.cognome,
                  email: richiesta.body.email,
                };

                risposta.send({
                  result: "success",
                  idUtente: idUtente,
                  nome: richiesta.body.nome,
                  cognome: richiesta.body.cognome,
                  email: richiesta.body.email,
                });
              }
            },
          );
        }
      },
    );
  });
});

app.post("/aggiungiAdmin", (richiesta, risposta) => {
  const utenteSessione = richiesta.session?.utente;
  const idUtente = Number(utenteSessione?.idUtente || 0);
  if (!idUtente) {
    risposta.status(401).send({ result: "unauthorized" });
    return;
  }

  const isAdmin =
    String(utenteSessione?.amministratore || "")
      .trim()
      .toUpperCase() === "S";
  if (!isAdmin) {
    risposta.status(403).send({ result: "forbidden" });
    return;
  }

  const nomeAdmin = String(richiesta.body?.nomeAdmin || "").trim();
  const email = String(richiesta.body?.email || "").trim();
  const telefono = String(richiesta.body?.telefono || "").trim();
  const password = String(richiesta.body?.password || "");

  if (!nomeAdmin || !email || !telefono || !password) {
    risposta.status(400).send({
      result: "error",
      message: "Dati admin mancanti o non validi",
    });
    return;
  }

  if (nomeAdmin.length > 100) {
    risposta.status(400).send({
      result: "error",
      field: "nomeAdmin",
      message: "Nome admin troppo lungo",
    });
    return;
  }

  if (email.length > 150) {
    risposta.status(400).send({
      result: "error",
      field: "email",
      message: "Email troppo lunga",
    });
    return;
  }

  if (telefono.length > 15) {
    risposta.status(400).send({
      result: "error",
      field: "telefono",
      message: "Telefono troppo lungo (max 15 caratteri)",
    });
    return;
  }

  const query = `
    INSERT INTO utenti
    (Nome, Cognome, DataNascita, Genere, Telefono, Email, Password, CodiceFiscale, IdToponimo, Indirizzo, NCivico, IdComune, Amministratore, ValUtente)
    VALUES (?, ?, '9999-01-01', 'O', ?, ?, ?, NULL, 3, 'Piemonte', '1', 181, 'S', ' ')
  `;

  console.log("/aggiungiAdmin", richiesta.body);
  bcrypt.hash(password, 10, (errorHash, passwordHash) => {
    if (errorHash) {
      risposta.statusCode = 500;
      risposta.statusMessage = "Errore durante hashing password";
      risposta.send("Errore hashing password: " + errorHash);
      return;
    }

    connection.query(query, [nomeAdmin, nomeAdmin, telefono, email, passwordHash], (error, results) => {
      if (error) {
        console.error("Errore /aggiungiAdmin:", error);

        if (error.code === "ER_DUP_ENTRY") {
          const messaggioSql = String(error.sqlMessage || error.message || "").toLowerCase();
          if (messaggioSql.includes("email")) {
            risposta.status(409).send({
              result: "error",
              field: "email",
              message: "Email gia in uso",
            });
            return;
          }
        }

        if (error.code === "ER_NO_REFERENCED_ROW_2") {
          risposta.status(400).send({
            result: "error",
            message: "Vincolo esterno non rispettato: verificare che esistano IdToponimo=3 e IdComune=181 (script InserisciDB.sql)",
          });
          return;
        }

        if (error.code === "ER_DATA_TOO_LONG") {
          risposta.status(400).send({
            result: "error",
            message: "Uno o piu campi superano la lunghezza massima consentita",
          });
          return;
        }

        risposta.statusCode = 500;
        risposta.statusMessage = "Errore di connessione con il db";
        risposta.send({
          result: "error",
          message: "Errore nell'esecuzione della query",
        });
      } else {
        risposta.send({
          result: "success",
          idUtente: results.insertId,
          nome: nomeAdmin,
          cognome: nomeAdmin,
          email: email,
          amministratore: "S",
        });
      }
    });
  });
});

app.post("/login", (richiesta, risposta) => {
  const query =
    "SELECT u.ID, u.Nome, u.Cognome, u.Email, u.Password, u.Amministratore, CASE WHEN EXISTS (SELECT 1 FROM dottori d WHERE d.IDUtente = u.ID AND d.ValDottore = ' ') THEN 'S' ELSE 'N' END AS Dottore FROM utenti u WHERE u.Email = ? AND u.ValUtente = ' ' LIMIT 1";
  console.log("/login", richiesta.body);

  connection.query(query, [richiesta.body.email], (error, results) => {
    if (error) {
      risposta.statusCode = 500;
      risposta.statusMessage = "Errore di connessione con il db";
      risposta.send("Errore nell'esecuzione della query" + error);
      return;
    }

    if (!results || results.length === 0) {
      risposta.status(401).send({ result: "credenziali-non-valide" });
      return;
    }

    const utente = results[0];
    bcrypt.compare(
      richiesta.body.password,
      utente.Password,
      (erroreCompare, match) => {
        if (erroreCompare) {
          risposta.statusCode = 500;
          risposta.statusMessage = "Errore confronto password";
          risposta.send("Errore nel confronto password: " + erroreCompare);
          return;
        }

        if (!match) {
          risposta.status(401).send({ result: "credenziali-non-valide" });
          return;
        }

        richiesta.session.utente = {
          idUtente: utente.ID,
          nome: utente.Nome,
          cognome: utente.Cognome,
          email: utente.Email,
          amministratore: utente.Amministratore,
          dottore: utente.Dottore,
        };

        risposta.send({
          result: "success",
          idUtente: utente.ID,
          nome: utente.Nome,
          cognome: utente.Cognome,
          email: utente.Email,
          amministratore: utente.Amministratore,
          dottore: utente.Dottore,
        });
      },
    );
  });
});

app.get("/utenteSessione", (richiesta, risposta) => {
  const utenteSessione = richiesta.session?.utente;

  if (!utenteSessione) {
    risposta.status(401).send({ result: "unauthorized" });
    return;
  }

  risposta.send({
    result: "success",
    idUtente: utenteSessione.idUtente,
    nome: utenteSessione.nome,
    cognome: utenteSessione.cognome,
    email: utenteSessione.email,
    amministratore: utenteSessione.amministratore,
    dottore: utenteSessione.dottore,
  });
});

app.post("/nextThreeAppointments", (richiesta, risposta) => {
  const idUtente = getIdUtenteDaRichiesta(richiesta);
  if (!idUtente) {
    risposta.status(401).send({ result: "unauthorized" });
    return;
  }

  const query = `SELECT pr.*, u.Nome AS NomeDottore, u.Cognome AS CognomeDottore, u.Email AS EmailDottore, u.Telefono AS TelefonoDottore
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
      risposta.statusCode = 500;
      risposta.statusMessage = "Errore di connessione con il db";
      risposta.send({
        result: "error",
        message: "Errore nell'esecuzione della query",
      });
    } else {
      risposta.send({ result: "success", prenotazioni: results });
    }
  });
});

app.post("/countNextMothAppointments", (richiesta, risposta) => {
  const idUtente = getIdUtenteDaRichiesta(richiesta);
  if (!idUtente) {
    risposta.status(401).send({ result: "unauthorized" });
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
      risposta.statusCode = 500;
      risposta.statusMessage = "Errore di connessione con il db";
      risposta.send({
        result: "error",
        message: "Errore nell'esecuzione della query",
      });
    } else {
      const count = results[0].count || 0;
      risposta.send({ result: "success", count: count });
    }
  });
});

app.post("/totalToPay", (richiesta, risposta) => {
  const idUtente = getIdUtenteDaRichiesta(richiesta);
  if (!idUtente) {
    risposta.status(401).send({ result: "unauthorized" });
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
      risposta.statusCode = 500;
      risposta.statusMessage = "Errore di connessione con il db";
      risposta.send({
        result: "error",
        message: "Errore nell'esecuzione della query",
      });
    } else {
      const total = results[0].total || 0;
      risposta.send({ result: "success", total: total });
    }
  });
});

app.post("/countToPayAppointments", (richiesta, risposta) => {
  const idUtente = getIdUtenteDaRichiesta(richiesta);
  if (!idUtente) {
    risposta.status(401).send({ result: "unauthorized" });
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
      risposta.statusCode = 500;
      risposta.statusMessage = "Errore di connessione con il db";
      risposta.send({
        result: "error",
        message: "Errore nell'esecuzione della query",
      });
    } else {
      const count = results[0].count || 0;
      risposta.send({ result: "success", count: count });
    }
  });
});

app.post("/recentToPay", (richiesta, risposta) => {
  const idUtente = getIdUtenteDaRichiesta(richiesta);
  if (!idUtente) {
    risposta.status(401).send({ result: "unauthorized" });
    return;
  }

  const query = `SELECT pr.*, d.PrezzoVisita, u.Nome AS NomeDottore, u.Cognome AS CognomeDottore, u.Email AS EmailDottore, u.Telefono AS TelefonoDottore
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
      risposta.statusCode = 500;
      risposta.statusMessage = "Errore di connessione con il db";
      risposta.send({
        result: "error",
        message: "Errore nell'esecuzione della query",
      });
    } else {
      risposta.send({
        result: "success",
        prenotazioni: results,
        prenotazione: results[0] || null,
      });
    }
  });
});

app.get("/reparti", (richiesta, risposta) => {
  query = "SELECT * FROM reparti WHERE ValReparto = ' '";
  console.log("/reparti");
  connection.query(query, function (error, results, fields) {
    if (error) {
      risposta.statusCode = 500;
      risposta.statusMessage = "Errore di connessione con il db";
      risposta.send("Errore nell'esecuzione della query" + error);
    } else risposta.send(results);
  });
});

app.get("/dottoriReparto", (richiesta, risposta) => {
  query =
    "SELECT d.ID, u.Nome, u.Cognome FROM dottori d JOIN utenti u ON d.IDUtente = u.ID WHERE d.ValDottore = ' ' AND u.ValUtente = ' ' AND d.IDReparto = ?";
  console.log("/dottoriReparto", richiesta.query);
  connection.query(query, [richiesta.query.repartoId], (error, results) => {
    if (error) {
      risposta.statusCode = 500;
      risposta.statusMessage = "Errore di connessione con il db";
      risposta.send({
        result: "error",
        message: "Errore nell'esecuzione della query",
      });
    } else {
      risposta.send({ result: "success", dottori: results });
    }
  });
});

app.post("/prenotazioniDottore", (richiesta, risposta) => {
  const query = `SELECT * FROM Prenotazioni WHERE IDDottore= ? ORDER BY DataOra DESC`;
  console.log("/prenotazioni", richiesta.body);
  connection.query(query, [richiesta.body.idDottore], (error, results) => {
    if (error) {
      risposta.statusCode = 500;
      risposta.statusMessage = "Errore di connessione con il db";
      risposta.send({
        result: "error",
        message: "Errore nell'esecuzione della query",
      });
    } else {
      risposta.send({ result: "success", prenotazioni: results });
    }
  });
});

app.post("/addPrenotazione", (richiesta, risposta) => {
  console.log("/addPrenotazione", richiesta.body);

  const idPazienteBody = Number(richiesta.body.idPaziente || 0);
  const idUtenteBody = getIdUtenteDaRichiesta(richiesta);
  const idDottore = Number(richiesta.body.idDottore || 0);
  const dataOra = richiesta.body.dataOra;
  const tipoVisita = richiesta.body.tipoVisita;

  if (
    !idDottore ||
    !dataOra ||
    !tipoVisita ||
    (!idPazienteBody && !idUtenteBody)
  ) {
    risposta
      .status(400)
      .send({
        result: "error",
        message: "Dati prenotazione mancanti o non validi",
      });
    return;
  }

  const inserisciConIdPaziente = (idPaziente) => {
    const queryInserimento = `INSERT INTO prenotazioni (IDPaziente, IDDottore, DataOra, TipoVisita, Pagata, ValPrenotazione) VALUES (?, ?, ?, ?, 'N', ' ')`;

    connection.query(
      queryInserimento,
      [idPaziente, idDottore, dataOra, tipoVisita],
      (error, results) => {
        if (error) {
          risposta.statusCode = 500;
          risposta.statusMessage = "Errore di connessione con il db";
          risposta.send({
            result: "error",
            message: "Errore nell'esecuzione della query",
          });
        } else {
          risposta.send({ result: "success", prenotazione: results });
        }
      },
    );
  };

  if (idPazienteBody) {
    inserisciConIdPaziente(idPazienteBody);
    return;
  }

  const queryPaziente = `SELECT ID FROM pazienti WHERE IDUtente = ? AND ValPaziente = ' ' LIMIT 1`;
  connection.query(
    queryPaziente,
    [idUtenteBody],
    (errorePaziente, risultatiPaziente) => {
      if (errorePaziente) {
        risposta.statusCode = 500;
        risposta.statusMessage = "Errore di connessione con il db";
        risposta.send({
          result: "error",
          message: "Errore nell'esecuzione della query",
        });
        return;
      }

      if (!Array.isArray(risultatiPaziente) || risultatiPaziente.length === 0) {
        risposta
          .status(404)
          .send({ result: "error", message: "Paziente non trovato" });
        return;
      }

      inserisciConIdPaziente(risultatiPaziente[0].ID);
    },
  );
});

app.get("/prenotazioni", (richiesta, risposta) => {
  const utenteSessione = richiesta.session?.utente;
  const idUtente = Number(utenteSessione?.idUtente || 0);

  if (!idUtente) {
    risposta.status(401).send({ result: "unauthorized" });
    return;
  }

  const isAdmin =
    String(utenteSessione?.amministratore || "")
      .trim()
      .toUpperCase() === "S";
  const isDottore =
    String(utenteSessione?.dottore || "")
      .trim()
      .toUpperCase() === "S";

  const selectBase = `SELECT pr.*, 
                       d.PrezzoVisita AS PrezzoVisita,
                       u.Nome AS NomeDottore,
                       u.Cognome AS CognomeDottore,
                       u.Genere AS GenereDottore,
               u.Email AS EmailDottore,
               u.Telefono AS TelefonoDottore,
                       up.Nome AS NomePaziente,
                       up.Cognome AS CognomePaziente,
                       r.Reparto AS RepartoDottore
                   FROM Prenotazioni pr
                   JOIN Pazienti p ON pr.IDPaziente = p.ID
                   JOIN Utenti up ON p.IDUtente = up.ID
                   JOIN Dottori d ON pr.IDDottore = d.ID
                   JOIN Utenti u ON d.IDUtente = u.ID
                   JOIN Reparti r ON d.IDReparto = r.ID
                   WHERE p.ValPaziente = ' '
                     AND up.ValUtente = ' '
                     AND d.ValDottore = ' '
                     AND u.ValUtente = ' '
                     AND r.ValReparto = ' '
                     `;

  const query = isAdmin
    ? `${selectBase} ORDER BY pr.DataOra ASC`
    : isDottore
      ? `${selectBase} AND d.IDUtente = ? ORDER BY pr.DataOra ASC`
      : `${selectBase} AND p.IDUtente = ? ORDER BY pr.DataOra ASC`;

  const queryParams = isAdmin ? [] : [idUtente];

  connection.query(query, queryParams, (error, results) => {
    if (error) {
      risposta.statusCode = 500;
      risposta.statusMessage = "Errore di connessione con il db";
      risposta.send({
        result: "error",
        message: "Errore nell'esecuzione della query",
      });
    } else {
      risposta.send({ result: "success", prenotazioni: results });
    }
  });
});

app.get("/pazientiPrenotati", (richiesta, risposta) => {
  const utenteSessione = richiesta.session?.utente;
  const idUtente = Number(utenteSessione?.idUtente || 0);

  if (!idUtente) {
    risposta.status(401).send({ result: "unauthorized" });
    return;
  }

  const isAdmin =
    String(utenteSessione?.amministratore || "")
      .trim()
      .toUpperCase() === "S";
  const isDottore =
    String(utenteSessione?.dottore || "")
      .trim()
      .toUpperCase() === "S";

  if (!isAdmin && !isDottore) {
    risposta.status(403).send({ result: "forbidden" });
    return;
  }

  const query = isAdmin
    ? `SELECT DISTINCT p.ID AS IDPaziente,
                          up.Nome AS NomePaziente,
                          up.Cognome AS CognomePaziente
                   FROM Prenotazioni pr
                   JOIN Pazienti p ON pr.IDPaziente = p.ID
                   JOIN Utenti up ON p.IDUtente = up.ID
                   WHERE p.ValPaziente = ' '
                     AND up.ValUtente = ' '
                   ORDER BY up.Cognome, up.Nome`
    : `SELECT DISTINCT p.ID AS IDPaziente,
                          up.Nome AS NomePaziente,
                          up.Cognome AS CognomePaziente
                   FROM Prenotazioni pr
                   JOIN Dottori d ON pr.IDDottore = d.ID
                   JOIN Pazienti p ON pr.IDPaziente = p.ID
                   JOIN Utenti up ON p.IDUtente = up.ID
                   WHERE d.IDUtente = ?
                     AND d.ValDottore = ' '
                     AND p.ValPaziente = ' '
                     AND up.ValUtente = ' '
                   ORDER BY up.Cognome, up.Nome`;

  const queryParams = isAdmin ? [] : [idUtente];

  connection.query(query, queryParams, (error, results) => {
    if (error) {
      risposta.statusCode = 500;
      risposta.statusMessage = "Errore di connessione con il db";
      risposta.send({
        result: "error",
        message: "Errore nell'esecuzione della query",
      });
    } else {
      risposta.send({ result: "success", pazienti: results });
    }
  });
});

app.post("/pagaPrenotazione", (richiesta, risposta) => {
  const utenteSessione = richiesta.session?.utente;
  const idUtente = getIdUtenteDaRichiesta(richiesta);
  if (!idUtente) {
    risposta.status(401).send({ result: "unauthorized" });
    return;
  }
  const isDottore =
    String(utenteSessione?.dottore || "")
      .trim()
      .toUpperCase() === "S";

  const query = isDottore
    ? 'UPDATE Prenotazioni pr JOIN Dottori d ON pr.IDDottore = d.ID SET pr.Pagata = "S" WHERE pr.ID = ? AND d.IDUtente = ?'
    : 'UPDATE Prenotazioni SET Pagata = "S" WHERE ID = ?';
  const idPrenotazione = richiesta.body.idPrenotazione;
  if (!idPrenotazione) {
    risposta
      .status(400)
      .send({ result: "error", message: "ID prenotazione mancante" });
    return;
  }
  const queryParams = isDottore ? [idPrenotazione, idUtente] : [idPrenotazione];

  connection.query(query, queryParams, (error, results) => {
    if (error) {
      risposta.statusCode = 500;
      risposta.statusMessage = "Errore di connessione con il db";
      risposta.send({
        result: "error",
        message: "Errore nell'esecuzione della query",
      });
    } else if (isDottore && Number(results?.affectedRows || 0) === 0) {
      risposta.status(403).send({ result: "forbidden" });
    } else {
      risposta.send({ result: "success", prenotazione: results });
    }
  });
});

app.post("/annullaPrenotazione", (richiesta, risposta) => {
  const utenteSessione = richiesta.session?.utente;
  const idUtente = getIdUtenteDaRichiesta(richiesta);
  if (!idUtente) {
    risposta.status(401).send({ result: "unauthorized" });
    return;
  }

  const isDottore =
    String(utenteSessione?.dottore || "")
      .trim()
      .toUpperCase() === "S";

  const idPrenotazione = richiesta.body.idPrenotazione;
  if (!idPrenotazione) {
    risposta
      .status(400)
      .send({ result: "error", message: "ID prenotazione mancante" });
    return;
  }

  const query = isDottore
    ? "UPDATE Prenotazioni pr JOIN Dottori d ON pr.IDDottore = d.ID SET pr.ValPrenotazione = 'A' WHERE pr.ID = ? AND d.IDUtente = ?"
    : "UPDATE Prenotazioni SET ValPrenotazione = 'A' WHERE ID = ?";
  console.log("/annullaPrenotazione", richiesta.body);

  const queryParams = isDottore ? [idPrenotazione, idUtente] : [idPrenotazione];

  connection.query(query, queryParams, (error, results) => {
    if (error) {
      risposta.statusCode = 500;
      risposta.statusMessage = "Errore di connessione con il db";
      risposta.send({
        result: "error",
        message: "Errore nell'esecuzione della query",
      });
    } else if (isDottore && Number(results?.affectedRows || 0) === 0) {
      risposta.status(403).send({ result: "forbidden" });
    } else {
      risposta.send({ result: "success", prenotazione: results });
    }
  });
});

app.post("/ripristinaPrenotazione", (richiesta, risposta) => {
  const utenteSessione = richiesta.session?.utente;
  const idUtente = Number(utenteSessione?.idUtente || 0);
  if (!idUtente) {
    risposta.status(401).send({ result: "unauthorized" });
    return;
  }

  const isAdmin =
    String(utenteSessione?.amministratore || "")
      .trim()
      .toUpperCase() === "S";
  const isDottore =
    String(utenteSessione?.dottore || "")
      .trim()
      .toUpperCase() === "S";

  if (!isAdmin && !isDottore) {
    risposta.status(403).send({ result: "forbidden" });
    return;
  }

  const idPrenotazione = richiesta.body.idPrenotazione;
  if (!idPrenotazione) {
    risposta
      .status(400)
      .send({ result: "error", message: "ID prenotazione mancante" });
    return;
  }

  const query = isAdmin
    ? "UPDATE Prenotazioni SET ValPrenotazione = ' ' WHERE ID = ?"
    : "UPDATE Prenotazioni pr JOIN Dottori d ON pr.IDDottore = d.ID SET pr.ValPrenotazione = ' ' WHERE pr.ID = ? AND d.IDUtente = ?";
  console.log("/ripristinaPrenotazione", richiesta.body);

  const queryParams = isAdmin ? [idPrenotazione] : [idPrenotazione, idUtente];

  connection.query(query, queryParams, (error, results) => {
    if (error) {
      risposta.statusCode = 500;
      risposta.statusMessage = "Errore di connessione con il db";
      risposta.send({
        result: "error",
        message: "Errore nell'esecuzione della query",
      });
    } else if (isDottore && Number(results?.affectedRows || 0) === 0) {
      risposta.status(403).send({ result: "forbidden" });
    } else {
      risposta.send({ result: "success", prenotazione: results });
    }
  });
});

app.post("/logout", (richiesta, risposta) => {
  if (!richiesta.session) {
    risposta.status(200).send({ result: "success" });
    return;
  }

  richiesta.session.destroy((err) => {
    if (err) {
      console.error("Errore logout:", err);
      risposta
        .status(500)
        .send({
          result: "error",
          message: "Impossibile terminare la sessione",
        });
      return;
    }

    risposta.clearCookie("connect.sid"); // cambiare se hai un nome cookie personalizzato
    console.log("/logout");
    risposta.send({ result: "success" });
  });
});

app.post("/datiPrenotazione", (richiesta, risposta) => {
  const idUtente = getIdUtenteDaRichiesta(richiesta);
  if (!idUtente && !(richiesta.session?.amministratore === "S")) {
    risposta.status(401).send({ result: "unauthorized" });
    return;
  }
  const body = richiesta.body || {};
  const idPrenotazione = body.idPrenotazione;
  if (!idPrenotazione) {
    risposta
      .status(400)
      .send({ result: "error", message: "ID prenotazione mancante" });
    return;
  }
  console.log("/datiPrenotazione", richiesta.body);
  const query = `SELECT pr.*,
                        d.PrezzoVisita AS PrezzoVisita,
                        u.Nome AS NomeDottore,
                        u.Cognome AS CognomeDottore,
                        u.Email AS EmailDottore,
                        u.Telefono AS TelefonoDottore,
                        r.Reparto AS RepartoDottore
                        FROM Prenotazioni pr
                        JOIN Pazienti p ON pr.IDPaziente = p.ID
                        JOIN Dottori d ON pr.IDDottore = d.ID
                        JOIN Utenti u ON d.IDUtente = u.ID
                        JOIN Reparti r ON d.IDReparto = r.ID
                        WHERE pr.ID = ?
                        AND pr.ValPrenotazione = ' '
                        AND p.ValPaziente = ' '
                        AND d.ValDottore = ' '
                        AND u.ValUtente = ' '
                        AND r.ValReparto = ' '`;
  connection.query(query, [idPrenotazione], (error, results) => {
    if (error) {
      risposta.statusCode = 500;
      risposta.statusMessage = "Errore di connessione con il db";
      risposta.send({
        result: "error",
        message: "Errore nell'esecuzione della query",
      });
    } else {
      risposta.send({ result: "success", prenotazione: results[0] });
    }
  });
});

app.post("/modificaPrenotazione", (richiesta, risposta) => {
  let idUtente = getIdUtenteDaRichiesta(richiesta);
  if (!idUtente && !(richiesta.session?.amministratore === "S")) {
    risposta.status(401).send({ result: "unauthorized" });
    return;
  }
  const body = richiesta.body || {};
  const idPrenotazione = body.idPrenotazione;
  const dataOra = body.dataOra;
  const tipoVisita = body.tipoVisita;
  if (!idPrenotazione || !dataOra || !tipoVisita) {
    risposta
      .status(400)
      .send({
        result: "error",
        message: "Dati prenotazione mancanti o non validi",
      });
    return;
  }
  console.log("/modificaPrenotazione", richiesta.body);
  const query = `UPDATE Prenotazioni
                   SET DataOra = ?, TipoVisita = ?
                   WHERE ID = ?`;
  connection.query(
    query,
    [dataOra, tipoVisita, idPrenotazione],
    (error, results) => {
      if (error) {
        risposta.statusCode = 500;
        risposta.statusMessage = "Errore di connessione con il db";
        risposta.send({
          result: "error",
          message: "Errore nell'esecuzione della query",
        });
      } else {
        risposta.send({ result: "success", prenotazione: results });
      }
    },
  );
});

app.get("/pazienti", (richiesta, risposta) => {
  const utenteSessione = richiesta.session?.utente;
  const idUtente = Number(getIdUtenteDaRichiesta(richiesta) || 0);
  console.log("Tentativo /pazienti");
  if (!idUtente) {
    risposta.status(401).send({ result: "unauthorized" });
    console.log("non autorizzato");
    return;
  }

  const isAdmin =
    String(utenteSessione?.amministratore || "")
      .trim()
      .toUpperCase() === "S";
  if (!isAdmin) {
    risposta.status(403).send({ result: "forbidden" });
    return;
  }
  console.log("Esecuzione /pazienti", richiesta);
  const query = `SELECT 
                        p.ID AS IDPaziente,
                        u.Nome,
                        u.Cognome
                    FROM Pazienti p
                    INNER JOIN Utenti u ON p.IDUtente = u.ID;`;

  connection.query(query, (error, results) => {
    if (error) {
      risposta.statusCode = 500;
      risposta.statusMessage = "Errore di connessione con il db";
      risposta.send({
        result: "error",
        message: "Errore nell'esecuzione della query",
      });
    } else {
      risposta.send({ result: "success", pazienti: results });
    }
  });
});
