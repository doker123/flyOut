class Drawable {
    constructor(game) {
        this.game = game;
        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;
        this.offsets = {
            x: 0,
            y: 0
        }
    }

    update() {
        this.x += this.offsets.x;
        this.y += this.offsets.y;
    }

    createElement() {
        this.element = document.createElement("div");
        this.element.className = "element " + this.constructor.name.toLowerCase();
        $('.elements').append(this.element);
    }

    draw() {
        this.element.style = `
            left: ${this.x}px;
            top: ${this.y}px;
            width: ${this.w}px;
            height: ${this.h}px;
        `;
    }

    removeElement() {
        this.element.remove();
    }

    isCollision(element) {
        let a = {
            x1: this.x,
            y1: this.y,
            x2: this.x + this.w,
            y2: this.y + this.h,
        }
        let b = {
            x1: element.x,
            y1: element.y,
            x2: element.x + element.w,
            y2: element.y + element.h,
        }
        return a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
    }
}

class EnemyAircraft extends Drawable {
    constructor(game) {
        super(game);
        this.w = 60;
        this.h = 30;
        this.y = -this.h;
        this.x = random(0, window.innerWidth - this.w);
        this.offsets.y = random(1, 3);
        this.offsets.x = random(-1, 1);
        this.bombInterval = random(60, 180);
        this.bombCounter = 0;
        this.createElement();
    }

    update() {
        if (this.isCollision(this.game.player)) {
            this.game.player.takeDamage();
            this.takeDamage();
            return;
        }

        this.bombCounter++;
        if (this.bombCounter >= this.bombInterval) {
            this.dropBomb();
            this.bombCounter = 0;
            this.bombInterval = random(60, 180);
        }

        if (this.x <= 0 || this.x + this.w >= window.innerWidth) {
            this.offsets.x *= -1; // Меняем направление X
        }

        if (this.y > window.innerHeight) {
            this.takeDamage();
            return;
        }
        super.update();
    }

    dropBomb() {
        this.game.generate(Bomb, this.x + this.w / 2, this.y + this.h);
    }

    takePoint() {
        if (this.game.remove(this)) {
            this.removeElement();
            this.game.points += 10;
        }
    }

    takeDamage() {
        this.game.remove(this);
        this.removeElement();
    }
}

class Bomb extends Drawable {
    constructor(game, x, y) {
        super(game);
        this.w = 8;
        this.h = 15;
        this.x = x - this.w / 2;
        this.y = y;
        this.offsets.y = 5;
        this.createElement();
    }

    update() {
        if (this.isCollision(this.game.player)) {
            this.game.player.takeDamage();
            this.takeDamage();
            return;
        }


        if (this.y > window.innerHeight) {
            this.takeDamage();
            return;
        }

        super.update();
    }

    takeDamage() {
        this.game.remove(this);
        this.removeElement();
    }
}
class PlayerBullet extends Drawable {
    constructor(game, x, y) {
        super(game);
        this.w = 4;
        this.h = 10;
        this.x = x - this.w / 2;
        this.y = y - this.h;
        this.offsets.y = -8;
        this.createElement();
    }

    update() {
        if (this.y + this.h < 0) {
            this.takeDamage();
            return
        }

        super.update();
    }

    takeDamage() {
        this.game.remove(this);
        this.removeElement();
    }
}

class Player extends Drawable {
    constructor(game) {
        super(game);
        this.w = 80;
        this.h = 30;
        this.x = window.innerWidth / 2 - this.w / 2;
        this.y = window.innerHeight - this.h;
        this.speedPerFrame = 20;
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false,
            Space: false,
        }
        this.bullets = [];
        this.shootCooldown = 0;
        this.maxCooldown = 15;
        this.createElement();
        this.bindKeyEvents();
    }

    bindKeyEvents() {
        document.addEventListener('keydown', ev => this.changeKeyStatus(ev.code, true))
        document.addEventListener('keyup', ev => this.changeKeyStatus(ev.code, false))
    }

    changeKeyStatus(code, value) {
        if (code in this.keys) this.keys[code] = value;
    }

    update() {
        if (this.keys.ArrowLeft && this.x > 0) this.offsets.x = -this.speedPerFrame;
        else if (this.keys.ArrowRight && this.x < window.innerWidth - this.w) this.offsets.x = this.speedPerFrame;
        else this.offsets.x = 0;
        super.update();

        if(this.keys.Space && this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = this.maxCooldown;
        }

        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        super.update();
    }
    shoot() {
        const bullet = new PlayerBullet(this.game, this.x + this.w / 2, this.y);
        this.bullets.push(bullet);
        this.game.elements.push(bullet);
    }

    removeBullet(bullet) {
        const index = this.bullets.indexOf(bullet);
        if (index !== -1) {
            this.bullets.splice(index, 1);
            bullet.removeElement()
        }
    }

    takeDamage() {
        this.game.hp--;
        if (this.game.hp <= 0) {
            this.game.end();
        }
    }
}

class Game {
    constructor() {
        this.name = name;
        this.elements = [];
        this.player = this.generate(Player);
        this.counterForTimer = 0;
        this.aircrafts = [EnemyAircraft];
        this.hp = 5;
        this.points = 0;
        this.time = {
            m1: 0,
            m2: 0,
            s1: 0,
            s2: 0
        };
        this.ended = false;
        this.pause = false;
        this.keyEvents();
    }

    start() {
        this.loop();
    }

    generate(className) {
        let element = new className(this);
        this.elements.push(element);
        return element;
    }

    keyEvents() {
        addEventListener('keydown', ev => {
            if (ev.code === "Escape") this.pause = !this.pause;
        })
    }

    loop() {
        requestAnimationFrame(() => {
            if (!this.pause) {
                document.querySelectorAll('.element').forEach(el => {
                    el.style.animationPlayState = 'running';
                });
                this.counterForTimer++;
                if (this.counterForTimer % 60 === 0) {
                    this.timer();
                    this.randomAircraftGenerate();
                }
                if (this.hp < 0) {
                    this.end();
                }
                $('.pause').style.display = 'none';
                this.updateElements();
                this.setParams();
            } else if (this.pause) {
                $('.pause').style.display = 'flex';
                document.querySelectorAll('.element').forEach(el => {
                    el.style.animationPlayState = 'paused';
                });
            }
            if (!this.ended) this.loop()
        });
    }

    randomAircraftGenerate() {
        this.generate(this.aircrafts[0]);
    }

    updateElements() {
        this.elements.forEach(element => {
            element.update();
            element.draw();
        })
    }

    setParams() {
        let params = ['name', 'points', 'hp'];
        let values = [this.name, this.points, this.hp];
        params.forEach((param, ind) => {
            $(`#${param}`).innerHTML = values[ind];
        });
    }

    remove(el) {
        let idx = this.elements.indexOf(el);
        if (idx !== -1) {
            this.elements.splice(idx, 1);
            return true;
        }
        return false;

    }

    timer() {
        let time = this.time;
        time.s2++;
        if (time.s2 >= 10) {
            time.s2 = 0;
            time.s1++;
        }
        if (time.s1 >= 6) {
            time.s1 = 0;
            time.m2++;
        }
        if (time.m2 >= 10) {
            time.m2 = 0;
            time.m1++;
        }
        $('#timer').innerHTML = `${time.m1}${time.m2}:${time.s1}${time.s2}`;
    }

    end() {
        this.ended = true;
        let time = this.time;
        if ((time.s1 >= 1 || time.m2 >= 1 || time.m1 >= 1) && this.points >= 5) {
            $('#playerName').innerHTML = `Поздравляем, ${this.name}!`;
            $('#endTime').innerHTML = `Ваше время: ${time.m1}${time.m2}:${time.s1}${time.s2}`;
            $('#collectedFruits').innerHTML = `Вы собрали ${this.points} фруктов`;
            $('#congratulation').innerHTML = `Вы выиграли!`;
        } else {
            $('#playerName').innerHTML = `Жаль, ${this.name}!`;
            $('#endTime').innerHTML = `Ваше время: ${time.m1}${time.m2}:${time.s1}${time.s2}`;
            $('#collectedFruits').innerHTML = `Вы собрали ${this.points} фруктов`;
            $('#congratulation').innerHTML = `Вы проиграли!`;
        }
        go('end', 'panel d-flex justify-content-center align-items-center');
    }
}