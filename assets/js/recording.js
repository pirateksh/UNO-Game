var MEDIA_RECORDER = undefined;
let video_recoding = document.getElementById("id_recorded_video");
var chunks;
function start_recording() {
    let canvas = document.querySelector("canvas");
    let recorded_video = document.getElementById("id_recorded_video");
    let stream = canvas.captureStream(25);
    MEDIA_RECORDER = new MediaRecorder(stream);
    chunks = [];
    MEDIA_RECORDER.start();
    alert("Recoding Started");
    console.log(MEDIA_RECORDER.state);

    MEDIA_RECORDER.ondataavailable = (ev) => {
        chunks.push(ev.data);
    };
    MEDIA_RECORDER.onstop = (ev) => {
        let blob = new Blob(chunks, {'type': 'video/mp4'});
        chunks = [];
        let videoURL = window.URL.createObjectURL(blob);
        video_recoding.src = videoURL;
    };
}

function stop_recording() {
    if(MEDIA_RECORDER === undefined){
        alert("No Recording being recorded...");
        return;
    }
    MEDIA_RECORDER.stop();
    alert("Recoding Stopped");
    console.log(MEDIA_RECORDER.state);
}

