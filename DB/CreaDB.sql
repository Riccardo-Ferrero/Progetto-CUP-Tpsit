
CREATE TABLE IF NOT EXISTS Province (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Provincia VARCHAR(100) NOT NULL,
    Sigla CHAR(2) NOT NULL,
    ValProvincia CHAR(1)
);

CREATE TABLE IF NOT EXISTS Reparti (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Reparto VARCHAR(100) NOT NULL,
    ValReparto CHAR(1)
);

CREATE TABLE IF NOT EXISTS Toponimi (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Toponimo VARCHAR(50) NOT NULL,
    ValToponimo CHAR(1)
);

CREATE TABLE IF NOT EXISTS Comuni (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Comune VARCHAR(100) NOT NULL,
    IDProvincia INT NOT NULL,
    CAP CHAR(5) NOT NULL,
    ValComune CHAR(1),
    FOREIGN KEY (IDProvincia) REFERENCES Province(ID)
);

CREATE TABLE IF NOT EXISTS Utenti (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Nome VARCHAR(100) NOT NULL,
    Cognome VARCHAR(100) NOT NULL,
    DataNascita DATE NOT NULL,
    Genere CHAR(1),
    Telefono VARCHAR(15),
    Email VARCHAR(150) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    CodiceFiscale CHAR(16) NOT NULL UNIQUE,
    IdToponimo INT,
    Indirizzo VARCHAR(150),
    NCivico VARCHAR(10),
    Amministratore CHAR(1),
    IdComune INT NOT NULL,
    ValUtente CHAR(1),
    FOREIGN KEY (IdToponimo) REFERENCES Toponimi(ID),
    FOREIGN KEY (IdComune) REFERENCES Comuni(ID)
);

CREATE TABLE IF NOT EXISTS Pazienti (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    IDUtente INT NOT NULL UNIQUE,
    GruppoSanguigno VARCHAR(3),
    Peso DECIMAL(5,2),
    Altezza DECIMAL(5,2),
    ValPaziente CHAR(1),
    FOREIGN KEY (IDUtente) REFERENCES Utenti(ID)
);

CREATE TABLE IF NOT EXISTS Dottori (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    IDUtente INT NOT NULL UNIQUE,
    IDReparto INT NOT NULL,
    Ruolo VARCHAR(100),
    PrezzoVisita DECIMAL(8,2) NOT NULL,
    ValDottore CHAR(1),
    FOREIGN KEY (IDUtente) REFERENCES Utenti(ID),
    FOREIGN KEY (IDReparto) REFERENCES Reparti(ID)
);

CREATE TABLE IF NOT EXISTS Prenotazioni (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    IDPaziente INT NOT NULL,
    IDDottore INT NOT NULL,
    DataOra DATETIME NOT NULL,
    Pagata CHAR(1),
    ValPrenotazione CHAR(1),
    FOREIGN KEY (IDPaziente) REFERENCES Pazienti(ID),
    FOREIGN KEY (IDDottore) REFERENCES Dottori(ID)
);

CREATE TABLE IF NOT EXISTS Pagamenti (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    IDPrenotazione INT NOT NULL UNIQUE,
    DataPagamento DATETIME NOT NULL,
    MetodoPagamento VARCHAR(50) NOT NULL,
    IBAN VARCHAR(34),
    DataScadenzaCarta DATE,
    ValPagamento CHAR(1),
    FOREIGN KEY (IDPrenotazione) REFERENCES Prenotazioni(ID)
);