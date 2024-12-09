const {appWindow, WebviewWindow, LogicalSize, currentMonitor, LogicalPosition} = window.__TAURI__.window,
    {listen} = window.__TAURI__.event,
    mainWindow = WebviewWindow.getByLabel('main'),
    notificationWindow = WebviewWindow.getByLabel('notification'),
    invoke = window.__TAURI__.invoke,
    dialog = window.__TAURI__.dialog;
 
let physicalScreenWidth,
    countdown, eventMessage;

function closeNotification(){
    invoke('close_window', {window: notificationWindow});
}

async function showDialog(){
    const done = dialog.ask('Apakah Anda sudah cukup beristirahat?', {title: 'OcuSafe', type: 'Konfirmasi'});
    await Promise.resolve(done).then((value) => {
        console.log(value);
        invoke('done_verification', {isDone: value, window: mainWindow});
    });
    
    closeNotification();
}

async function main(){
    const monitor = currentMonitor();
    const getScaleFactor = appWindow.scaleFactor();
    
    document.getElementById('showMessage').classList.add('pre-animation');
    document.getElementById('showCountdown').classList.add('pre-animation');
    Promise.resolve(monitor).then((value) => {
        const screenWidth = value.size.width;
        Promise.resolve(getScaleFactor).then((value) => {
            const windowScaleFactor = value;
            physicalScreenWidth = screenWidth / windowScaleFactor;
        });
    });

    await listen('timer-send', (event) => {
        countdown = event.payload.time;
        eventMessage = event.payload.message;
        if(countdown > 0){
            console.log(countdown);
            document.getElementById('showMessage').innerHTML = eventMessage;
            document.getElementById('showCountdown').innerHTML = "Istirahat selesai dalam " + countdown + " detik";
            setTimeout(function(){
                document.getElementById('showMessage').classList.remove('pre-animation');
                document.getElementById('showCountdown').classList.remove('pre-animation');
            },100)
        } 
        else{
            showDialog();
        }
    });
}
main();

async function resizeNotification(){
    document.body.innerHTML = '';
    await notificationWindow.setResizable(true);
    await notificationWindow.setSize(new LogicalSize(460, 80));
    await notificationWindow.setPosition(new LogicalPosition(physicalScreenWidth - 460, 0));
    
    document.body.innerHTML = '<div style="background-color: #C6DABF; width: 460px; height: 80px; padding: 14px 14px 0px 15px; display: flex;"><img src="assets/icon.ico" alt="OcuSafe Logo" style="width: 60px; height: 48px; padding-right: 10px; border-right: 3px solid black;"><div style="margin-left: 10px; margin-top: -15px"><p id="showMessage" style="border-bottom: 2px solid black; padding-bottom: 5px;"></p><p id="showCountdown" style="margin-top: -12px;"></p></div></div><script src="notification.js"></script>';
    document.getElementById('showMessage').classList.add('pre-animation');
    document.getElementById('showCountdown').classList.add('pre-animation');
    document.getElementById('showMessage').innerHTML = eventMessage;
    document.getElementById('showCountdown').innerHTML = "Istirahat selesai dalam " + countdown + " detik";
}