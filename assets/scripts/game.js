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
        left; ${this.x}px;
        top; ${this.y}px;
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
class EnemyAirplane extends Drawable {
    constructor(game) {
        super(game);
        this.w = 70;
        this.h = 70;
        this.y = 60;
        this.x = random(0, window.innerWidth - this.w);
        this.offsets.y = 2;
        this.offsets.x = random(-3, 3);
        this.bombInterval = random(100, 200);
        this.bombCounter = 0;
        this.createElement();
    }

    update() {
        // Проверка столкновения с игроком (для окончания игры или получения урона)
        if (this.isCollision(this.game.player)) {
            this.game.player.takeDamage(); // Предполагается, что у игрока есть метод takeDamage
            this.takeDamage(); // Удалить самолет после столкновения
        }

        // Сброс бомбы через интервалы
        this.bombCounter++;
        if (this.bombCounter >= this.bombInterval) {
            this.dropBomb();
            this.bombCounter = 0;
            this.bombInterval = random(100, 200); // Сброс интервала
        }

        // Изменение направления при столкновении с горизонтальными краями
        if (this.x <= 0 || this.x + this.w >= window.innerWidth) {
            this.offsets.x = -this.offsets.x;
        }

        super.update(); // Обновление позиции на основе смещений
    }

    dropBomb() {
        // Создание нового объекта бомбы и добавление его в игру
        // Предполагается существование класса Bomb
        const bomb = new Bomb(this.game, this.x + this.w / 2, this.y + this.h); // Сброс из центра низа самолета
        this.game.add(bomb); // Добавление бомбы в список объектов игры
    }

    takePoint() {
        // Начисление очков при уничтожении самолета игроком (опционально)
        if (this.game.remove(this)) {
            this.removeElement();
            this.game.points += 10; // Пример: 10 очков за самолет
        }
    }

    takeDamage() {
        // Удаление самолета при попадании пули игрока или столкновении с игроком
        if (this.game.remove(this)) {
            this.removeElement();
            // Опционально уменьшить HP игрока, если самолет столкнулся с игроком
            // this.game.hp--; // Только если это означает урон игроку
        }
    }
}

class Player extends Drawable {
    constructor(game) {
        super(game);
        this.w = 244;
        this.h = 109;
        this.x = window.innerWidth / 2 - this.w / 2;
        this.y = window.innerHeight - this.h;
        this.speedPerFrame = 20;
        this.skillTimer = 0;
        this.couldTimer = 0;
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false,
            Space: false
        }
        this.createElement();
        this.bindKeyEvents();
    }

    bindKeyEvents() {
        document.addEventListener('keydown', ev => this.changeKeyStatus(ev.code, true))
        document.addEventListener('keyup', ev => this.changeKeyStatus(ev.code, false))
    }
    changeKeyStatus(code, value) {
        if(code in this.keys) this.keys[code] = value;
    }




    update(){
        if(this.keys.ArrowLeft && this.x > 0) this.offsets.x = -this.speedPerFrame;
        else if(this.keys.ArrowRight && this.x < window.innerWidth - this.w) this.offsets.x = this.speedPerFrame;
        else this.offsets.x = 0;
        if(this.keys.Space && this.couldTimer === 0) {
            this.skillTimer++;
            $('#skill').innerHTML = `осталось ${Math.ceil((240 - this.skillTimer) / 60)}`;
            this.applySkill();
        }
        if (this.skillTimer > 240 || (!this.keys.Space && this.skillTimer > 1)) {
            this.couldTimer++;
            $('#skill').innerHTML = `осталось ${Math.ceil((300 - this.couldTimer)/ 60)}`;
            this.keys.Space = false;
        }
        if(this.couldTimer > 300) {
            this.couldTimer = 0;
            this.skillTimer = 0;
            $('#skill').innerHTML = 'готово';
        }
        super.update();
    }

    applySkill() {
        for(let i=1; i<this.game.elements.length; i++){
            if(this.game.elements[i].x < this.x + (this.w / 2)) {
                this.game.elements[i].x += 15;
            } else if (this.game.elements[i].x < this.x + (this.w / 2)) {
                this.game.elements[i].x -= 15;
            }
        }
    }
}