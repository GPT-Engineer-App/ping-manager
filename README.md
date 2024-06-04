# ping-manager

#import for graphical interface
import sys
from PyQt5.QtWidgets import QApplication, QWidget, QPushButton, QVBoxLayout, QHBoxLayout, QLabel, QFileDialog,QTableWidget, QTableWidgetItem, QDialog
#import for ping
from re import findall
from subprocess import Popen, PIPE
import time
from PyQt5.QtCore import QCoreApplication
import os
#import for db
import sqlite3
from datetime import datetime

import socket

############I PULSANTI SONO GENERATI SEGUENDO LA SEQUENZA LOGICA##########

INTERVAL_PING = 100 #interval for automatic ping
ping_count = 3
test = ""
test_file = ""

HOSTS = ['169.254.151.205']  # Lista degli indirizzi IP dei Raspberry Pi
PORT = 65432          # Deve essere la stessa porta del server,Numero di porta su cui il server è in ascolto per le connessioni in arrivo
INTERVAL = 200  # Intervallo di tempo in secondi (24h)
SAVE_PATH = "/Users/francesco.bonforte/Desktop/cartella/"  # Percorso per salvare il file ricevuto
global status
status_file = [] 

########PING#####
def ping(host,ping_count):
    
    # Ottieni il percorso della directory corrente del file Python
    current_directory = os.path.dirname(__file__)
    file_path_ping = os.path.join(current_directory, "state_ping.txt")
    ###########
    'per ora sovrascrive,chiedere se va bene o dobbiamo lasciare i vecchi'
    ###########
    file = open(file_path_ping, 'w') #file in cui salvo lo stato del ping di ogni diodo 
    
    global test
    print("ping cliccato")
    for ip in host: #controlla con il ciclo tutti gli IP in nodes
            data = ""
            output= Popen(f"ping {ip} -n {ping_count}", stdout=PIPE, encoding="utf-8") #-c per linux, linea di comando

            for line in output.stdout:
                data = data + line
                ping_test = findall("TTL", data)

            if ping_test:
                print(f"{ip} : Successful Ping")
                test = "Successful Ping"
                file.write(f"{ip} : Successful Ping \n")
            else:
                print(f"{ip} : Failed Ping")
                file.write(f"{ip} : Failed Ping \n")
                test = "Failed Ping"
    file.close()

    #while True:
    #    ping(host,ping_count)
    #    print(f"Attesa di {INTERVAL_PING} secondi prima della prossima richiesta...")
    #     time.sleep(INTERVAL_PING)

#########RICHIESTA FILE ESTERNO#########
def check_file_in_directory(directory, filename):
    
    global test_file
    # Ottieni la lista dei file nella directory
    files_in_directory = os.listdir(directory)
    
    # Verifica se il file è presente nella lista dei file
    if filename in files_in_directory:
        print(f"Il file '{filename}' è presente nella cartella '{directory}'.")
        test_file = "File presente"
        return True
    else:
        print(f"Il file '{filename}' non è presente nella cartella '{directory}'.")
        test_file = "File non presente"
        return False


#####RICHIESTA FILE A RASPBERRY##########
def file_request_raspberry(HOSTS):
    print("Richiesta file raspberry")
    output_messages = ""  # Stringa per memorizzare i messaggi di output
    status_file = [] # Matrice per memorizzare lo stato per ogni host
    for host in HOSTS:  # Itera su ogni host nella lista HOSTS
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.connect((host, PORT))
                print(f"Connesso al server {host}:{PORT}")
                output_messages += f"Connesso al server {host}:{PORT}\n"
                s.sendall(b'SEND FILE')
                file_path = SAVE_PATH + f'received_file_{host}.txt'  # nome che viene dato al file quando viene ricevuto
                with open(file_path, 'wb') as f:
                    while True:
                        data = s.recv(1024)
                        if not data:
                            break
                        f.write(data)
                print(f'File ricevuto e salvato con successo su {file_path}')
                output_messages += f'File ricevuto e salvato con successo su {file_path}\n'
                status = 1  # se ricevo il file, dizionario
                status_file.append([host, status])
        except Exception as e:
            print(f"Errore durante la richiesta del file da {host}: {e}")
            output_messages += f"Errore durante la richiesta del file da {host}: {e}\n"
            status = 0
            status_file.append([host, status])

    return status_file, output_messages

    #print(f"Attesa di {INTERVAL} secondi prima della prossima richiesta...")
    #time.sleep(INTERVAL)
    
def get_data(status_file):
    # Simuliamo il recupero dei dati da qualche parte
    #data = {'Nome': 'Marco', 'Età': 30, 'Città': 'Roma'}
    return status_file    
#####UPDATE DB##########
def db_update():
    print("Richiesta update db")
    output_messages_db = "" 
    # Connessione al database
    conn = sqlite3.connect('esempio3.db')
    cursor = conn.cursor()
    # Elimina la tabella se esiste già
    cursor.execute("DROP TABLE IF EXISTS MyDataBase")

    # Creazione della tabella
    cursor.execute('''CREATE TABLE MyDataBase
                      (ID INTEGER PRIMARY KEY AUTOINCREMENT, IP INTEGER, posizione TEXT, data_str TEXT, ora_str TEXT, conteggi REAL, coeff_taratura REAL, dose REAL)''')

    # Verifica se la tabella è stata creata correttamente
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='MyDataBase'")
    tabella_esiste = cursor.fetchone()

    if tabella_esiste:
        output_messages_db += f"La tabella 'MyDataBase' è stata creata correttamente.\n"
        print("La tabella 'MyDataBase' è stata creata correttamente.")
    else:
        output_messages_db += f"Errore durante la creazione della tabella 'MyDataBase'.\n"
        print("Errore durante la creazione della tabella 'MyDataBase'.")

    # Elenco dei file di tipo 1
    directory = r'C:\Users\francesco.bonforte\Desktop\cartella' #file proveniente dal raspberry
    directory1 = r'C:\Users\francesco.bonforte\Desktop\cartella\file_ext' #file_esterno
    files_di_tipo1 = [file for file in os.listdir(directory) if file.endswith('.txt')]

    # Itera su ciascun file di tipo 1 e inserisci i dati corrispondenti nel database
    for file_di_tipo1 in files_di_tipo1:
        with open(os.path.join(directory, file_di_tipo1), 'r') as file1, open(os.path.join(directory1,'file_esterno.txt'), 'r') as file2:
            dati2 = {}  # Dizionario per memorizzare i dati da 'dati2.txt'

            # Leggi i dati dal secondo file e memorizzali nel dizionario
            for line in file2:
                IP, posizione, taratura = line.strip().split(',')
                dati2[IP] = (posizione, taratura)

            # Leggi i dati dal primo file e associa i valori di taratura e posizione utilizzando l'IP
            for line in file1:
                IP, data_str, ora_str, conteggi = line.strip().split(',')
                posizione, taratura = dati2.get(IP, ('N/D', 'N/D'))

                # Converti la stringa data e ora in un oggetto datetime
                data_ora_str = f"{data_str} {ora_str}"
                data_ora = datetime.strptime(data_ora_str, '%d-%m-%Y %H:%M:%S')
                data_str = data_ora.strftime('%d-%m-%Y')
                ora_str = data_ora.strftime('%H:%M:%S')
                
                #calcolo la dose
                dose = float(taratura) * float(conteggi)
                
                # Esegui l'inserimento nel database
                cursor.execute("INSERT INTO MyDataBase (IP, posizione, data_str, ora_str, conteggi, coeff_taratura, dose) VALUES (?, ?, ?, ?, ?, ?, ?)",
                               (int(IP), posizione, data_str, ora_str, float(conteggi), float(taratura), float(dose)))
        conn.commit()
        output_messages_db += f"Dati del file '{file_di_tipo1}' inseriti con successo nel database.\n"
        print(f"Dati del file '{file_di_tipo1}' inseriti con successo nel database.")

    # Chiusura della connessione
    conn.close()
    return output_messages_db
def release_button():
    button.setEnabled(True)  # Riabilita il pulsante
#####SHOW DATA########
def show_data():
    print("show data")
    
##nel momento in cui clicco sul tasto "mostra stato dati", si apre una finestra secndaria
class TableDialog(QDialog):
    def __init__(self, status_file):
        super().__init__()
        self.status_file = status_file
        self.initUI()

    def initUI(self):
        self.setWindowTitle('Stato file')

        # Crea una QTableWidget e imposta il numero di righe e colonne
        self.tableWidget = QTableWidget()
        # Set the number of rows and columns based on the matrix
        self.tableWidget.setRowCount(len(self.status_file))
        self.tableWidget.setColumnCount(len(self.status_file[0]) if self.status_file else 0)

        # Populate the table with the matrix data
        for row, rowData in enumerate(self.status_file):
            for col, value in enumerate(rowData):
                self.tableWidget.setItem(row, col, QTableWidgetItem(str(value)))

        # Crea un layout verticale per la finestra di dialogo e aggiungi la tabella
        layout = QVBoxLayout()
        layout.addWidget(self.tableWidget)
        self.setLayout(layout)
   
class MainWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.initUI()

    def initUI(self):
        self.setStyleSheet("background-color: hsla(230, 95%, 75%, 0.85);") #colore layout
        
        #Nome finestra
        self.setWindowTitle('Gestione Diodi')
        #Dimensione finestra
        self.setGeometry(800, 800, 1000, 700)
        # Creazione di un layout verticale
        layout = QVBoxLayout()
        # Creazione di un layout orizzontale per il ping button e il suo label
        ping_layout = QHBoxLayout()       
        # Layout verticale principale
        layout = QVBoxLayout()
        
        #####PING####
        # Layout orizzontale per il pulsante di ping, lo stato ping e il rettangolo bianco
        ping_layout = QHBoxLayout()      
        # Pulsante per il ping
        self.ping_button = QPushButton('Esegui Ping', self)
        self.ping_button.clicked.connect(self.ping_button_clicked)
        self.ping_button.setFixedSize(300, 50)
        # Rettangolo bianco per visualizzare lo stato del ping
        self.ping_status_rect = QLabel("", self)
        self.ping_status_rect.setStyleSheet("background-color: white; border: 1px solid black;")
        self.ping_status_rect.setFixedSize(300, 50)  # Imposta le dimensioni del rettangolo
        # Aggiungi il pulsante e il rettangolo bianco al layout orizzontale
        ping_layout.addWidget(self.ping_button)
        ping_layout.addWidget(self.ping_status_rect)
        # Aggiungi il layout orizzontale al layout verticale principale
        layout.addLayout(ping_layout)
        
        #LETTURA FILE ESTERNO
        check_file_in_directory_layout = QHBoxLayout() 
        self.check_file_in_directory_button = QPushButton('Esegui Richiesta File Esterno', self)
        self.check_file_in_directory_button.clicked.connect(self.check_file_in_directory_button_clicked)
        self.check_file_in_directory_button.setFixedSize(300, 50)
        
        self.check_file_in_directory_rect = QLabel("", self)
        self.check_file_in_directory_rect.setStyleSheet("background-color: white; border: 1px solid black;")
        self.check_file_in_directory_rect.setFixedSize(300, 50)
        
        check_file_in_directory_layout.addWidget(self.check_file_in_directory_button)
        check_file_in_directory_layout.addWidget(self.check_file_in_directory_rect)

        layout.addLayout(check_file_in_directory_layout)
        
        layout.addWidget(self.check_file_in_directory_button)
        
        #RICHIESTA FILE RASPBERRY
        file_request_layout = QHBoxLayout() 
        self.file_request_raspberry_button = QPushButton('Esegui Richiesta File Raspberry', self)
        self.file_request_raspberry_button.clicked.connect(self.file_request_raspberry_button_clicked)
        self.file_request_raspberry_button.setFixedSize(300, 50)
        
        self.file_request_rect = QLabel("", self)
        self.file_request_rect.setStyleSheet("background-color: white; border: 1px solid black;")
        self.file_request_rect.setFixedSize(600, 50)
        
        file_request_layout.addWidget(self.file_request_rect)
        file_request_layout.addWidget(self.file_request_raspberry_button)
        layout.addLayout(file_request_layout)
        
        #AGGIORNA DB
        db_layout = QHBoxLayout() 
        self.db_update_button = QPushButton('Aggiorna Db', self)
        self.db_update_button.clicked.connect(self.db_update_button_clicked)
        self.db_update_button.setFixedSize(300, 50)

        self.db_rect = QLabel("", self)
        self.db_rect.setStyleSheet("background-color: white; border: 1px solid black;")
        self.db_rect.setFixedSize(600, 200)
        
        db_layout.addWidget(self.db_rect)
        db_layout.addWidget(self.db_update_button)
        layout.addLayout(db_layout)
        
        layout.addWidget(self.db_update_button)
        
        #SHOW DATA
        self.show_data_button = QPushButton('Show data', self)
        self.show_data_button.clicked.connect(self.show_data_button_clicked)
        layout.addWidget(self.show_data_button)
        self.show_data_button.setFixedSize(300, 50)
    
    
        # Crea un pulsante per visualizzare la tabella
        self.showTableButton = QPushButton('Mostra stato file',self)
        self.showTableButton.clicked.connect(self.showTable)
        layout.addWidget(self.showTableButton)
        self.showTableButton.setFixedSize(300, 50)

        # Imposta il layout della finestra principale
        self.setLayout(layout)
        self.setWindowTitle('Esempio di GUI con tabella')
        
        # Aggiunta del pulsante per bloccare i processi
        self.stop_button = QPushButton(' Exit ', self)
        self.stop_button.clicked.connect(self.stop_button_clicked)
        layout.addWidget(self.stop_button)
        self.stop_button.setFixedSize(300, 50)
        
        # Aggiungi un altro pulsante per sbloccare il primo
        unlock_button = QPushButton('Sblocca', self)
        unlock_button.clicked.connect(release_button)
        
        # Aggiunta del pulsante al layout,dove lo metto nella finestra
        #il layout è stato creato come un layout verticale (QVBoxLayout)
        #e il pulsante viene aggiunto a questo layout. Quindi, il pulsante verrà posizionato all'interno della finestra,
        #seguendo il layout verticale.

        
        # Impostazione del layout principale della finestra
        #Questo comando imposta il layout appena creato (layout) come layout principale della finestra. Ciò significa che il
        #layout verrà utilizzato per organizzare tutti gli elementi all'interno della finestra. Quando si imposta il layout
        #principale della finestra, tutti gli elementi aggiunti alla finestra tramite
        #il layout saranno automaticamente posizionati e ridimensionati in base alle specifiche del layout.
        self.setLayout(layout)
        

   # def showTable(self,status_file):
   #     data = status_file  # get_data()
   #     # Crea una finestra di dialogo per la tabella e passa il dizionario come parametro
   #     tableDialog = TableDialog(data)
   #     tableDialog.exec_()
        
    def showTable(self): #,status_file):
        # Example matrix data
        status_file = [
            ["File1", "Received"],
            ["File2", "Pending"],
            ["File3", "Error"],
            ["File3", "Error"]
        ]
        tableDialog = TableDialog(status_file)
        tableDialog.exec_()
        
    def ping_button_clicked(self):
        host = ["169.254.151.205"]
        ping(host, ping_count)
        self.ping_status_rect.setText(f"Stato Ping: {test}")
        
    def check_file_in_directory_button_clicked(self):
        directory_path = "/Users/francesco.bonforte/Desktop/cartella/file_ext"
        file_name = "file_esterno.txt"
        check_file_in_directory(directory_path, file_name)
        self.check_file_in_directory_rect.setText(f"{test_file}")
        
    def file_request_raspberry_button_clicked(self):
        # Parametri del client,se ne ho più di uno
        HOSTS = ['169.254.151.205']  # Lista degli indirizzi IP dei Raspberry Pi
        PORT = 65432          # Deve essere la stessa porta del server,Numero di porta su cui il server è in ascolto per le connessioni in arrivo
        INTERVAL = 200  # Intervallo di tempo in secondi (24h)
        output_messages = file_request_raspberry(HOSTS)
        #SAVE_PATH = '\Desktop/' # Percorso per salvare il file ricevuto, FORSE BISOGNA FARE UN CONTROLLO SULLA PRESENZA DEL FILE E STAMPARE IL MESSAGGIO D'ERORE
        file_request_raspberry(HOSTS)
        #self.file_request_rect.setText(output_messages)
        
    def db_update_button_clicked(self):
        db_update()
        output_messages_db = db_update()
        self.db_rect.setText(output_messages_db)
        self.update()
        ###oppure si puo mettere un controllo su tutti gli step e stampare sulla GUI solo se tutto è andato bene o no
    
    def show_data_button_clicked(self,status_file):
        print(status_file)
        show_data()
        
    def stop_button_clicked(self):
        # Blocca tutti i processi
        QCoreApplication.instance().quit()
        
#####CREAZIONE INTERFACCIA######
if __name__ == '__main__':
    # Creazione dell'applicazione Qt
    app = QApplication(sys.argv)
    # Creazione della finestra principale
    window = MainWindow()
    # Visualizzazione della finestra
    window.show()
    # Esecuzione dell'applicazione Qt
    sys.exit(app.exec_())


## Collaborate with GPT Engineer

This is a [gptengineer.app](https://gptengineer.app)-synced repository 🌟🤖

Changes made via gptengineer.app will be committed to this repo.

If you clone this repo and push changes, you will have them reflected in the GPT Engineer UI.

## Tech stack

This project is built with React and Chakra UI.

- Vite
- React
- Chakra UI

## Setup

```sh
git clone https://github.com/GPT-Engineer-App/ping-manager.git
cd ping-manager
npm i
```

```sh
npm run dev
```

This will run a dev server with auto reloading and an instant preview.

## Requirements

- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
