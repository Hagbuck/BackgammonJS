/********************************************
 * ............. BackgammonJS ............. *
 * file : backgammon-clien.js ............. *
 * author : Vuillemin Anthony ............. *
 *******************************************/

 import {draw, get_out_box_width, get_pawn_radius, get_row_width} from "./draw.js"

const config = {
    board_size : 24,
    number_pawn_per_player : 15,
    p1_color : "#9c4919",
    p2_color : "#cfab95",
    board_color : "#113610",
    selected_color : "#00FF00",
    purpose_color : "#00AA00",
    height_triangle_coef : 2 / 3,
    max_pawns_row : 5,
    out_border_size : 8,
    messages : {
        your_turn : "It's your turn",
        opponent_turn : "It's your opponent's turn",
        throw : "Please click on throw rand",
        error_throw_expected : "You can't perform this now, Please throw rand",
        error_throw : "You can't throw now",
        select_from : "Please select a pawn to move",
        select_to : "Please select a row to go",
        error_select_from : "You can't select this pawn because this row doesn't contain any of your pawns",
        error_select_from_out : "You can't select the out box to start a move",
        error_select_to : "You can't select this row because you can't send your pawn on it",
        error_select_to_out : "You can't move to outbox, you have some pawns outside your last square",
    }
}

class Sounds {
    constructor(){
        this.click_sound = new Audio("audio/click.mp3");
        this.move_sound = new Audio("audio/move.mp3");
        this.dices_sound = new Audio("audio/dices.mp3")
        this.enable = true;
    }

    set_enable(enable){
        this.enable = enable;
    }

    click(){
        if(this.enable) this.click_sound.play();
    }

    move(){
        if(this.enable) this.move_sound.play();
    }

    dices(){
        if(this.enable) this.dices_sound.play();
    }
}

class Position{
    constructor(){
        this.reset();
    }
    reset(){
        this.row_id = null;
        this.type = null; // [row, middle, out]
    }
    setToRow(){
        this.type = "row";
    }
    setToMiddle(){
        this.type = "middle";
        this.row_id = null;
    }
    setToOut(){
        this.type = "out";
    }
    equalTo(p){
        return this.row_id == p.row_id && this.type == p.type;
    }
    copy(p){
        this.row_id = p.row_id;
        this.type = p.type;
    }
}

function get_possibles_moves(board, player, rands, from){
    let moves = [];
    let r = [...rands];
    let middle = (player == 1) ? board.middle1 : board.middle2;
    //if(rands.length > 0) r.push(rands.reduce((a, b) => a + b));

    if(from.type == "row" && middle <= 0){
        for(let i = 0; i < r.length; ++i){
            let to = (player == 1) ? from.row_id + r[i] : from.row_id  - r[i];
            if((to < board.rows.length && to >= 0)
            && (
                (board.rows[to].owner == null || board.rows[to].owner == player)
                || (board.rows[to].owner == 3 - player && board.rows[to].number == 1))
            ){
                moves.push(to);
            }
        }
    } else if(from.type == "middle"){
        for(let i = 0; i < r.length; ++i){
            let to = (player == 1) ? -1 + r[i] : board.rows.length - r[i];

            if((board.rows[to].owner == null || board.rows[to].owner == player)
            || (board.rows[to].owner == 3 - player && board.rows[to].number == 1)){
                moves.push(to);
            }
        }
    }
    return moves;
}

function get_mouse_pos(cnv, evt){
    let rect = cnv.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function get_position_from_mouse(cnv, board, mouse, player){
    const box_width = get_out_box_width(config, cnv, board);
    const width = cnv.width - box_width;
    const height = cnv.height;

    const triangle_width = get_row_width(config, cnv, board);
    let pos = new Position();
    pos.setToRow();

    if(player == 1){
        if(mouse.x < width){
            pos.row_id = Math.floor((width - mouse.x) / triangle_width);

            if(mouse.y > height / 2){ // Bottom of screen -> Bottom rows
                pos.row_id = board.rows.length - pos.row_id - 1;
            }
        } else {
            pos.setToOut();
        }
    } else {
        if(mouse.x > box_width) {
            mouse.x -= box_width;
            pos.row_id = Math.floor((mouse.x) / triangle_width);

            if(mouse.y < height / 2){ // Top of screen -> Top rows
                pos.row_id = board.rows.length - pos.row_id - 1;
            }
            console.log(pos.row_id);
        } else {
            pos.setToOut();
        }
    }


    const pawn_radius = get_pawn_radius(config, cnv, board)
    const row_size = config.max_pawns_row * pawn_radius * 2;
    if(mouse.y > row_size && mouse.y < height - row_size){ // Between rows
        pos.setToMiddle();
    }

    return pos;
}

function clear_error(){
    $("#error").html("");
}

function resize_canvas(){
    let cnv = document.getElementById("board");
    cnv.width = .9 * window.innerWidth;
    cnv.height = .9 * (window.innerHeight
        - $("#game_info").innerHeight()
        - $("#player1_logo").innerHeight()
        - $("#player2_logo").innerHeight()
        );
    if(Object.keys(b).length > 0) draw(config, cnv, b, CURRENT_PLAYER, FROM_ROW, POSSIBLES_MOVES, RANDS, PLAYER_TURN);
}

let b = {};
let CURRENT_PLAYER = 1;
let PLAYER_TURN = 1;
let FROM_ROW = new Position();
let TO_ROW = new Position();
let RANDS = [];
let POSSIBLES_MOVES = [];
let audio = new Sounds();

/**
 * Game
 * 1. Throw rand
 * 2. Check possible moves
 * 3. Select pawn to move
 * 4. Select row to go
 * REPEAT FOR ALL MOVE
 */

$(document).ready(() => {
/*    $("#sounds").change(() => {
        if($("#sounds").prop("checked")) audio.set_enable(true);
        else audio.set_enable(false);
    });*/
    $("#sound_off").hide();
    $("#sounds").click(() => {
        if($("#sound_on").is(":visible")){
            $("#sound_on").hide();
            $("#sound_off").show();
            audio.set_enable(false);
        } else {
            $("#sound_on").show();
            $("#sound_off").hide();
            audio.set_enable(true);
            audio.click();
        }
    });
    $("#rand_button").click(() => {
        // audio.dices();
    });

    let cnv = document.getElementById("board");
    window.addEventListener("resize", resize_canvas);
    window.addEventListener("orientationchange", resize_canvas);
    resize_canvas();

    $("#player1_logo").css("background-color", config.p1_color);
    $("#player2_logo").css("background-color", config.p2_color);
    $("#board").on("load_board", (ev, board) => {
        b = board;
        FROM_ROW.reset();
        TO_ROW.reset();
        POSSIBLES_MOVES = [];
        draw(config, cnv, board, CURRENT_PLAYER);
    });
    $("#board").on("update_rand", (ev, rands) => {
        RANDS = [];
        rands.forEach(e => {RANDS.push(e.value)});
        draw(config, cnv, b, CURRENT_PLAYER, FROM_ROW, POSSIBLES_MOVES, RANDS, PLAYER_TURN);
    });
    $("#board").on("set_player_nb", (ev, id) => {
        CURRENT_PLAYER = id;
        if(CURRENT_PLAYER == 2){
            // Swap two player display
            $("#player1_box").insertBefore("#board");
            $("#player2_box").insertAfter("#board");
        }
    });
    $("#board").on("win", (ev, winner) => {
        alert(`${winner} win !`);
    });
    $("#board").on("end_turn", (ev, player_turn) => {
        PLAYER_TURN = player_turn;
    });
    $("#board").on("playaudio", (ev, sound) => {
        switch(sound){
            case "dices":
                audio.dices();
            break;
        }
    })

    $("#board").click((evt) => {
        if(CURRENT_PLAYER == PLAYER_TURN && RANDS.length > 0){
            clear_error();
            let mouse = get_mouse_pos(cnv, evt);
            let s_pos = get_position_from_mouse(cnv, b, mouse, CURRENT_PLAYER);
    
            if(s_pos.equalTo(FROM_ROW)){  // UNSELECT
                FROM_ROW.reset();
                TO_ROW.reset();
    
            } else if(FROM_ROW.type == null && FROM_ROW.row_id == null){    // SELECT FROM
                if(s_pos.type == "row" && s_pos.row_id >= 0 && s_pos.row_id < b.rows.length && b.rows[s_pos.row_id].owner == CURRENT_PLAYER){
                    FROM_ROW.copy(s_pos);
                    audio.click();
                } else if(s_pos.type == "middle" && (CURRENT_PLAYER == 1 && b.middle1 > 0 || CURRENT_PLAYER == 2 && b.middle2 > 0)){
                    FROM_ROW.copy(s_pos);
                    audio.click();
                } 
            } else { // SELECT TO
                TO_ROW = s_pos;
                audio.move();
                $("#board").trigger("move", ({from : FROM_ROW, to : TO_ROW}));
            }
    
            POSSIBLES_MOVES = get_possibles_moves(b, CURRENT_PLAYER, RANDS, FROM_ROW)
    
            draw(config, cnv, b, CURRENT_PLAYER, FROM_ROW, POSSIBLES_MOVES, RANDS, PLAYER_TURN);
        }
    });
});

