const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let kills = 0;
let units = [];
let enemyUnits = [];
let selected = [];
let lastFreeSpawn = 0;

const trenches = [
    {x:200,width:60},
    {x:400,width:60},
    {x:700,width:60},
    {x:950,width:60}
];

function drawTrenches(){
    trenches.forEach(t=>{
        ctx.fillStyle="#3b2f2f";
        ctx.fillRect(t.x,0,t.width,canvas.height);
    });
}

class Unit{
    constructor(type,x,y){
        this.type = type;
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.reload = 0;
        this.hp = 100;
        this.radius = 8;
        this.buff = 1;
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

        // Commander buff
        if(this.type==="commander"){
            units.forEach(u=>{
                let d = Math.hypot(u.x-this.x,u.y-this.y);
                if(d<80) u.buff = 1.1;
            });
        }

        // Tank logic
        if(this.type==="tank"){
            let trench = trenches.find(t=>Math.abs(this.x - t.x)<20);
            if(trench){
                trench.x += 0.05; // slowly destroys trench
            }
        }
    }

    draw(){
        ctx.beginPath();
        ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);
        ctx.fillStyle = this.type==="tank"?"gray":"yellow";
        ctx.fill();
    }
}

function spawnEnemy(){
    enemyUnits.push({
        x:1100,
        y:Math.random()*500+50,
        hp:50
    });
}

function update(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    drawTrenches();

    units.forEach(u=>{
        u.update();
        u.draw();
    });

    enemyUnits.forEach((e,i)=>{
        ctx.fillStyle="brown";
        ctx.fillRect(e.x,e.y,10,10);

        units.forEach(u=>{
            let d = Math.hypot(u.x-e.x,u.y-e.y);
            if(d<60 && u.reload===0){
                let damage = 10 * u.buff;

                // trench cover
                let inTrench = trenches.some(t=>u.x>t.x && u.x<t.x+t.width);
                if(inTrench) damage *= 0.5;

                e.hp -= damage;
                u.reload = 60;
            }
        });

        if(e.hp<=0){
            enemyUnits.splice(i,1);
            kills++;
            document.getElementById("kills").innerText = kills;
        }

        e.x -= 0.3;
    });

    // Free rifle soldiers every 30 sec
    if(Date.now()-lastFreeSpawn>30000){
        for(let i=0;i<10;i++){
            units.push(new Unit("rifle",100,100+i*10));
        }
        lastFreeSpawn = Date.now();
    }

    requestAnimationFrame(update);
}

canvas.addEventListener("click",e=>{
    let rect = canvas.getBoundingClientRect();
    let x = e.clientX-rect.left;
    let y = e.clientY-rect.top;

    selected.forEach(u=>{
        u.targetX = x;
        u.targetY = y;
    });
});

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

function buyUnit(type){
    const costs = {
        assault:2,
        flame:5,
        mg:10,
        tank:60
    };

    const caps = {
        assault:20,
        flame:5,
        mg:5,
        tank:3,
        commander:4,
        artillery:2
    };

    if(kills < (costs[type]||0)) return;

    if(units.filter(u=>u.type===type).length >= caps[type]) return;

    kills -= (costs[type]||0);
    document.getElementById("kills").innerText = kills;

    units.push(new Unit(type,100,300));
}

setInterval(spawnEnemy,3000);

update();
