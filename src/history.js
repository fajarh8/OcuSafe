const {WebviewWindow} = window.__TAURI__.window,
    {listen} = window.__TAURI__.event,
    historyWindow = WebviewWindow.getByLabel('historyWindow'),
    invoke = window.__TAURI__.invoke;

function closeWindow(){
    invoke('close_window', {window: historyWindow});
}

async function main(){
    await listen('timer-send', (event) => {
        countdown = event.payload.message;
        if(countdown > 0){
            console.log(countdown);
            document.getElementById('showCountdown').innerHTML = "Relax in " + countdown + "s";
            //closeCountDown(countdown);
        } else{
            closeNotification();
        }
    });
}
main();