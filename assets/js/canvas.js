var canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var c = canvas.getContext('2d');

// c.fillStyle = 'rgba(255, 0, 0, 0.5)';
// c.fillRect(100, 100, 100, 100);
// c.fillStyle = 'rgba(134, 64, 0, 0.5)'; 
// c.fillRect(200, 200, 100, 100);
// c.fillStyle = 'blue';
// c.fillRect(300, 300, 100, 100);

// console.log(canvas);

// // line
// c.beginPath();
// c.moveTo(50, 300);
// c.lineTo(300, 100);
// c.lineTo(400, 300);
// // c.strokeStyle = "orange";
// c.closePath();
// c.stroke();

// Arc/circle
// c.beginPath();
// c.arc(600, 600, 30, 0, Math.PI *2, false);
// c.stroke();

gsap.fromTo('#text2', {x:Math.abs(Math.random()-0.5)*innerWidth, y:-80}, {x:innerWidth, y:innerHeight+80, duration:6, repeat:-1, ease:'linear'})
gsap.fromTo('#text3', {x:Math.abs(Math.random()-0.5)*innerWidth, y:-80}, {x:innerWidth, y:innerHeight+80, duration:6, repeat:-1, ease:'linear'})
gsap.fromTo('#text1', {x:Math.random()*innerWidth, y:-80}, {y:innerHeight+40, duration:6, repeat:-1, ease:'linear'})
gsap.fromTo('#text4', {x:Math.random()*innerWidth, y:-80}, {y:innerHeight+40, duration:6, repeat:-1, ease:'linear'})

// for (var i =0; i<100; i++){
//     var x = Math.random()*window.innerWidth;
//     var y = Math.random()*window.innerHeight;
//     var r_a = Math.random()*255;
//     var g_a = Math.random()*255;
//     var b_a = Math.random()*255;
//     c.beginPath();
//     var a = 'rgb('+r_a+', '+g_a+', '+b_a+')';
//     console.log(a);
//     c.strokeStyle = a;
//     c.arc(x, y, 40, 0, Math.PI*2, true);
//     c.stroke();
// }

var mouse = {
    x:undefined,
    y:undefined,
}

var maxRad = 40;
var minRad = 0;

var colArr = [ 
    '#F2F0D8',
    '#F2EFBD',
    '#F2C3A7',
    '#FFBC47',
    '#F65E5D',
];

window.addEventListener('mousemove', (event) => {
    mouse.x = event.x;
    mouse.y = event.y;
    // console.log(mouse);
})

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    init(); 
})

class Circle {
    constructor(x, y, dx, dy, rad) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.rad = rad;
        this.minRad = rad;
        this.col = colArr[Math.floor(Math.random()*colArr.length)];
    }

    draw = () => {
        c.beginPath();
        c.arc(this.x, this.y, this.rad, 0, Math.PI *2, false);
        c.fillStyle = this.col;
        c.fill();
    }

    update = () => {
        if(this.x+this.rad>innerWidth || this.x-this.rad<0){
            this.dx = -this.dx;
        }
    
        if(this.y+this.rad>innerHeight || this.y-this.rad<0){
            this.dy = -this.dy;
        }
    
        this.x+=this.dx;
        this.y+=this.dy;

        // interactivity
        if(Math.abs(mouse.x - this.x) < 30 && Math.abs(mouse.y - this.y) < 30) {
            if(this.rad < maxRad) this.rad += 2;
        }
        else{
            this.rad -= 2;
            if(this.rad < this.minRad) this.rad += 2;
        }

        this.draw();
    }
}
var circleArray = [];

const init = () => {
    circleArray = [];
    for(var i=0; i<((innerHeight/100)*(innerWidth/100))*2; i++){
        var rad = Math.random()*4+1;
        var x = Math.random()*(innerWidth-rad*2)+rad;
        var y = Math.random()*(innerHeight-rad*2)+rad;
        var dx = (Math.random()-0.5)*1;
        var dy = (Math.random()-0.5)*1;
        circleArray.push(new Circle(x, y, dx, dy, rad));
    }
}

console.log(circleArray);

const animate = ()=> {
    requestAnimationFrame(animate);
    c.clearRect(0, 0, innerWidth, innerHeight);
    for(var i=0; i<circleArray.length; i++){
        circleArray[i].update();
    }
    
}

animate();
init();

// document.body.style.background = "url(" + canvas.toDataURL() + ")";