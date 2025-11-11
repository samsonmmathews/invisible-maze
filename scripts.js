// Simple invisible maze: generate a random perfect maze on an odd-grid
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const rows = 21; // odd numbers -> corridor/cell pattern
const cols = 21;
const cellSize = Math.floor(Math.min(canvas.width/cols, canvas.height/rows));
const debugToggle = document.getElementById('debug');
const statsEl = document.getElementById('stats');
const overlay = document.getElementById('overlay');
const flashEl = document.getElementById('flash');

let grid; // 2D array: 0 = passage, 1 = wall
let player = {x:1,y:1};
const start = {x:1,y:1};
const goal = {x:cols-2,y:rows-2};
let moves = 0, hits = 0;
// fog-of-war: numeric visibility (0..1) per cell — allows falloff so distant cells reveal less
let seen; // numeric 2D array
const SIGHT = 3; // sight radius (Manhattan); increase to see more

function makeGrid(r,c){
  const g = Array.from({length:r},()=>Array(c).fill(1));
  // carve cells at odd coords
  function carve(cx,cy){
    g[cy][cx]=0;
    const dirs = shuffle([[2,0],[-2,0],[0,2],[0,-2]]);
    for(const [dx,dy] of dirs){
      const nx = cx+dx, ny = cy+dy;
      if(nx>0 && nx<c && ny>0 && ny<r && g[ny][nx]===1){
        g[cy+dy/2][cx+dx/2]=0; // knock down wall between
        carve(nx,ny);
      }
    }
  }
  carve(start.x,start.y);
  g[goal.y][goal.x]=0;
  return g;
}

// Fisher-Yates shuffle
function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]
  }
  return arr;
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // draw debug/full maze if requested
  if(debugToggle.checked){
    ctx.fillStyle='#0d2230';
    for(let y=0;y<rows;y++){
      for(let x=0;x<cols;x++){
        if(grid[y][x]===1){
          ctx.fillRect(x*cellSize,y*cellSize,cellSize,cellSize);
        }
      }
    }
    // show goal when debugging
    ctx.fillStyle='rgba(124,227,168,0.12)';
    ctx.fillRect(goal.x*cellSize,goal.y*cellSize,cellSize,cellSize);
  } else {
    // draw only seen areas (fog-of-war) with alpha falloff
    for(let y=0;y<rows;y++){
      for(let x=0;x<cols;x++){
        const v = seen[y][x] || 0; // 0..1
        if(v <= 0) continue; // still fogged

        // draw faint floor for seen passage cells so player knows explored area
        ctx.fillStyle = `rgba(12,30,44,${0.18 * v})`;
        ctx.fillRect(x*cellSize,y*cellSize,cellSize,cellSize);

        if(grid[y][x]===1){
          // walls drawn with stronger alpha but still scaled by visibility
          ctx.fillStyle = `rgba(13,34,48,${0.9 * v})`;
          ctx.fillRect(x*cellSize,y*cellSize,cellSize,cellSize);
        }
      }
    }

    // goal visible only once sufficiently revealed
    if((seen[goal.y][goal.x] || 0) >= 0.35){
      ctx.fillStyle='rgba(124,227,168,0.12)';
      ctx.fillRect(goal.x*cellSize,goal.y*cellSize,cellSize,cellSize);
    }
  }

  // draw player (always fully visible)
  const px = player.x*cellSize + cellSize/2;
  const py = player.y*cellSize + cellSize/2;
  // subtle halo to indicate lighted area
  ctx.beginPath();
  const halo = ctx.createRadialGradient(px,py,0,px,py,cellSize*2.2);
  halo.addColorStop(0, 'rgba(124,227,168,0.10)');
  halo.addColorStop(1, 'rgba(124,227,168,0.01)');
  ctx.fillStyle = halo;
  ctx.fillRect(px - cellSize*2.2, py - cellSize*2.2, cellSize*4.4, cellSize*4.4);

  ctx.beginPath();
  ctx.fillStyle='#7ce3a8';
  ctx.arc(px,py,cellSize*0.34,0,Math.PI*2);
  ctx.fill();
  ctx.lineWidth=2; ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.stroke();
}

// reveal cells around (cx,cy) within SIGHT (Manhattan) — marks them as seen
function reveal(cx,cy){
  // set numeric visibility with linear falloff (center = 1, at SIGHT -> small > 0)
  for(let y=0;y<rows;y++){
    for(let x=0;x<cols;x++){
      const dist = Math.abs(x-cx) + Math.abs(y-cy);
      if(dist <= SIGHT){
        // linear falloff: dist=0 -> 1, dist=SIGHT -> ~1/(SIGHT+1)
        const vis = Math.max(0, (SIGHT - dist + 1) / (SIGHT + 1));
        seen[y][x] = Math.max(seen[y][x] || 0, vis);
      }
    }
  }
}

function tryMove(dx,dy){
  const nx = player.x+dx, ny = player.y+dy;
  // bounds
  if(nx<0||ny<0||nx>=cols||ny>=rows)return;
  if(grid[ny][nx]===1){
    hits++;
    flash();
    updateStats();
    return; // blocked
  }
  player.x=nx;player.y=ny;moves++;updateStats();draw();
  // reveal around new position
  reveal(player.x, player.y);
  draw();

  if(player.x===goal.x && player.y===goal.y){
    win();
  }
}

function flash(){
  flashEl.style.opacity=1;
  setTimeout(()=>flashEl.style.opacity=0,140);
}

function win(){
  overlay.innerHTML = '';
  const box = document.createElement('div');
  box.className='toast win';
  box.textContent = `You win! Moves: ${moves} · Hits: ${hits}`;
  overlay.appendChild(box);
  // allow restart
  setTimeout(()=>{const b=document.createElement('button');b.textContent='Play again';b.className='btn';b.onclick=reset;box.appendChild(document.createElement('br'));box.appendChild(b);},150);
}

function reset(){
  overlay.innerHTML='';moves=0;hits=0;player={x:start.x,y:start.y};
  grid=makeGrid(rows,cols);
  // initialize numeric seen map
  seen = Array.from({length:rows},()=>Array(cols).fill(0));
  reveal(start.x, start.y);
  updateStats();draw();
}

function updateStats(){
  statsEl.textContent = `Moves: ${moves} · Hits: ${hits}`;
}

// keyboard handling: step movement
window.addEventListener('keydown', (e)=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
    e.preventDefault();
    if(e.key==='ArrowUp') tryMove(0,-1);
    if(e.key==='ArrowDown') tryMove(0,1);
    if(e.key==='ArrowLeft') tryMove(-1,0);
    if(e.key==='ArrowRight') tryMove(1,0);
  }
});

document.getElementById('reset').addEventListener('click',reset);
debugToggle.addEventListener('change',draw);

// initialize
grid = makeGrid(rows,cols);
seen = Array.from({length:rows},()=>Array(cols).fill(0));
reveal(start.x, start.y);
updateStats();draw();
