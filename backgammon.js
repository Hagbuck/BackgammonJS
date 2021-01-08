/********************************************
 * ............. BackgammonJS ............. *
 * file : backgammon.js ................... *
 * author : Vuillemin Anthony ............. *
 *******************************************/

const config = {
    board_size : 24,
    number_pawn_per_player : 15,
    pawns_begin : {
        0 : {
            owner : 1,
            number : 2,
        },
        5 : {
            owner : 2,
            number : 5,
        },
        7 : {
            owner : 2,
            number : 3,
        },
        11 : {
            owner : 1,
            number : 5,
        },
        12 : {
            owner : 2,
            number : 5,
        },
        16 : {
            owner : 1,
            number : 3,
        },
        18 : {
            owner : 1,
            number : 5,
        },
        23 : {
            owner : 2,
            number : 2,
        },
    },
}

/* EASY MOD -> DEBUG MOD */
config.number_pawn_per_player = 2;
config.pawns_begin = { 20 : { owner: 1, number:2}, 3 : { owner: 2, number:2}};
//config.pawns_begin = { 1 : { owner: 1, number:2}, 2 : { owner: 1, number:2}, 3 : { owner: 1, number:2}, 6 : { owner: 2, number:2}};
exports.config = config;

class Board{
    constructor(){
        this.reset();
    }
    reset() {
        this.out1 = 0;
        this.out2 = 0;

        this.middle1 = 0;
        this.middle2 = 0;

        this.rows = [];
        for(let i = 0; i < config.board_size; ++i){
            let r = (config.pawns_begin[i]) ? new Row(config.pawns_begin[i].owner, config.pawns_begin[i].number) : new Row();
            this.rows.push(r);
        }
    }
}
exports.Board = Board;

class Row {
    constructor(owner = null, number = 0){
        this.owner = owner;
        this.number = number;
    }
}
exports.Row = Row;

function throw_rand(){
    let r = [];
    for(let i = 0; i < 2; ++i)
        r.push(Math.floor(Math.random() * 6) + 1);

    // If double, we can play each move twice
    if(r.every( (val, i, arr) => val == arr[0]))
        r = r.concat(r);

    let rands = [];
    r.forEach(e => rands.push({value : e, playable : false}));
    return rands;
}
exports.throw_rand = throw_rand;

function does_player_win(board, player){
    if(player == 1 && board.out1 == config.number_pawn_per_player) return true;
    else if(player == 2 && board.out2 == config.number_pawn_per_player) return true;
    return false;
}
exports.does_player_win = does_player_win;

function get_possibles_moves(board, player, rands, from){
    let moves = [];
    let r = [...rands];
    r.push(rands.reduce((a, b) => a + b));

    for(let i = 0; i < r.length; ++i){
        let idx = (player == 1) ? from + r[i] : from - r[i];
        if(idx < board.rows.length && idx >= 0 && (board.rows[idx].owner == null || board.rows[idx].owner == player)){
            moves.push(idx);
        }
    }
    return moves;
}
exports.get_possibles_moves = get_possibles_moves;

function can_play_out(board, player){
    let start, end;
    if(player == 1){
        start = 0;
        end = board.rows.length - board.rows.length / 4;
    } else {
        start = board.rows.length / 4;
        end = board.rows.length
    }
    
    for(let i = start; i < end; ++i){
        if(board.rows[i].owner == player)
            return false;
    }
    return true;
}
exports.can_play_out = can_play_out;

function is_move_out(board, player, from, move){
    if(player == 1){
        if(from + move.value >= board.rows.length)
            return true;
    } else {
        if(from - move.value < 0)
            return true;
    }
    return false;
}
exports.is_move_out = is_move_out;

function does_row_can_be_eat(board, player, row_id){
    if(row_id >= 0 && row_id < board.rows.length){
        if(board.rows[row_id].owner == 3 - player // Row belong to the other player
        && board.rows[row_id].number == 1){     // There is one pawn on the row
            return true;
        }
    }
    return false;
}

function out_pawn(board, player, from){
    --board.rows[from].number;
    if(board.rows[from].number == 0)
        board.rows[from].owner = null;
    if(player == 1) ++board.out1;
    else ++board.out2;
}
exports.out_pawn = out_pawn;

function move(board, player, from, to, move){
    if(is_move_out(board, player, from.row_id, move)){
        out_pawn(board, player, from.row_id);
    } else {
        if(from.type == "row"){
            --board.rows[from.row_id].number;

            if(board.rows[from.row_id].number == 0)
                board.rows[from.row_id].owner = null;
        }
        else if(from.type == "middle"){
            if(player == 1) --board.middle1;
            else --board.middle2;
        } 

    if(does_row_can_be_eat(board, player, to.row_id)){
        --board.rows[to.row_id].number;
        board.rows[to.row_id].owner = null;
        if(player == 1) ++board.middle2;
        else ++board.middle1;
    }
    
    ++board.rows[to.row_id].number;
    if(board.rows[to.row_id].owner == null)
        board.rows[to.row_id].owner = player;

    }
}
exports.move = move;

function get_playable_rands(board, player, rands){
    let playable_moves = [...rands];

    let middle = (player == 1) ? board.middle1 : board.middle2;

    if(middle <= 0){
        for(let i = 0; i < playable_moves.length; ++i){
            let move = playable_moves[i];
            for(let j = 0; j < board.rows.length; ++j){
                if(board.rows[j].owner == player){
                    let from = {row_id : j, type : "row"};
                    let to = {row_id : (player == 1) ? from.row_id + move.value : from.row_id - move.value, type : "row"};
    
                    if(is_valid_move(board, player, from, to, [move]) != -1){
                        move.playable = true;
                        break;
                    }
                }
            }
        }
    } else {
        for(let i = 0; i < playable_moves.length; ++i){
            let move = playable_moves[i];
            let from = {row_id : (player == 1) ? -1 : board.rows.length, type : "middle"};
            let to = {row_id : (player == 1) ? from.row_id + move.value : from.row_id - move.value, type : "row"};

            if(is_valid_move(board, player, from, to, [move]) != -1){
                move.playable = true;
            }
        }
    }

    return playable_moves;
}
exports.get_playable_rands = get_playable_rands;

function is_to_valid(board, player, from_id, to_id, rands){
    if(from_id < 0 || from_id >= board.rows.length || to_id < 0 || to_id >= board.rows.length)
        return -1;

    if(board.rows[to_id].owner == player || board.rows[to_id].owner == null // Check if the dest row doesn't belong to your opponent
    || does_row_can_be_eat(board, player, to_id)){                     // Or if you can eat (1 opponent pawn on it)
        let jump = Math.abs(from_id - to_id);

        if(player == 1 && to_id > from_id
        || player == 2 && from_id > to_id){
            let idx = rands.findIndex(e => e.value == jump);
            if(idx != -1){
                return idx;
            }
        }
    }
    return -1;
}

/**
 * Check if a move is valid and return the id of the random throw to remove
 * @param {*} board 
 * @param {*} player 
 * @param {*} from 
 * @param {*} to 
 * @param {*} rands 
 */
function is_valid_move(board, player, from, to, rands) {
    let from_id = from.row_id;
    let to_id = to.row_id;
    let middle = (player == 1) ? board.middle1 : board.middle2;

    console.log(from_id + " : " + to_id);

    if(from.type == "row"){
        if(board.rows[from_id].owner == player && middle == 0){ // Check if from is playable
            if(to.type == "out" /*|| to_id >= board.rows.length || to_id < 0*/){ // Ask for take out
                if(can_play_out(board, player)){ // Check if the player can play out : all pawns are in the last square
                    for(let i = 0; i < rands.length; ++i){
                        if(is_move_out(board, player, from_id, rands[i])){
                            return rands.indexOf(rands[i]);
                        }
                    }
                }
            } else { // Normal move
                return is_to_valid(board, player, from_id, to_id, rands);
            }
        }
    } else if (from.type == "middle"){
        return is_to_valid(board, player, from_id, to_id, rands);
    }
    return -1
}
exports.is_valid_move = is_valid_move;