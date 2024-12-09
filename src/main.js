const invoke = window.__TAURI__.invoke,
    dialog = window.__TAURI__.dialog,
    shell = window.__TAURI__.shell,
    fs = window.__TAURI__.fs,
    path = window.__TAURI__.path,
    {WebviewWindow, appWindow} = window.__TAURI__.window,
    {listen} = window.__TAURI__.event,
    mainWindow = WebviewWindow.getByLabel('main'),
    helpWindow = WebviewWindow.getByLabel('helpWindow'),
    historyWindow = WebviewWindow.getByLabel('historyWindow'),
    notificationWindow = WebviewWindow.getByLabel('notification'),
    inputHour = document.getElementById('hour'),
    inputMinute = document.getElementById('minute'),
    inputSecond = document.getElementById('second'),
    notificationSecond = document.getElementById("notificationSecond"),
    notificationMinute = document.getElementById("notificationMinute"),
    submitForm = document.getElementById("submitForm"),
    timerDiv = document.getElementById("nextHour"),
    myAudio = document.getElementById("myAudio");

let slideIndex = 1,
    historyData = [],
    myDate,
    isDone,
    activeNotification = false,
    notificationTime,
    myTimeout,
    handler,
    target,
    hr, mn, sc, 
    hours, minutes, seconds,
    resourcePath,
    notificationMessage = 0,
    generatedText;
    
function testAlert(){
    alert('Sukses');
}

async function main(){
    invoke('auto_launch', {status: true});
    console.log(path.resourceDir());

    const historyFile = await fs.exists('./OcuSafe/OcuSafe_Data.csv', { dir: path.BaseDirectory.Document });
    await Promise.resolve(historyFile).then((value) => {
        console.log("History Data exist: " + value);
        if(value == false){
            console.log("Creating history data file");
            fs.createDir('OcuSafe', { dir: path.BaseDirectory.Document, recursive: true });
            fs.writeTextFile("OcuSafe/OcuSafe_Data.csv", 'tanggal,waktu,durasi,istirahat\n', {dir: path.BaseDirectory.Document});
        }
    });

    const configFile = await fs.exists('./OcuSafe/config.json', { dir: path.BaseDirectory.Document });
    await Promise.resolve(configFile).then((value) => {
        console.log("Config File exist: " + value);
        if(value == false){
            console.log("Creating config file");
            fs.createDir('OcuSafe', { dir: path.BaseDirectory.Document, recursive: true });
            fs.writeTextFile("OcuSafe/config.json", '{\n\t"timer":1200,\n\t"duration":20\n}', {dir: path.BaseDirectory.Document});
        } else{
            const readConfig = fs.readTextFile('./OcuSafe/config.json', {dir: path.BaseDirectory.Document});
            Promise.resolve(readConfig).then((value) => {
                const appConfig = JSON.parse(value);
                inputHour.value = Math.trunc(appConfig["timer"] / 3600);
                inputMinute.value = Math.trunc((appConfig["timer"] - inputHour.value * 3600) / 60);
                inputSecond.value = Math.trunc((appConfig["timer"] - inputHour.value * 3600 - inputMinute.value * 60));
                notificationMinute.value = Math.trunc((appConfig["duration"] / 60));
                notificationSecond.value = Math.trunc((appConfig["duration"] -  notificationMinute.value * 60));
            });
        }
    });
    
    appWindow.center();
    appWindow.setFocus();
    showSlides();
    autoChangeSlide();
    getUptime();
    firstTest();
}
main();

function reloadImage(){
    document.getElementById("video1").src = "https://img.youtube.com/vi/7zpoBxVLE6U/maxresdefault.jpg?" + new Date().getTime();
    document.getElementById("video2").src = "https://img.youtube.com/vi/CRLAUIgu-HI/maxresdefault.jpg?" + new Date().getTime();
    document.getElementById("video3").src = "https://img.youtube.com/vi/6WgmnJIVl7Y/maxresdefault.jpg?" + new Date().getTime();
}

function testImage(url) {
    const imgPromise = new Promise(function imgPromise(resolve, reject) {
        const imgElement = new Image();
        imgElement.addEventListener('load', function imgOnLoad() {
            resolve(this);
        });

        imgElement.addEventListener('error', function imgOnError() {
            reject();
        })

        imgElement.src = url;
    });
    return imgPromise;
}

function firstTest(){
    testImage("https://img.youtube.com/vi/7zpoBxVLE6U/maxresdefault.jpg?"+ new Date().getTime()).then(
        function fulfilled(img) {
            console.log("Online");
            reloadImage();
        },
        function rejected() {
            console.log("Offline");
            setTimeout(() => {
                firstTest();
            }, 10000);
        }
    );
}

function getUptime(){
    setInterval(() => {
        invoke('get_uptime').then((message) => {
            let ut_sec = message;
            let ut_min = ut_sec / 60;
            let ut_hour = ut_min / 60;
    
            ut_sec = Math.floor(ut_sec);
            ut_min = Math.floor(ut_min);
            ut_hour = Math.floor(ut_hour);
    
            ut_hour = ut_hour % 60;
            ut_min = ut_min % 60;
            ut_sec = ut_sec % 60;
            
            if(ut_hour < 10){
                ut_hour = '0' + ut_hour;
            }
            if(ut_min < 10){
                ut_min = '0' + ut_min;
            }
            if(ut_sec < 10){
                ut_sec = '0' + ut_sec;
            }
            totalUpTime = ut_hour + ':' + ut_min + ':' + ut_sec;
            document.getElementById("showUpTime").innerHTML = totalUpTime;
        });
    }, 1000);
}

function actionButton(getElementId){
    if(getElementId == 'closeButton'){
        mainWindow.hide();
    } else if(getElementId == 'minimizeButton'){
        mainWindow.minimize();
    } else if(getElementId == 'helpButton'){
        const helpView = new WebviewWindow('helpWindow', {
            url: 'help.html',
            title: 'OcuSafe Help',
            width: 400,
            height: 600,
            fullscreen: false,
            center: true,
            resizable: false,
            maximizable: false,
            closable: true,
            decorations: false,
            transparent: true
        });
        helpView.once('window_loaded', e => {
            helpView.emit('set_as_panel', 'helpWindow');
        });
        helpView.once('tauri://error', async function (e) {
            if(helpWindow){
              await helpWindow.setFocus();
            }
        });
    }
    // else if(getElementId == 'historyButton'){
    //     const historyView = new WebviewWindow('historyWindow', {
    //         url: 'history.html',
    //         title: 'OcuSafe History',
    //         width: 500,
    //         height: 600,
    //         fullscreen: false,
    //         center: true,
    //         resizable: false,
    //         maximizable: false,
    //         closable: true,
    //         decorations: false
    //     });
    //     historyView.once('window_loaded', e => {
    //         historyView.emit('set_as_panel', 'historyWindow');
    //     });
    //     historyView.once('tauri://error', async function (e) {
    //         if(historyWindow){
    //           await historyWindow.setFocus();
    //         }
    //     });
    // }
}

async function saveData(isDone, myDate){
    const history = {
        tanggal: myDate.toLocaleDateString('en-GB'),
        waktu: myDate.toTimeString().split(" ")[0],
        durasi: notificationMinute.value.toString() + ":" + notificationSecond.value.toString(),
        istirahat: isDone
    }
    historyData.push(history);
    const currentData = history.tanggal + ',' + history.waktu + ',' + history.durasi + ',' + history.istirahat + '\n';
    await fs.writeTextFile("OcuSafe/OcuSafe_Data.csv", currentData, {dir: path.BaseDirectory.Document, append: true});
}

function sendTimer(notificationTime){
    let timeLeft = notificationTime;
    if(timeLeft > -1){
        invoke('send_timer', {notificationTime: timeLeft, window: notificationWindow, message: generatedText[notificationMessage]});
        timeLeft--;
        setTimeout(() => {
            sendTimer(timeLeft);
        }, 1000);
    }
}

async function notifyMe(){
    myDate = new Date();
    activeNotification = true;
    await myAudio.play();
    const notifview = await new WebviewWindow('notification', {
        url: 'notification.html',
        title: 'OcuSafe Notification',
        width: 600,
        height: 300,
        skipTaskbar: true,
        fullscreen: false,
        center: true,
        resizable: false,
        maximizable: false,
        closable: true,
        alwaysOnTop: true,
        decorations: false,
    });
    await notifview.once('window_loaded', e => {
        notifview.emit('set_as_panel', 'notification');
    });
    await notifview.once('tauri://error', async function (e) {
        if(notificationWindow){
          await notificationWindow.setFocus();
        }
    });
    notificationTime = ((60 * parseInt(notificationMinute.value)) + parseInt(notificationSecond.value));
    sendTimer(notificationTime);
}

function init() { 
    // set the target date time with the counter values
    target = new Date;
    // counters more then 24h should have a date setup or it wont work
    target.setHours(hours);
    target.setMinutes(minutes);
    target.setSeconds(seconds);
    target.setMilliseconds(0); // make sure that miliseconds is 0
    timerDiv.innerHTML = target.toTimeString().split(" ")[0]; // print the value
}

function restartTimer(){
    hours = hr;
    minutes = mn;
    seconds = sc;
    handler = setInterval(updateTimer, 1000);
    init();
}

function updateTimer() {
    let time = target.getTime();
    if(activeNotification == false){
        target.setTime(time - 1000); // subtract 1 second with every thick
    }
    timerDiv.innerHTML = target.toTimeString().split(" ")[0];
    if (
        target.getHours() === 0 &&
        target.getMinutes() === 0 &&
        target.getSeconds() === 0
    ) { // counter should stop
        notifyMe();
        clearInterval(handler);
        restartTimer();
    }
}

function submited() {
    hr = inputHour.value; 
    mn = inputMinute.value;
    sc = inputSecond.value;

    if((parseInt(hr)*3600+parseInt(mn)*60+parseInt(sc)) >= 3600){
        generatedText = [
            "Saklar Otak",
            "8 Tidur",
            "Putaran Leher",
            "Burung Hantu"
        ];
    } else{
        generatedText = [
            "Waktunya mengistirahatkan mata sejenak!!",
            "Alihkan pandanganmu dari komputer selama 20 detik!!",
            "Lakukan gerakan senam mana untuk istirahat kali ini!!",
            "Kali ini lakukan gerakan 8 tidur!!"
        ];
    }

    console.log(generatedText);
    hours = hr;
    minutes = mn;
    seconds = sc;
    clearInterval(handler);
    handler = setInterval(updateTimer, 1000);
    init();
}

function isChecked(){
    notificationTime = ((60 * parseInt(notificationMinute.value)) + parseInt(notificationSecond.value));
    console.log(notificationTime);
    document.getElementById('submitForm').blur();
    if(submitForm.checked == true){
        if(
            inputHour.value < 0 ||
            inputHour.value > 23 ||
            inputMinute.value < 0 ||
            inputMinute.value > 59 ||
            inputSecond.value < 0 ||
            inputSecond.value > 59
        ){
            dialog.message('Waktu invalid.', { title: 'Invalid Time', type: 'warning' });
            submitForm.checked = false;
        } else if(
            inputMinute.value % 1 != 0 ||
            inputSecond.value % 1 != 0 ||
            inputHour.value % 1 != 0
        ){
            dialog.message('Waktu invalid.', { title: 'Invalid Time', type: 'warning' });
            submitForm.checked = false;
        } else if(
            notificationTime <= 0 ||
            notificationSecond.value % 1 != 0 ||
            notificationMinute.value % 1 != 0
        ){
            dialog.message('Waktu notifikasi invalid.', { title: 'Invalid Time', type: 'warning' });
            submitForm.checked = false;
        } else if(
            inputMinute.value == 0 &&
            inputSecond.value == 0 &&
            inputHour.value == 0
        ){
            dialog.message('Waktu invalid.', { title: 'Invalid Time', type: 'warning' });
            submitForm.checked = false;
        } else{
            submitForm.checked = true;
            document.activeElement.blur();
            submited();
            
            let totalSecond = (parseInt(inputHour.value) * 3600) + (parseInt(inputMinute.value) * 60) + (parseInt(inputSecond.value));
            let totalDuration = (parseInt(notificationMinute.value) * 60) + (parseInt(notificationSecond.value));
            
            fs.writeTextFile("OcuSafe/config.json", '{\n\t"timer":' + totalSecond + ',\n\t"duration":' + totalDuration + '\n}', {dir: path.BaseDirectory.Document});
        }
    } else if(submitForm.checked == false){
        clearInterval(handler);
        timerDiv.innerHTML = '00:00:00';
    }
}

function uncheckButton() {
    submitForm.checked = false;
    isChecked();
}

function padNumber(getElementId){
    let result = '',
        targeted_length = 2,
        number = document.getElementById(getElementId).value,
        idElement = document.getElementById(getElementId),
        strNum = number.toString();
    if(strNum.length < targeted_length) {
        let padding = new Array(targeted_length - strNum.length + 1).join('0');
        result = padding + strNum;
        idElement.value = result;
    }
}

function showSlides() {
    let i;
    let slides = document.getElementsByClassName("mySlides");
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";  
    }
    if(slideIndex > slides.length) {
        slideIndex = 1;
    }
    if(slideIndex < 1){
        slideIndex = slides.length;
    }
    slides[slideIndex-1].style.display = "block";
}

function changeSlides(elementId) {
    if(elementId == 'prevSlide'){
        showSlides(slideIndex -= 1);
    } else if(elementId == 'nextSlide'){
        showSlides(slideIndex += 1);
    }
    clearMyTimeout();
}

function autoChangeSlide(){
    myTimeout = setTimeout(() => {
        showSlides(slideIndex += 1);
        clearMyTimeout();
    }, 5000);
}

function clearMyTimeout(){
    clearTimeout(myTimeout);
    autoChangeSlide();
}

function openLink(elementId){
  if (elementId == 'video1'){
    shell.open("https://www.youtube.com/watch?v=7zpoBxVLE6U");
  } else if (elementId == 'video2'){
    shell.open("https://www.youtube.com/watch?v=CRLAUIgu-HI");
  } else if (elementId == 'video3'){
    shell.open("https://www.youtube.com/watch?v=6WgmnJIVl7Y");
  }
}

notificationSecond.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        submitForm.click();
    }
});

notificationMinute.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        notificationSecond.focus();
    }
});

inputSecond.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        submitForm.click();
    }
});

inputMinute.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        inputSecond.focus();
    }
});

inputHour.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        inputMinute.focus();
    }
});

listen('done-verification', (event) => {
    isDone = event.payload.message;
    if(isDone == false){
        notifyMe();
    } else{
        activeNotification = false;
        notificationMessage++;
        if(notificationMessage > (generatedText.length)-1){
            notificationMessage = 0;
        }
    }
    saveData(isDone, myDate);
});