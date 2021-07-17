function generateChromosome() {
    var chromosome = [];
    for (var i = 0; i < 26; ++i)
        chromosome[i] = 2 * Math.random() - 1;
    chromosome.fitness = 0;
    return chromosome;
}

function crossover(chromosome1, chromosome2) {
    var chromosome = generateChromosome();
    for (var i = 0; i < chromosome1.length; ++i) {
        if (parseInt(Math.random() * 10) % 2 == 0)
            chromosome[i] = chromosome1[i];
        else
            chromosome[i] = chromosome2[i];
    }
    return chromosome;
}

function mutate(chromosome) {
    for (var i = 0; i < chromosome.length; ++i) {
        if (Math.random() < 0.2)
            chromosome[i] += 2 * Math.random() - 1;
    }
}

var brain = {};
brain.shouldJump = function(chromosome, x, y, speed) {
    function sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    a1 = sigmoid(chromosome[0] * x + chromosome[1] * y + chromosome[2] * speed + chromosome[3]);
    a2 = sigmoid(chromosome[4] * x + chromosome[5] * y + chromosome[6] * speed + chromosome[7]);
    a3 = sigmoid(chromosome[8] * x + chromosome[9] * y + chromosome[10] * speed + chromosome[11]);
    a4 = sigmoid(chromosome[12] * x + chromosome[13] * y + chromosome[14] * speed + chromosome[15]);
    a5 = sigmoid(chromosome[16] * x + chromosome[17] * y + chromosome[18] * speed + chromosome[19]);
    r = sigmoid(chromosome[20] * a1 + chromosome[21] * a2 + chromosome[22] * a3 + chromosome[23] * a4 + chromosome[24] * a5 + chromosome[25]);
    return r > 0.5;
}

var canvas = document.getElementById("game-canvas");
var context = canvas.getContext("2d");

var background = {x: 0, speed: 2, image: new Image()};
background.image.src = "./sprites/background.png";

var base = {x: 0, speed: 1, image: new Image()};
base.image.src = "./sprites/base.png";

function createPipe(height) {
    var pipe = {x: 0, speed: 1, gap: 70, height, image1: new Image(), image2: new Image()};
    pipe.image1.src = "./sprites/pipe_down.png";
    pipe.image2.src = "./sprites/pipe_up.png";
    return pipe;
}

function createBird(chromosome) {
    var bird = {x: 40, y: canvas.height / 2 - 12, speed: 0, chromosome, image: new Image()};
    bird.image.src = "./sprites/bird.png";
    bird.update = function(pipe) {
        var x = pipe.x - bird.x;
        var y = pipe.height - bird.y;

        if (brain.shouldJump(chromosome, x, y, bird.speed)) {
            bird.speed = 5;
        }
        
        bird.speed -= 0.5;
        bird.y -= 0.5 * bird.speed;
    }
    return bird;
}

var pipes = [];
var birds = [];
for (var i = 0; i < 30; ++i)
    birds.push(createBird(generateChromosome()));
var generation = 1;
var currentScore = 0;
var globalScore = 0;
var parentChromosomes = [];
for (var i = 0; i < birds.length; ++i)
    parentChromosomes.push(birds[i].chromosome);

var generationCounter = document.getElementById("generation-count");
var currentScoreCounter = document.getElementById("current-score-count");
var globalScoreCounter = document.getElementById("global-score-count");
generationCounter.innerHTML = generation;
currentScoreCounter.innerHTML = currentScore;
globalScoreCounter.innerHTML = globalScore;

window.addEventListener("keypress", function() {
    for (let bird of birds) {
        bird.speed = 5;
    }
})

function gameLoop() {
    background.x -= background.speed;
    base.x -= base.speed;

    if (background.x < -background.image.width)
        background.x = 0;
    if (base.x < -base.image.width)
        base.x = 0;

    var newPipes = []
    for (var i = 0; i < pipes.length; ++i) {
        var pipe = pipes[i];
        pipe.x -= pipe.speed;
        if (pipe.x < -pipe.image1.width)
            continue;

        newPipes.push(pipe);
    }

    while (newPipes.length < 2) {
        var prevPipe = newPipes.length > 0 ? newPipes[newPipes.length - 1] : undefined;
        var height = parseInt(Math.random() * (330 - 30) + 30);
        var pipe = createPipe(height);
        pipe.x = prevPipe ? prevPipe.x + 200 : 200;
        newPipes.push(pipe);
    }
    pipes = newPipes;

    var newBirds = [];
    for (var i = 0; i < birds.length; ++i) {
        var bird = birds[i];
        bird.update(pipes[0]);
        if (bird.y + bird.image.height / 2 > canvas.height - base.image.height)
            continue;
        if (bird.y + bird.image.height / 2 < 0)
            continue;
        if (bird.x >= pipes[0].x && bird.x <= pipes[0].x + pipes[0].image1.width && bird.y < pipes[0].height - pipes[0].gap / 2)
            continue;
        if (bird.x >= pipes[0].x && bird.x <= pipes[0].x + pipes[0].image1.width && bird.y + bird.image.height > pipes[0].height + pipes[0].gap / 2)
            continue;

        ++bird.chromosome.fitness;
        newBirds.push(bird);
    }
    if (newBirds.length === 0) {
        ++generation;
        document.getElementById("generation-count").innerHTML = generation;
        birds = [];
        parentChromosomes.sort(function(c1, c2) { return c2.fitness - c1.fitness; });
        parents = parentChromosomes.slice(0, 5);
        for (var i = 0; i < 5; ++i) {
            for (var j = i + 1; j < 5; ++j) {
                var chromosome = crossover(parents[i], parents[j]);
                if (Math.random() < 0.2)
                    mutate(chromosome);
                birds.push(createBird(chromosome));
            }
        }
        for (var i = 0; i < 5; ++i)
            birds.push(createBird(parents[i]));

        parentChromosomes = [];
        for (var i = 0; i < birds.length; ++i)
            parentChromosomes.push(birds[i].chromosome);
        
        pipes = [];
        base.x = 0;
        background.x = 0;
        requestAnimationFrame(gameLoop);
        return;
    }
    birds = newBirds;

    context.drawImage(background.image, background.x, 0);
    context.drawImage(background.image, background.x + background.image.width, 0);

    for (var i = 0; i < pipes.length; ++i) {
        var pipe = pipes[i];
        context.drawImage(pipe.image1, pipe.x, pipe.height - pipe.gap / 2 - pipe.image1.height);
        context.drawImage(pipe.image2, pipe.x, pipe.height + pipe.gap / 2);
    }

    for (var i = 0; i < birds.length; ++i) {
        var bird = birds[i];
        context.drawImage(bird.image, bird.x, bird.y);
    }

    context.drawImage(base.image, base.x, canvas.height - base.image.height);
    context.drawImage(base.image, base.x + base.image.width, canvas.height - base.image.height);

    requestAnimationFrame(gameLoop);
}

gameLoop();
