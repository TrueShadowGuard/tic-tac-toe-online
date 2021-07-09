const CELL_X = 'x';
const CELL_O = 'o';
const CELL_EMPTY =' ';

const RESULT_UNSOLVED = -1;
const RESULT_CATSGAME = 'draw';
const RESULT_X = 'x';
const RESULT_O = 'o';

// Return 'true' if the array contains the value, 'false' otherwise
function contains(value, array){
  return array.filter(function(val){return val === value;}).length > 0;
}

// Check a given group for the winner or unsolved result.
function checkGroup(group) {
  if (contains(CELL_EMPTY, group)) { return RESULT_UNSOLVED; }
  else if (contains(CELL_X, group) && !contains(CELL_O,group)) { return RESULT_X; }
  else if (contains(CELL_O, group) && !contains(CELL_X,group)){ return RESULT_O; }
  else { return RESULT_UNSOLVED; }
}

// For each "row" group, check for a winner
function checkRows(board) {
  for (var i = 0; i < board.length; ++i) {
    var rowResult = checkGroup(board[i]);
    if (rowResult !== RESULT_UNSOLVED) { return rowResult; } // found a winner :)
  }
  return RESULT_UNSOLVED; // didn't find a winner :(
}

// For each "column" group check for a winner
function checkCols(board) {
  if (board.length === 0) {throw new Error("EMPTY BOARD!");}
  for (var col = 0; col < board[0].length; ++col){  // for each column
    var group = board.map(function(row){return row[col]});
    var colResult = checkGroup(group);
    if (colResult !== RESULT_UNSOLVED) { return colResult; } // found a winner!
  }
  return RESULT_UNSOLVED; // no winner O_o
}

// for each "diagonal" group, check for a winner.
function checkDiagonals(board){
  diagonalGroups = [];
  diagonalGroups.push([board[0][0],board[1][1], board[2][2]]);
  diagonalGroups.push([board[2][0],board[1][1], board[0][2]]);
  for (var i = 0; i < diagonalGroups.length; ++i) {
    var groupResult = checkGroup(diagonalGroups[i]);
    if (groupResult !== RESULT_UNSOLVED) { return groupResult; }
  }
  return RESULT_UNSOLVED;

}

// Check if all the cells have been filled in.
function checkGameFinished(board) {
  for (var i = 0; i < board.length; ++i) {
    for (var j = 0; j < board[i].length; ++j) {
      if (board[i][j] === CELL_EMPTY) { return false; }
    }
  }
  return true;
}

// Check if solved and return the solution
function isSolved(board) {
  var functions = [checkRows, checkCols, checkDiagonals];
  for (var i = 0; i < functions.length; ++i) {
    var result = functions[i](board);
    if (result !== RESULT_UNSOLVED) { return result; };
  }
  if (checkGameFinished(board)) { return RESULT_CATSGAME; }
  return RESULT_UNSOLVED
}

module.exports = isSolved;
