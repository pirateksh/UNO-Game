let MEDIA_RECORDER = undefined;
let video_recoding = document.getElementById("id_recorded_video");
let chunks;

function start_recording() {
    $('#id_start_btn').prop('disabled', true);
    $('#id_stop_btn').prop('disabled', false);
    $('#id_pause_btn').prop('disabled', false);
    let canvas = document.querySelector("canvas");
    let recorded_video = document.getElementById("id_recorded_video");
    let stream = canvas.captureStream();
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
        alert("Recording is ready to be Downloaded");
        chunks = [];
        let videoURL = window.URL.createObjectURL(blob);
        video_recoding.src = videoURL;
        // video_recoding.srcObject = blob;
    };
}

function pause_recording(){
    $('#id_pause_btn').prop('disabled', true);
    $('#id_resume_btn').prop('disabled', false);
    if(MEDIA_RECORDER === undefined){
        alert("No Recording being recorded...");
    }
    else if(MEDIA_RECORDER.state === "recording"){
        MEDIA_RECORDER.pause();
        alert("Recoding Paused");
        console.log(MEDIA_RECORDER.state);
    }
    else if(MEDIA_RECORDER.state === "paused"){
        alert("Recording is already paused...");
    }
    else if(MEDIA_RECORDER.state === "inactive"){
        alert("Video was stopped already.");
    }
}

function resume_recording(){
    $('#id_pause_btn').prop('disabled', false);
    $('#id_resume_btn').prop('disabled', true);
    if(MEDIA_RECORDER === undefined){
        alert("No recording being recorded...");
    }
    else if(MEDIA_RECORDER.state === "recording"){
        alert("Video is already in progress...");
    }
    else if(MEDIA_RECORDER.state === "inactive"){
        alert("Video was stopped already.");
    }
    else if(MEDIA_RECORDER.state === "paused"){
        MEDIA_RECORDER.resume();
        alert("Recoding Resumed");
        console.log(MEDIA_RECORDER.state);
    }
}

function stop_recording() {
    $('#id_start_btn').prop('disabled', false);
    $('#id_pause_btn').prop('disabled', true);
    $('#id_resume_btn').prop('disabled', true);
    $('#id_stop_btn').prop('disabled', true);
    if(MEDIA_RECORDER === undefined){
        alert("No Recording being recorded...");
        return;
    }
    if(MEDIA_RECORDER.state !== "inactive"){
        MEDIA_RECORDER.stop();
        alert("Recoding Stopped");
        console.log(MEDIA_RECORDER.state);
    }
    $('id_start_btn').prop('disabled', false);
    $('id_stop_btn').prop('disabled', true);
}

