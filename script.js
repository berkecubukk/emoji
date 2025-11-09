// Emoji Escape - simple vanilla JS implementation
(function(){
  const SPAWN_MIN = 500; // ms
  const SPAWN_MAX = 1400; // ms
  const DIFFICULTY_INTERVAL = 10000; // every 10s
  const SCORE_INTERVAL = 1000; // +1 per second

  // define harmful vs beneficial emojis
  const HARMFUL = ['💣','🪨','🍄','👾','☄️'];
  const BENEFIT = ['🍕','🍎','🥩','🍗','🍍'];

  const $ = id => document.getElementById(id);

  // Player logic
  class Player {
    constructor(el, container){
      this.el = el;
      this.container = container;
      // start centered (account for element width)
      const containerWidth = this.container.clientWidth;
      const elWidth = this.el.offsetWidth || parseFloat(getComputedStyle(this.el).fontSize) * 1.2;
      this.x = Math.max(0, (containerWidth - elWidth) / 2);
      this.y = container.clientHeight - el.offsetHeight - (container.clientHeight*0.03);
      this.speed = 0.45; // px per ms
      this.vx = 0;
      this.updateDom();
    }
    setVelocity(dir){ this.vx = dir * this.speed; }
    step(dt){
      if(!dt) return;
      this.x += this.vx * dt;
      // clamp
      const min = 0;
      const max = this.container.clientWidth - this.el.offsetWidth;
      if(this.x < min) this.x = min;
      if(this.x > max) this.x = max;
      this.updateDom();
    }
    updateDom(){
      // Position via transform for smoother animation
      this.el.style.transform = `translateX(${Math.round(this.x)}px)`;
    }
    getRect(){ return this.el.getBoundingClientRect(); }
    centerX(){ return this.x + this.el.offsetWidth/2; }
  }

  // Falling object
  class FallingObject {
    constructor(container, emoji, speed, type='harmful'){
      this.container = container;
      this.el = document.createElement('div');
      this.el.className = 'falling';
      this.el.textContent = emoji;
      this.type = type;
      this.el.classList.add(type === 'benefit' ? 'benefit' : 'harmful');
      this.container.appendChild(this.el);
      this.speed = speed; // px per ms
      // random x
      const maxLeft = Math.max(0, container.clientWidth - 40);
      this.x = Math.random()*maxLeft;
      this.y = -40;
      this.el.style.left = `${this.x}px`;
      this.el.style.top = `${this.y}px`;
      this.removed = false;
    }
    step(dt, speedMultiplier){
      if(this.removed) return;
      this.y += this.speed * speedMultiplier * dt;
      this.el.style.transform = `translateY(${this.y}px)`;
      if(this.y > this.container.clientHeight + 50) this.remove();
    }
    remove(){
      if(this.removed) return;
      this.removed = true;
      this.el.remove();
    }
    getRect(){ return this.el.getBoundingClientRect(); }
  }

  // Game Manager
  class GameManager {
    constructor(){
      this.game = $('game');
      this.playerEl = $('player');
      this.startScreen = $('start-screen');
      this.gameOverScreen = $('game-over-screen');
      this.startBtn = $('start-btn');
      this.restartBtn = $('restart-btn');
      this.scoreEl = $('score');
      this.bestEl = $('best');
      this.startBestEl = $('start-best');
      this.finalScoreEl = $('final-score');
      this.finalBestEl = $('final-best');

      this.bestKey = 'emojiEscapeBest';
      this.best = parseInt(localStorage.getItem(this.bestKey) || '0', 10);
      this.bestEl.textContent = `Best: ${this.best}`;
      this.startBestEl.textContent = `Best: ${this.best}`;

  // health state
  this.maxHealth = 100;
  this.health = this.maxHealth;
  this.healthBar = $('health-bar');
  this.healthText = $('health-text');
  this.updateHealthUI();

      // character & difficulty UI
      this.charButtons = document.querySelectorAll('.char-btn');
      this.selectedChar = '🚀';
      this.charButtons.forEach((b, i)=>{
        if(i===0) b.classList.add('selected');
        b.addEventListener('click', ()=>{
          this.charButtons.forEach(x=>x.classList.remove('selected'));
          b.classList.add('selected');
          this.selectedChar = b.dataset.emoji;
        });
      });

      // difficulty defaults
      this.difficulty = 'normal';

      // level and shield
      this.level = 1;
      this.levelDuration = 60000; // 60s per level
      this.levelTimer = null;
      this.shielded = false;
      this.shieldTimeout = null;
      this.armorDuration = 30000; // 30s of protection

      this.bind();
      this.reset();
    }

    bind(){
      this.startBtn.addEventListener('click', ()=> this.start());
      this.restartBtn.addEventListener('click', ()=> this.start());
      // pause button
      const pauseBtn = $('pause-btn');
      pauseBtn.addEventListener('click', ()=>{
        if(this.paused) this.resume(); else this.pause();
      });

      // keyboard
      window.addEventListener('keydown', e=>{
        if(e.key === 'ArrowLeft') this.player && this.player.setVelocity(-1);
        if(e.key === 'ArrowRight') this.player && this.player.setVelocity(1);
      });
      window.addEventListener('keyup', e=>{
        if(e.key === 'ArrowLeft' || e.key === 'ArrowRight') this.player && this.player.setVelocity(0);
      });

      // touch swipe simple
      // Touch drag to move (mobile friendly). Use non-passive to allow preventDefault.
      let activeTouchId = null;
      this.game.addEventListener('touchstart', e=>{
        if(!this.player) return;
        const t = e.changedTouches[0];
        activeTouchId = t.identifier;
        this.handlePointerMove(t.clientX);
      }, {passive:false});
      this.game.addEventListener('touchmove', e=>{
        if(!this.player) return;
        for(const t of e.changedTouches){
          if(t.identifier === activeTouchId){
            this.handlePointerMove(t.clientX);
            e.preventDefault();
            break;
          }
        }
      }, {passive:false});
      this.game.addEventListener('touchend', e=>{
        for(const t of e.changedTouches){
          if(t.identifier === activeTouchId){ activeTouchId = null; this._pointerOffset = null; break; }
        }
      });

      // Pointer (mouse) drag support for desktop
      let pointerDown = false;
      this.game.addEventListener('pointerdown', e=>{
        pointerDown = true;
        // record starting offset so drag doesn't snap to left
        this._pointerOffset = e.clientX - this.game.getBoundingClientRect().left - this.player.x;
        this.handlePointerMove(e.clientX, true);
      });
      window.addEventListener('pointermove', e=>{
        if(pointerDown) this.handlePointerMove(e.clientX, true);
      });
      window.addEventListener('pointerup', ()=>{ pointerDown = false; this._pointerOffset = null; });

      // difficulty radio handlers
      const diffs = document.querySelectorAll('input[name="difficulty"]');
      diffs.forEach(d=> d.addEventListener('change', ()=>{
        if(d.checked) this.difficulty = d.value;
      }));
    }

    reset(){
      this.running = false;
      this.paused = false;
      this.objects = [];
      this.lastTime = null;
      this.spawnTimeout = null;
      this.score = 0;
      this.scoreTimer = null;
      this.speedMultiplier = 1;
      this.difficultyTimer = null;
      this.scoreEl.textContent = `Score: 0`;
    }

    start(){
      // clean old
      this.clearAllObjects();
      this.startScreen.classList.add('hidden');
      this.gameOverScreen.classList.add('hidden');
      // create player
      this.player = new Player(this.playerEl, this.game);
      this.score = 0;
      this.scoreEl.textContent = `Score: ${this.score}`;
      this.running = true;
      this.lastTime = performance.now();
      this.speedMultiplier = 1;
  // reset health
  this.health = this.maxHealth;
  this.updateHealthUI();

  // clear any hit-effect class
  this.game.classList.remove('hit-effect');
      // ensure player is centered on start
      if(this.player) {
        // set character emoji from selection (inner span)
        const inner = this.playerEl.querySelector('.player-inner');
        if(inner) inner.textContent = this.selectedChar;
        const cw = this.game.clientWidth;
        const ew = this.player.el.offsetWidth;
        this.player.x = Math.max(0, (cw - ew) / 2);
        this.player.updateDom();
      }

      // apply difficulty parameters
      if(this.difficulty === 'easy'){
        this.spawnMin = 700; this.spawnMax = 1600; this.benefitProb = 0.6; this.armorProb = 0.08; this.speedFactor = 0.9;
      } else if(this.difficulty === 'hard'){
        this.spawnMin = 350; this.spawnMax = 1100; this.benefitProb = 0.3; this.armorProb = 0.06; this.speedFactor = 1.2;
      } else { // normal
        this.spawnMin = 500; this.spawnMax = 1400; this.benefitProb = 0.45; this.armorProb = 0.08; this.speedFactor = 1.0;
      }

      // level start
      this.level = 1;
      this.updateLevelUI();
      this.game.classList.remove('level-1','level-2','level-3','level-4');
      this.game.classList.add(`level-${this.level}`);
      if(this.levelTimer) clearInterval(this.levelTimer);
      this.levelTimer = setInterval(()=> this.nextLevel(), this.levelDuration);

  this.scheduleNextSpawn();
      this.difficultyTimer = setInterval(()=>{
        this.speedMultiplier += 0.3 * this.speedFactor; // ramp up based on difficulty
      }, DIFFICULTY_INTERVAL);

      this.scoreTimer = setInterval(()=>{
        this.score += 1;
        this.scoreEl.textContent = `Score: ${this.score}`;
      }, SCORE_INTERVAL);

      // spawn an armor every 45s
      if(this.armorTimer) clearInterval(this.armorTimer);
      this.armorTimer = setInterval(()=> this.spawnArmor(), 45000);

      requestAnimationFrame(this.frame.bind(this));
    }

    pause(){
      if(!this.running || this.paused) return;
      this.paused = true;
      // stop frame
      this.running = false;
      // clear timers
      if(this.spawnTimeout) clearTimeout(this.spawnTimeout);
      if(this.difficultyTimer) clearInterval(this.difficultyTimer);
      if(this.scoreTimer) clearInterval(this.scoreTimer);
      if(this.levelTimer) clearInterval(this.levelTimer);
      if(this.armorTimer) clearInterval(this.armorTimer);
      // shield remaining
      if(this.shieldTimeout){
        this.shieldRemaining = Math.max(0, this.shieldEndTime - Date.now());
        clearTimeout(this.shieldTimeout);
        this.shieldTimeout = null;
      }
      if(this._shieldInterval) { clearInterval(this._shieldInterval); this._shieldInterval = null; }
      // update button label
      const btn = $('pause-btn'); if(btn) btn.textContent = 'Resume';
    }

    resume(){
      if(!this.paused) return;
      this.paused = false;
      this.running = true;
      this.lastTime = performance.now();
      // restart timers
      this.scheduleNextSpawn();
      this.difficultyTimer = setInterval(()=>{
        this.speedMultiplier += 0.3 * (this.speedFactor || 1);
      }, DIFFICULTY_INTERVAL);
      this.scoreTimer = setInterval(()=>{
        this.score += 1;
        this.scoreEl.textContent = `Score: ${this.score}`;
      }, SCORE_INTERVAL);
      if(this.levelTimer) clearInterval(this.levelTimer);
      this.levelTimer = setInterval(()=> this.nextLevel(), this.levelDuration);
      if(this.armorTimer) clearInterval(this.armorTimer);
      this.armorTimer = setInterval(()=> this.spawnArmor(), 45000);
      // restore shield timer if paused
      if(this.shieldRemaining && this.shieldRemaining > 0){
        this.shieldTimeout = setTimeout(()=>{
          // remove shield when time's up
          this.shielded = false; this.playerEl.classList.remove('shielded'); this.shieldTimeout = null;
          const inner = this.playerEl.querySelector('.player-inner'); if(inner){ inner.classList.add('player-lost'); setTimeout(()=> inner.classList.remove('player-lost'), 600); }
        }, this.shieldRemaining);
        this.shieldEndTime = Date.now() + this.shieldRemaining;
        this.shieldRemaining = 0;
        // restart the shield countdown updater
        if(this._shieldInterval) clearInterval(this._shieldInterval);
        this._shieldInterval = setInterval(()=>{
          if(!this.shielded){ clearInterval(this._shieldInterval); this._shieldInterval = null; return; }
          const remaining = Math.max(0, Math.round((this.shieldEndTime - Date.now())/1000));
          const st3 = $('shield-timer'); if(st3) st3.textContent = `Shield: ${remaining}s`;
        }, 250);
      }
      // update button label
      const btn = $('pause-btn'); if(btn) btn.textContent = 'Pause';
      requestAnimationFrame(this.frame.bind(this));
    }

    scheduleNextSpawn(){
      const min = this.spawnMin || SPAWN_MIN;
      const max = this.spawnMax || SPAWN_MAX;
      const delay = Math.max(80, min + Math.random()*(max-min));
      this.spawnTimeout = setTimeout(()=>{
        this.spawn();
        if(this.running) this.scheduleNextSpawn();
      }, delay);
    }

    spawn(){
      // choose type: armor (special) small chance, then benefit, else harmful
      const r = Math.random();
      const armorProb = this.armorProb || 0.08;
      const benefitProb = this.benefitProb || 0.45;
      let emoji, type;
      if(r < armorProb){
        emoji = '🛡️'; type = 'armor';
      } else if(r < (armorProb + benefitProb)){
        emoji = BENEFIT[Math.floor(Math.random()*BENEFIT.length)]; type = 'benefit';
      } else {
        emoji = HARMFUL[Math.floor(Math.random()*HARMFUL.length)]; type = 'harmful';
      }
      const baseSpeed = (0.045 + Math.random()*0.07) * (this.speedFactor || 1);
      const obj = new FallingObject(this.game, emoji, baseSpeed, type);
      // ensure consistent size for all objects
      obj.el.style.width = '5vh';
      obj.el.style.height = '5vh';
      obj.el.style.fontSize = '4vh';
      // center emoji in container
      obj.el.style.display = 'flex';
      obj.el.style.alignItems = 'center';
      obj.el.style.justifyContent = 'center';
      this.objects.push(obj);
    }    spawnArmor(){
      const baseSpeed = (0.045 + Math.random()*0.07) * (this.speedFactor || 1);
      const obj = new FallingObject(this.game, '🛡️', baseSpeed, 'armor');
      // ensure consistent size matching other objects
      obj.el.style.width = '5vh';
      obj.el.style.height = '5vh';
      obj.el.style.fontSize = '4vh';
      // center emoji in container
      obj.el.style.display = 'flex';
      obj.el.style.alignItems = 'center';
      obj.el.style.justifyContent = 'center';
      this.objects.push(obj);
    }

    frame(now){
      if(!this.running) return;
      const dt = now - this.lastTime;
      this.lastTime = now;
      // update player
      this.player.step(dt);
      // update objects
      for(let obj of this.objects) obj.step(dt, this.speedMultiplier);
      // collision check
      this.checkCollisions();
      // drop removed objects from array
      this.objects = this.objects.filter(o => !o.removed);
      requestAnimationFrame(this.frame.bind(this));
    }

    checkCollisions(){
      const pRect = this.player.getRect();
      for(let obj of this.objects){
        if(obj.removed) continue;
        const oRect = obj.getRect();
        if(this.rectOverlap(pRect, oRect)){
          // apply effect depending on type
          if(obj.type === 'harmful'){
            if(this.shielded){
              // no damage when shielded
            } else {
              this.changeHealth(-10);
            }
            obj.remove();
          } else if(obj.type === 'benefit'){
            this.changeHealth(10);
            obj.remove();
          } else if(obj.type === 'armor'){
            this.grantShield();
            obj.remove();
          }
        }
      }
    }

    grantShield(){
      // clear existing if present
      if(this.shieldTimeout) clearTimeout(this.shieldTimeout);
      this.shielded = true;
      this.playerEl.classList.add('shielded');
      // small pop animation on inner element
      const inner = this.playerEl.querySelector('.player-inner');
      if(inner){ inner.classList.add('player-pop'); setTimeout(()=> inner.classList.remove('player-pop'), 420); }
      // show shield timer UI
      const st = $('shield-timer'); if(st) st.textContent = 'Shield: 30s';
      // track end time for pause/resume
      this.shieldEndTime = Date.now() + this.armorDuration;
      // remove after duration
      this.shieldTimeout = setTimeout(()=>{
        this.shielded = false;
        this.playerEl.classList.remove('shielded');
        this.shieldTimeout = null;
        // shield lost animation on inner
        const inner2 = this.playerEl.querySelector('.player-inner'); if(inner2){ inner2.classList.add('player-lost'); setTimeout(()=> inner2.classList.remove('player-lost'), 600); }
        const st2 = $('shield-timer'); if(st2) st2.textContent = '';
        // show center 3s countdown
        this.showCenterCountdown(3);
      }, this.armorDuration);
      // countdown updater
      if(this._shieldInterval) clearInterval(this._shieldInterval);
      this._shieldInterval = setInterval(()=>{
        if(!this.shielded){ clearInterval(this._shieldInterval); this._shieldInterval = null; return; }
        const remaining = Math.max(0, Math.round((this.shieldEndTime - Date.now())/1000));
        const st3 = $('shield-timer'); if(st3) st3.textContent = `Shield: ${remaining}s`;
      }, 250);
    }

    showCenterCountdown(seconds){
      const el = $('center-msg');
      if(!el) return;
      let s = seconds;
      el.classList.remove('hidden');
      el.textContent = s;
      const iv = setInterval(()=>{
        s -= 1;
        if(s <= 0){ clearInterval(iv); el.classList.add('hidden'); return; }
        el.textContent = s;
      }, 1000);
    }

    changeHealth(delta){
      this.health = Math.max(0, Math.min(this.maxHealth, this.health + delta));
      this.updateHealthUI();
      // flash effect for hit/benefit
      this.game.classList.add('hit-effect');
      setTimeout(()=> this.game.classList.remove('hit-effect'), 220);
      if(this.health <= 0){
        this.gameOver();
      }
    }

    updateHealthUI(){
      const pct = Math.round((this.health/this.maxHealth)*100);
      this.healthBar.style.width = `${pct}%`;
      this.healthText.textContent = `${pct}%`;
    }

    rectOverlap(a,b){
      return !(b.left > a.right ||
               b.right < a.left ||
               b.top > a.bottom ||
               b.bottom < a.top);
    }

    gameOver(){
      this.running = false;
      clearTimeout(this.spawnTimeout);
      clearInterval(this.difficultyTimer);
      if(this.levelTimer) clearInterval(this.levelTimer);
      if(this.shieldTimeout) clearTimeout(this.shieldTimeout);
      if(this.armorTimer) clearInterval(this.armorTimer);
      clearInterval(this.scoreTimer);

      // show overlay
      this.finalScoreEl.textContent = `Score: ${this.score}`;
      if(this.score > this.best){
        this.best = this.score;
        localStorage.setItem(this.bestKey, String(this.best));
      }
      this.finalBestEl.textContent = `Best: ${this.best}`;
      this.bestEl.textContent = `Best: ${this.best}`;
      this.startBestEl.textContent = `Best: ${this.best}`;
      this.gameOverScreen.classList.remove('hidden');
    }

    clearAllObjects(){
      if(this.spawnTimeout) clearTimeout(this.spawnTimeout);
      if(this.difficultyTimer) clearInterval(this.difficultyTimer);
      if(this.scoreTimer) clearInterval(this.scoreTimer);
      if(this.levelTimer) clearInterval(this.levelTimer);
      if(this.shieldTimeout) clearTimeout(this.shieldTimeout);
      if(this.armorTimer) clearInterval(this.armorTimer);
      for(let o of this.objects) o.remove();
      this.objects = [];
    }

    nextLevel(){
      this.level += 1;
      // increase difficulty mildly per level
      this.speedMultiplier += 0.6 * (this.speedFactor || 1);
      // slightly tighten spawn window
      this.spawnMin = Math.max(120, Math.round((this.spawnMin || 500) * 0.92));
      this.spawnMax = Math.max(300, Math.round((this.spawnMax || 1400) * 0.94));
      // update visuals - cycle through visual themes but keep increasing level number
      const visualLevel = ((this.level - 1) % 10) + 1;
      this.game.classList.remove(...Array.from({length: 10}, (_, i) => `level-${i + 1}`));
      this.game.classList.add(`level-${visualLevel}`);
      // show level transition message
      const transitionEl = document.createElement('div');
      transitionEl.className = 'level-transition';
      transitionEl.textContent = `Level ${this.level}`;
      this.game.appendChild(transitionEl);
      setTimeout(() => transitionEl.remove(), 1500);
      this.updateLevelUI();
    }

    updateLevelUI(){
      const lvl = $('level');
      if(lvl) lvl.textContent = `Level: ${this.level}`;
    }

    // helper to map clientX into player position inside game container
    handlePointerMove(clientX){
      if(!this.player) return;
      const rect = this.game.getBoundingClientRect();
      const localX = clientX - rect.left;
      let targetX = localX - (this.player.el.offsetWidth/2);
      // if pointerOffset provided, preserve initial offset so player doesn't snap
      if(arguments.length > 1 && this._pointerOffset != null){
        targetX = localX - this._pointerOffset;
      }
      // clamp
      const min = 0;
      const max = Math.max(0, this.game.clientWidth - this.player.el.offsetWidth);
      this.player.x = Math.max(min, Math.min(max, targetX));
      this.player.updateDom();
    }
  }

  // Start manager when DOM ready
  window.addEventListener('load', ()=>{
    window.gameManager = new GameManager();
  });

})();
