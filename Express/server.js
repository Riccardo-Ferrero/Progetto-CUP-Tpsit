var express = require("express");
var mysql = require("mysql")
var cors = require("cors")
var app = express();
var porta = 8081

app.use(cors());

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
app.get("/toponimi", (richiesta, risposta)=>{
    query = "SELECT * FROM toponimi";
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
    query = "SELECT * FROM province";
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
    query = "SELECT * FROM comuni WHERE IDProvincia = " + richiesta.body.idProvincia;
    console.log("/comuni", richiesta.body.idProvincia);
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