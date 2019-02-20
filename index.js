const bodyParser = require('body-parser')
const express = require('express')
const logger = require('morgan')
const app = express()
const {
  fallbackHandler,
  notFoundHandler,
  genericErrorHandler,
  poweredByHandler
} = require('./handlers.js')

// For deployment to Heroku, the port needs to be set using ENV, so
// we check for the port number in process.env
app.set('port', (process.env.PORT || 9001))

app.enable('verbose errors')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(poweredByHandler)

// --- SNAKE LOGIC GOES BELOW THIS LINE ---

// Handle POST request to '/start'
app.post('/start', (request, response) => {
  // NOTE: Do something here to start the game

  // Response data
  const data = {
    color: '#000000',
  }

  return response.json(data)
})

function avoidWall(move_dir,head,map_width,map_height){
  return (head.x == 0 && move_dir == 3
  || head.x == map_width-1 && move_dir ==1
  || head.y == 0 && move_dir == 0
  || head.y == map_height-1 && move_dir == 2)
  ? (move_dir+1)%4:move_dir;
}

// Handle POST request to '/move'
var move_dir = 0;
var move = {move:"up"};

app.post('/move', (request, response) => {

  console.log(request.body.you.body[0]);
  head =  request.body.you.body[0];
  console.log(head);
  map_width = request.body.board.width;
  map_height = request.body.board.height;
  food_list = request.body.board.food;
  enemy_list = request.body.board.snakes;
  // Response data

  console.log(food_list);
  move_dir = avoidWall(move_dir,head,map_width,map_height);

  switch(move_dir) {
    case 0:
      move = {move:"up"};
      break;
    case 1:
      move = {move:"right"};
      break;
    case 2:
      move = {move:"down"};
      break;
    case 3:
      move = {move:"left"};
      break;
    default:
      move = {move:"up"};
  }

  return response.json(move);
})

app.post('/end', (request, response) => {
  // NOTE: Any cleanup when a game is complete.
  return response.json({})
})

app.post('/ping', (request, response) => {
  // Used for checking if this snake is still alive.
  return response.json({});
})

// --- SNAKE LOGIC GOES ABOVE THIS LINE ---

app.use('*', fallbackHandler)
app.use(notFoundHandler)
app.use(genericErrorHandler)
app.listen(app.get('port'), () => {
  console.log('Server listening on port %s', app.get('port'))
})
