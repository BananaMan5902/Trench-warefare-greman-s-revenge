const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.height = 900; // expanded vertically

let kills = 0;
let units = [];
let enemyUnits = [];
let bullets = [];
let selected = [];

const noMansLandStart = 450;
const noMansLandEnd = 750;

const trenches = [
    {x:150,width:80,side:"player"},
    {x:350,width:80,side:"player"},
    {x:850,width:80,side:"enemy"},
    {x:1050,width:80,side:"enemy"}
];

function drawTrenches(){
    trenches.forEach(t=>{
        ctx.fillStyle = t.side==="player" ? "#3b2f2f" : "#2f3b3b";
        ctx.fillRect(t.x,0,t.width,canvas.height);
    });

    // No Man's Land gap
    ctx.fillStyle = "#6b8e23";
    ctx.fillRect(noMansLandStart,0,noMansLandEnd-noMansLandStart,canvas.height);
}

class Unit{
    constructor(type,x,y,side="player"){
        this.type = type;
        this.x = x;
        this.y = y;
        this.side = side;
        this.hp = 100;
        this.targetX = x;
        this.targetY = y;
        this.reload = 0;
        this.radius = type==="tank"?16:8;
        this.range = this.getRange();
        this.damage = this.getDamage();
    }

    getRange(){
        if(this.type==="mg") return 220;
        if(this.type==="flame") return 100;
        if(this.type==="tank") return 180;
        return 150;
    }

    getDamage(){
        if(this.type==="mg") return 8;
        if(this.type==="flame") return 20;
        if(this.type==="tank") return 25;
        return 12;
    }

    update(){
        let dx = this.targetX - this.x;
        let dy = this.targetY - this.y;
        let dist = Math.hypot(dx,dy);

        if(dist>2){
            this.x += dx/dist;
            this.y += dy/dist;
        }

        if(this.reload>0) this.reload--;

        // Tank logic: only attack trenches
        if(this.type==="tank"){
            let targetTrench = trenches.find(t=>t.side!==this.side && Math.abs(this.x - t.x)<20);
            if(targetTrench){
                targetTrench.x += this.side==="player"?0.05:-0.05;
            }
        }

        // Find enemies in range
        let targets = this.side==="player" ? enemyUnits : units;
        targets.forEach(t=>{
            let d = Math.hypot(this.x-t.x,this.y-t.y);
            if(d<this.range && this.reload===0){
                shoot(this,t);
                this.reload = 60;
            }
        });
    }

    draw(){
        ctx.beginPath();
        ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);
        ctx.fillStyle = this.side==="player"?"yellow":"brown";
        ctx.fill();

        // Draw gun direction
        ctx.beginPath();
        ctx.moveTo(this.x,this.y);
        ctx.lineTo(this.x+10,this.y);
        ctx.strokeStyle="black";
        ctx.stroke();
    }
}

function shoot(shooter,target){
    bullets.push({
        x:shooter.x,
        y:shooter.y,
        target:target,
        damage:shooter.damage,
        side:shooter.side
    });
}

function spawnEnemy(){
    let trench = trenches.find(t=>t.side==="enemy");
    enemyUnits.push(new Unit("rifle",trench.x+40,Math.random()*canvas.height,"enemy"));
}

setInterval(spawnEnemy,4000);

canvas.addEventListener("mousedown",e=>{
    selected=[];
    let rect = canvas.getBoundingClientRect();
    let x = e.clientX-rect.left;
    let y = e.clientY-rect.top;

    units.forEach(u=>{
        if(Math.hypot(u.x-x,u.y-y)<10){
            selected.push(u);
        }
    });
});

canvas.addEventListener("click",e=>{
    let rect = canvas.getBoundingClientRect();
    let x = e.clientX-rect.left;
    let y = e.clientY-rect.top;

    selected.forEach(u=>{
        u.targetX = x;
        u.targetY = y;
    });
});

function update(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    drawTrenches();

    units.forEach((u,i)=>{
        u.update();
        u.draw();
        if(u.hp<=0) units.splice(i,1);
    });

    enemyUnits.forEach((u,i)=>{
        u.update();
        u.draw();
        if(u.hp<=0){
            enemyUnits.splice(i,1);
            kills++;
        }
    });

    bullets.forEach((b,i)=>{
        let dx = b.target.x - b.x;
        let dy = b.target.y - b.y;
        let dist = Math.hypot(dx,dy);

        if(dist<5){
            let inTrench = trenches.some(t=>b.target.x>t.x && b.target.x<t.x+t.width);
            let damage = inTrench ? b.damage*0.5 : b.damage;
            b.target.hp -= damage;
            bullets.splice(i,1);
        }else{
            b.x += dx/dist*5;
            b.y += dy/dist*5;
            ctx.fillStyle="black";
            ctx.fillRect(b.x,b.y,3,3);
        }
    });

    requestAnimationFrame(update);
}

function buyUnit(type){
    units.push(new Unit(type,200,canvas.height/2,"player"));
}

update();
