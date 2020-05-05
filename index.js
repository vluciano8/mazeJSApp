const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

//const userName = prompt('What is your name??');
const width = window.innerWidth;
const height = window.innerHeight;
const cellsHorizontal = 16;
const cellsVertical = 14;
const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
	element: document.body,
	engine: engine,
	options: {
		wireframes: false,
		width,
		height,
		background: '#BA4A00'
	}
});
Render.run(render);
Runner.run(Runner.create(), engine);

//WALLS
//shapes first over, second down, 3 wide, 4 tall
const walls = [
	Bodies.rectangle(width / 2, 0, width, 5, { isStatic: true, render: { fillStyle: '#283747' } }),
	Bodies.rectangle(width / 2, height, width, 5, { isStatic: true, render: { fillStyle: '#283747' } }),
	Bodies.rectangle(0, height / 2, 5, height, { isStatic: true, render: { fillStyle: '#283747' } }),
	Bodies.rectangle(width, height / 2, 5, height, { isStatic: true, render: { fillStyle: '#283747' } })
];

World.add(world, walls);

//MAZE GENERATION --- The outter arrays is for the number of rows. The inner is for the columns

//this function generates random positions
const shuffle = (arr) => {
	let counter = arr.length;

	while (counter > 0) {
		const index = Math.floor(Math.random() * counter);

		counter--;

		const temp = arr[counter];
		arr[counter] = arr[index];
		arr[index] = temp;
	}
	return arr;
};

const grid = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal - 1).fill(false));

const horizontals = Array(cellsVertical - 1).fill(null).map(() => Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const stepThroughCell = (row, column) => {
	//If I have visited the cell, return

	if (grid[row][column] === true) {
		//=== true is optional as the return is a boolean anyways
		return;
	}
	//Mark this cell as visited
	grid[row][column] = true;

	//Assemble randomly order list of neighbor
	const neighbors = shuffle([
		[ row - 1, column, 'up' ],
		[ row, column + 1, 'right' ],
		[ row + 1, column, 'down' ],
		[ row, column - 1, 'left' ]
	]);

	//For each neighbor...
	for (neighbor of neighbors) {
		const [ nextRow, nextColumn, direction ] = neighbor;
		//See if the neighbor is out of bounds
		if (nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) {
			continue;
		}
		//If we have visited the neighbor go to the next one
		if (grid[nextRow][nextColumn]) {
			continue;
		}
		//Remove the wall vartical or horizontal
		if (direction === 'left') {
			verticals[row][column - 1] = true;
		} else if (direction === 'right') {
			verticals[row][column] = true;
		} else if (direction === 'up') {
			horizontals[row - 1][column] = true;
		} else if (direction === 'down') {
			horizontals[row][column] = true;
		}
		stepThroughCell(nextRow, nextColumn);
	}

	//Visit that next cell
};

stepThroughCell(startRow, startColumn);

//Iterating over walls to draw HORIZONTAL WALLS on canvas

horizontals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open === true) {
			return;
		} else {
			const wall = Bodies.rectangle(
				columnIndex * unitLengthX + unitLengthX / 2,
				rowIndex * unitLengthY + unitLengthY,
				unitLengthX,
				5,
				{ label: 'wall', isStatic: true, render: { fillStyle: '#283747' } }
			);
			World.add(world, wall);
		}
	});
});
//Iterating over walls to draw VERTICAL WALLS on canvas

verticals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open === true) {
			return;
		} else {
			const wall = Bodies.rectangle(
				columnIndex * unitLengthX + unitLengthX,
				rowIndex * unitLengthY + unitLengthY / 2,
				5,
				unitLengthY,
				{ label: 'wall', isStatic: true, render: { fillStyle: '#283747' } }
			);
			World.add(world, wall);
		}
	});
});

//Create the GOAL to success
const goal = Bodies.rectangle(width - unitLengthX / 2, height - unitLengthY / 2, unitLengthX * 0.7, unitLengthY * 0.7, {
	label: 'goal',
	isStatic: true,
	render: { fillStyle: 'orange' }
});
World.add(world, goal);

//Create the BALL to play
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
	label: 'ball',
	render: { fillStyle: '#E7EF0D' }
});
World.add(world, ball);

//Apply velocity or movement with keys
document.addEventListener('keydown', (e) => {
	const { x, y } = ball.velocity;
	if (e.keyCode === 87) {
		Body.setVelocity(ball, { x, y: y - 5 });
	}
	if (e.keyCode === 68) {
		Body.setVelocity(ball, { x: x + 5, y });
	}
	if (e.keyCode === 83) {
		Body.setVelocity(ball, { x, y: y + 5 });
	}
	if (e.keyCode === 65) {
		Body.setVelocity(ball, { x: x - 5, y });
	}
});

//Win Condition
Events.on(engine, 'collisionStart', (e) => {
	e.pairs.forEach((collision) => {
		const labels = [ 'ball', 'goal' ];

		if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
			//insert some animation to winner!
			document.querySelector('h1').innerHTML = `Congratulations!<br><span>You Win!!</span>`;
			document.querySelector('.winner').classList.remove('hidden');
			world.gravity.y = 1;
			world.bodies.forEach((body) => {
				if (body.label === 'wall') {
					Body.setStatic(body, false);
				}
			});
		}
	});
});
