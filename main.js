const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let secondWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');

    secondWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    secondWindow.loadURL('http://127.0.0.1:8080');
    secondWindow.webContents.executeJavaScript(`
        window.electron.receive('translate2', (translatedText) => {
            
                console.log(translatedText);
                document.querySelector('textarea.textarea-bordered.w-full').value = translatedText;

        });
    `);
    setInterval(() => {
        secondWindow.webContents.executeJavaScript(`
            var theobj=document.querySelectorAll('.chat-bubble.markdown.chat-bubble-base-300');
            var xxx = [];
            theobj.forEach(domobj => {
                    const innerText = domobj.innerText;
                    xxx.push(innerText);
                });
                xxx;
            `)
            .then(theobj => {
                mainWindow.webContents.executeJavaScript(`
                    var table = document.getElementById('main');
                    if (table.rows.length > 0) {
                        table.deleteRow(-1);
                    }
                    var newRow = table.insertRow();
                    var newCell = newRow.insertCell(0);
                    var xxxx = ${JSON.stringify(theobj[theobj.length - 1])};
                    newCell.innerText = xxxx;
                    //gen random id
                    newCell.id = Math.random().toString(36).substring(7);
                    translateText(xxxx,(ans)=>{
                        document.getElementById(newCell.id).innerText = ans;
                        });
                `);
            })
            .catch(err => {
                console.error('Failed to get HTML content:', err);
            });
    }, 2000);
});

ipcMain.on('translate', (event, result) => {
    secondWindow.webContents.send('translate2', result);
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});