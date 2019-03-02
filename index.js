
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
const DEFAULT_DIR = 0;
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
    color: getRandomColor(),
  }
  return response.json(data)
})

function getRandomColor() {
  var letters = '0123456789ABCDEF'.split('');
  var color = '#';
  for (var i = 0; i < 6; i++ ) {
  color += letters[Math.round(Math.random() * 15)];
  }
  return color;
}

/*********************************************
* If about to hit the wall, turn right.
*********************************************/
function Queue(){
	let items = [];
	this.enqueue = function(element) {
		items.push(element);
	};
	this.dequeue = function() {
		return items.shift();
	};
	this.front = function() {
		return items[0];
	};
	this.isEmpty = function() {
		return items.length === 0;
	};
	this.clear = function() {
		items = [];
	};
	this.size = function() {
		return items.length;
	};
	this.print = function() {
		// 列印出佇列內容
		console.log(items.toString());
	}
}

function nextGrid(move_dir,head){
  var next;
  switch (move_dir) {
    case 0:
      next = {
        x:head.x,
        y:head.y-1
      }
      break;
    case 1:
      next = {
        x:head.x+1,
        y:head.y
      }
      break;
    case 2:
      next = {
        x:head.x,
        y:head.y+1
      }
      break;
    case 3:
      next = {
        x:head.x-1,
        y:head.y
      }
      break;
    default:
  }
  return next;
}

function getDistance(a,b){
  return Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
}

function rightGrid(move_dir,head){
  return nextGrid((move_dir+1)%4,head);
}

function leftGrid(move_dir,head){
  return nextGrid((move_dir+3)%4,head);
}

function closeAreaMethod(mySnake,snake_list,map_len){
  var dir_list=[];
  var head = mySnake[0];
  var last_dir = (turn_num!=0&&mySnake.length>1)?getDirection(mySnake[1],head):DEFAULT_DIR;
  var right_area = BFSfindCloseArea(rightGrid(last_dir,head),snake_list,map_len);
  var left_area = BFSfindCloseArea(leftGrid(last_dir,head),snake_list,map_len);
  var front_area = BFSfindCloseArea(nextGrid(last_dir,head),snake_list,map_len);
  var max_area = Math.max(left_area,right_area,front_area);
  if(left_area == max_area)dir_list.push((last_dir+3)%4);
  if(right_area == max_area)dir_list.push((last_dir+1)%4);
  if(front_area == max_area)dir_list.push(last_dir);
  console.log("left: "+left_area);
  console.log("right: "+right_area);
  console.log("front: "+front_area);
  return dir_list;
}

function BFSfindCloseArea(start,snake_list,map_len){
   if(isObstacle(start,snake_list,map_len))return 0;
   var visit_count = 0;
   var visited = [];
   for(var i = 0 ; i < map_len; i++) {
     visited[i] = [];
   }
   for(var x = 0 ; x < map_len; x++) {
       for(var y = 0; y < map_len; y++) {
           visited[x][y] = false;
       }
   }
   // Create a Queue and add our initial node in it
   const q = new Queue();
   //let explored = new Set();
   q.enqueue(start);
   // Mark the first node as explored explored.
   visited[start.x][start.y]=true;
   // We'll continue till our queue gets empty
   while (!q.isEmpty()) {
      let t = q.dequeue();
      visit_count++;
      // Log every element that comes out of the Queue
      //console.log(t);
      // 1. In the edges object, we search for nodes this node is directly connected to.
      // 2. We filter out the nodes that have already been explored.
      // 3. Then we mark each unexplored node as explored and add it to the queue.
      BFSgetNeighbors(t,snake_list,visited)
      .filter(n => visited[n.x][n.y]==false)
      .forEach(n => {
         visited[n.x][n.y] = true;
         if(!isObstacle(n,snake_list,map_len)){
           q.enqueue(n);
         }
      });
    }
    return visit_count;
}

/*********************************************
* Determine if a node is out of the map (which is a wall).
*********************************************/
function isObstacle(a,snake_list,map_len){

  var ifObstacle = (a.x<0||a.x>map_len-1||a.y<0||a.y>map_len-1)?true:false;  //if wall
  /* if snake */
  for(let j=0;j<snake_list.length;j++){
    let snake = snake_list[j].body;
    /*Note that snake.length-1 is important to predict the next move*/
    for (let i=0;i<snake.length-1;i++){
      if(snake[i].x==a.x&&snake[i].y==a.y)ifObstacle=true;
    }
  }
  return ifObstacle;
}

function senseEnemyHead(mySnake,snake_list,grid){
    var dangerous_dir_list=[];
    for(let j=0;j<snake_list.length;j++){
      let enemy_head = snake_list[j].body[0];
      let my_head  = mySnake[0];
      if(getDistance(my_head,enemy_head)==2 && snake_list[j].body.length>=mySnake.length){

        var delta_x=enemy_head.x-my_head.x;
        var delta_y=enemy_head.y-my_head.y;
        if(delta_x>0)dangerous_dir_list.push(1);
        if(delta_x<0)dangerous_dir_list.push(3);
        if(delta_y>0)dangerous_dir_list.push(2);
        if(delta_y<0)dangerous_dir_list.push(0);
        break;
      }
    }
    return dangerous_dir_list;
}

function differenceSet(a,b){
  for(var i=0;i<b.length;i++){
    if(a.includes(b[i]))a.splice(a.indexOf(b[i]),1);
  }
  return a;
}
function intersectionSet(a,b){
  return a.filter(function(v){ return b.indexOf(v) > -1 })
}

function avoidObstacle(move_dir,mySnake,snake_list,map_len){
  console.log("move dir: "+move_dir);
  var head = mySnake[0];
  var last_dir = (turn_num!=0&&mySnake.length>1)?getDirection(mySnake[1],head):DEFAULT_DIR;
  var dir_list=[0,1,2,3];
  /* Based on move_dir*/
  dir_list.splice(dir_list.indexOf((last_dir+2)%4),1); //remove opposite direction

  if(isObstacle(rightGrid(last_dir,head),snake_list,map_len))
    {dir_list.splice(dir_list.indexOf((last_dir+1)%4),1);}  //check right
  if(isObstacle(leftGrid(last_dir,head),snake_list,map_len))
    {dir_list.splice(dir_list.indexOf((last_dir+3)%4),1);}  //check left
  if(isObstacle(nextGrid(last_dir,head),snake_list,map_len)){
    dir_list.splice(dir_list.indexOf(last_dir),1);          //check front
  }
  let dangerous_dir_list = senseEnemyHead(mySnake,snake_list,map_len);
  let afterSensing = differenceSet(dir_list,dangerous_dir_list);
  console.log("aftersensing options:");
  console.log(afterSensing);
  if(afterSensing.length==0)return move_dir;
  var area_options = closeAreaMethod(mySnake,snake_list,map_len);
  console.log("area options:");
  console.log(area_options);

  var final_set = intersectionSet(afterSensing,area_options)
  console.log("final options:");
  console.log(final_set);
  if(final_set.length!=0)return final_set.includes(move_dir)?move_dir:final_set[0];
  else return afterSensing.includes(move_dir)?move_dir:afterSensing[0];
}

/*********************************************
* Convert number 0 - 3 to direction [up, right, down, left] respectively
*********************************************/
function updateMoveDirection(move_dir){
  var move = {move:"up"};
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
  return move;
}

/*********************************************
* From a food list find the nearest food from head.
*********************************************/
function sortFoodList(food_list,head){

  for (var i = 0; i < food_list.length-1; i++){
      for (var j = 0; j < food_list.length-i-1; j++)
          if (getDistance(food_list[j],head) > getDistance(food_list[j+1],head)){
            var temp = food_list[j];
            food_list[j]=food_list[j+1];
            food_list[j+1]=temp;
          }
   }
  // console.log(food_list);
  return food_list;
}

/*********************************************
* Initial the map as two-demensional node array grid.
*********************************************/
function initGrid(map_len) {
  var grid=[];
  for(var x = 0 ; x < map_len; x++) {
    grid[x] = [];
  }
  for(var x = 0 ; x < map_len; x++) {
      for(var y = 0; y < map_len; y++) {
          grid[x][y]={
                      x:x,
                      y:y,
                      g:Infinity,
                      h:Infinity,
                      f:Infinity,
                      cost:1,
                      state:-1, //-1 unvisited, 0 closed, 1 open
                      parent:null
                    };
      }
  }
  return grid;
}

/*********************************************
* Get a direction from node a->b, range 0 - 3.
*********************************************/
function getDirection(a,b){
  if (getDistance(a,b)==1){
    if(a.x==b.x){
      return a.y>b.y?0:2;
    }
    if(a.y==b.y){
      return a.x>b.x?3:1;
    }
  }else {
    console.log("Error in finding direction.");
    return -1;
  }
}

/*********************************************
* Determine if two nodes represent the same position.
*********************************************/
function samePosition(a,b){
  return(a.x==b.x && a.y==b.y);
}

function printNeighbors(neighbors){
  for(var i = 0; i<neighbors.length-1; i++ ){
    console.log("neighbor: "+ i + "\t{x: "+neighbors[i].x +"\ty: "+neighbors[i].y+"}");
  }
}

/*********************************************
* Main function to implement A* algorithm
*********************************************/
function aStarSearch(start,end,mySnake,snake_list,grid) {
  var openList = [];
  grid[start.x][start.y] = {
              x:start.x,
              y:start.y,
              g:0,
              h:getDistance(start,end),
              f:getDistance(start,end),
              cost:1,
              state:1, //-1 unvisited, 0 closed, 1 open
              parent:null
            };
  openList.push(grid[start.x][start.y]);
  while(openList.length > 0) {
      // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
      var low_index = 0;
      for(var i=0; i<openList.length; i++) {
        if(openList[i].f <= openList[low_index].f) { low_index = i; }
      }
      var currentNode = openList[low_index];
      openList.splice(low_index, 1); // remove current node from openList.
      //End case -- result has been found, return the traced path.
      if(samePosition(currentNode,end)) {
          var curr = currentNode;
          var path = [];
          while(curr.parent) {
              path.push(curr);
              curr = curr.parent;
          }
          return path.reverse();
      }
      // Normal case -- move currentNode from open to closed, process each of its neighbors.
      currentNode.state = 0;
      // Find all neighbors for the current node.
      var neighbors = aStarGetNeighbors(currentNode,grid);
      for(var i=0; i < neighbors.length; i++) {
          var neighbor = neighbors[i];
          if(neighbor.state==0||isObstacle(neighbor,snake_list,grid.length)) {
              neighbor.state==0;
              // Not a valid node to process, skip to next neighbor.
              continue;
          }
          // The g score is the shortest distance from start to current node.
          // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
          var gScore = currentNode.g + neighbor.cost;
          var better_gScore = false;
          if(neighbor.state==-1) {
          // This the the first time we have arrived at this node, it must be the best
          // Also, we need to take the h (heuristic) score since we haven't done so yet
            neighbor.state = 1;
            better_gScore = true;
            neighbor.h = getDistance(neighbor,end);
            openList.push(neighbor);
          }
          else if(gScore < neighbor.g) {
            // We have already seen the node, but last time it had a worse g (distance from start)
            better_gScore = true;
          }
          if(better_gScore) {
            // Found an optimal (so far) path to this node.   Store info on how we got here and
            //  just how good it really is...
            neighbor.parent = currentNode;
            neighbor.g = gScore;
            neighbor.f = neighbor.g + neighbor.h;
          }
      }//end for
  }//end while
  // No result was found - empty array signifies failure to find path.
  return [];
}

function pathToVector(path,head){
  var vector_list = [];
  path.unshift(head);
  for(var i = 0; i<path.length-1; i++ ){
    vector_list.push(getDirection(path[i],path[i+1]));
  }
  return vector_list;
}

/*********************************************
* get four neighbors of a node. (could be simplified later.)
*********************************************/
function aStarGetNeighbors(node,grid) {
    var neighbor_list = [];
    var x = node.x;
    var y = node.y;
    // Left
    if(x>0){
      if(grid[x-1][y].state!=0 ) {
          neighbor_list.push(grid[x-1][y]);
      }
    }
    // Right
    if(x<grid.length-1){
      if(grid[x+1][y].state!=0 ) {
          neighbor_list.push(grid[x+1][y]);
      }
    }
    // Up
    if(y>0){
      if(grid[x][y-1].state!=0 ) {
          neighbor_list.push(grid[x][y-1]);
      }
    }
    // Down
    if(y<grid.length-1){
      if(grid[x][y+1].state!=0 ) {
          neighbor_list.push(grid[x][y+1]);
      }
    }
    return neighbor_list;
}

function BFSgetNeighbors(node,snake_list,visited) {
    var neighbor_list = [];
    var x = node.x;
    var y = node.y;
  // Left
    if(x>0) {
        neighbor_list.push({x:x-1,y:y});
    }
  // Right
    if(x<visited.length-1) {
        neighbor_list.push({x:x+1,y:y});
    }
  // Up
    if(y>0) {
        neighbor_list.push({x:x,y:y-1});
    }
  // Down
    if(y<visited.length-1) {
        neighbor_list.push({x:x,y:y+1});
    }
    return neighbor_list;
}
function isFoodAvailable(food,mySnake,snake_list){
  var head = mySnake[0];
  var foodAvailable = true;
  var food_dis = getDistance(head,food);
  for(let j=0;j<snake_list.length;j++){
    let enemy_head = snake_list[j].body[0];
      if(getDistance(enemy_head,food)<food_dis)foodAvailable = false;
      if(getDistance(enemy_head,food)==food_dis && snake_list[j].body.length>=mySnake.length)foodAvailable = false;
  }
  return foodAvailable;
}
function randomGrid(map_len){
  return {x:Math.random()*map_len,
          y:Math.random()*map_len
         };
}
var move_dir = DEFAULT_DIR; //initialize move direction
var turn_num = 0;
// Handle POST request to '/move'
app.post('/move', (request, response) => {
  console.log("=========================================");
  // console.log(request.body);
  var mySnake = request.body.you.body;
  var my_name = request.body.you.name;
  var my_health = request.body.you.health;

  var head = mySnake[0];
  var map_len = request.body.board.width;
  var food_list = request.body.board.food;
  turn_num = request.body.turn; //update turn number
  console.log("turn: " + turn_num);
  var snake_list = request.body.board.snakes;
  console.log("name: " + my_name);
  // Response data
  console.log("head: %o",head);


  var sorted_food_list = sortFoodList(food_list,head);
  var the_food = sorted_food_list.length>0?sorted_food_list[0]:head;
  for(var i=0;i<sorted_food_list.length;i++){
    if(isFoodAvailable(sorted_food_list[i],mySnake,snake_list)){
      the_food = sorted_food_list[i];
      break;
    }
  }
  console.log("food: %o",the_food);
  var grid = initGrid(map_len);
  var temp_grid = initGrid(map_len);
  var the_tail = {x:mySnake[mySnake.length-1].x,
                  y:mySnake[mySnake.length-1].y};
  console.log("the tail: %o",the_tail);
  var path_to_food = aStarSearch(head,the_food,mySnake,snake_list,grid);
  var path_to_tail = aStarSearch(head,the_tail,mySnake,snake_list,grid);
  var food_flag = true;
  if(food_flag){
    if(path_to_food.length>0){
      move_dir = getDirection(head,path_to_food[0]);
      console.log("Find food......");
    }else if(path_to_tail.length>0){
      move_dir = getDirection(head,path_to_tail[0]);
      console.log("Find tail......");
    }
    console.log("path to food:");
    console.log(pathToVector(path_to_food,head));
    console.log("path to tail:");
    console.log(pathToVector(path_to_tail,head));
  }else{
    var path_to_random = aStarSearch(head,randomGrid(map_len),mySnake,snake_list,grid);
    move_dir = getDirection(head,path_to_random[0]);
    console.log("path to random:");
    console.log(pathToVector(path_to_random,head));
  }
  move_dir = avoidObstacle(move_dir,mySnake,snake_list,map_len);
  return response.json(updateMoveDirection(move_dir));
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

/*******************************************************
Reference:
  Astar algorithm in javascript: https://briangrinstead.com/blog/astar-search-algorithm-in-javascript/
  Breadth first search: https://www.tutorialspoint.com/Breadth-first-search-traversal-in-Javascript
  Queue implementation: https://blog.kdchang.cc/2016/09/11/javascript-data-structure-algorithm-queue/
*******************************************************/
