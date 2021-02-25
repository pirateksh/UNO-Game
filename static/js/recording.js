let MEDIA_RECORDER = undefined;
let video_recoding = document.getElementById("id_recorded_video");
let chunks;
let VIDEO_COUNT = 1;
let BLOB_DATA_RECEIVED_COUNTER = 0;
let canvas;
let CanvasCaptureStream;
const AudioElementsFromCanvas = {}

async function start_recording() {
    $('#id_start_btn').prop('disabled', true);
    $('#id_stop_btn').prop('disabled', false);
    $('#id_pause_btn').prop('disabled', false);

    canvas = document.querySelector("canvas");
    CanvasCaptureStream = canvas.captureStream();

    Object.keys(peers).forEach(key => {
        console.log("hello", key, peers[key]);
    });
    
    await STREAM.then((mediaStream)=>{
        final_tracks = []
        Object.keys(peers).forEach(key => {
            if(peers[key] !== undefined){
                CanvasCaptureStream.addTrack(peers[key].remoteStream.getAudioTracks()[0]);
                console.log("Adding Audio Track for", key);
            }
        });
        
        if(AudioElementsFromCanvas["background"] !== undefined){
            CanvasCaptureStream.addTrack(AudioElementsFromCanvas["background"].getAudioTracks()[0])
        }

        // CanvasCaptureStream.addTrack(mediaStream.getAudioTracks()[0]);
        MEDIA_RECORDER = new MediaRecorder(CanvasCaptureStream);
        chunks = [];
        MEDIA_RECORDER.start(10000); // 10 seconds in ms, means ondataavailable event is called in every 10 secondsalert("Recoding Started for Video: " + VIDEO_COUNT);
        console.log("Recording Started:", MEDIA_RECORDER.state);
    });




    MEDIA_RECORDER.ondataavailable = (ev) => {

        console.log("On DataAvailable Fired...");
        chunks.push(ev.data);
        BLOB_DATA_RECEIVED_COUNTER += 1;

        if(BLOB_DATA_RECEIVED_COUNTER === 180){ // for 30 minutes
        // if(BLOB_DATA_RECEIVED_COUNTER === 3){

            BLOB_DATA_RECEIVED_COUNTER = 0;
            MEDIA_RECORDER.stop();
            MEDIA_RECORDER.start(10000);
        }
    };

    MEDIA_RECORDER.onstop = (ev) => {
        let blob = new Blob(chunks, {'type': 'video/webm'});
        // alert("Recording is ready to be Downloaded");
        chunks = [];
        let videoURL = window.URL.createObjectURL(blob);
        // let innerHTML = "download_link_" + VIDEO_COUNT;
        let d = new Date;
        let file_name = VIDEO_COUNT + "_UnoGame_Recording" + d.getDate() + "-" + d.getMonth() + "-" + d.getFullYear();
        $('#id_download_links').append(`<li><a id="${videoURL}" href="${videoURL}" download="${file_name}">${file_name}</a></li>`);
        VIDEO_COUNT += 1;

        // video_recoding.src = videoURL;
        // video_recoding.srcObject = blob;
    };

    // MEDIA_RECORDER.onstart = (ev) => {
    //     console.log("On Start Fired...");
    //     Object.keys(AudioElementsFromCanvas).forEach(key => {
    //         if(AudioElementsFromCanvas[key] !== undefined){
    //             CanvasCaptureStream.addTrack(AudioElementsFromCanvas[key].getAudioTracks()[0]);
    //             console.log("Adding Audio Track for Sound:", key);
    //         }
    //     });
    // };

}

function pause_recording(){
    $('#id_pause_btn').prop('disabled', true);
    $('#id_resume_btn').prop('disabled', false);
    if(MEDIA_RECORDER === undefined){
        alert("No Recording being recorded...");
    }
    else if(MEDIA_RECORDER.state === "recording"){
        MEDIA_RECORDER.pause();
        // alert("Recoding Paused");
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
        // alert("Recoding Resumed");
        console.log(MEDIA_RECORDER.state);
    }
}

function stop_recording() {
    $('#id_start_btn').prop('disabled', false);
    $('#id_pause_btn').prop('disabled', true);
    $('#id_resume_btn').prop('disabled', true);
    $('#id_stop_btn').prop('disabled', true);
    if(MEDIA_RECORDER === undefined){
        // alert("No Recording being recorded...");
        return;
    }
    if(MEDIA_RECORDER.state !== "inactive"){
        MEDIA_RECORDER.stop();
        // alert("Recoding Stopped for " + VIDEO_COUNT);
        console.log(MEDIA_RECORDER.state);
    }
    $('id_start_btn').prop('disabled', false);
    $('id_stop_btn').prop('disabled', true);
}