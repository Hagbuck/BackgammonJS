/********************************************
 * ............. BackgammonJS ............. *
 * file : name-txrx.js .................... *
 * author : Vuillemin Anthony ............. *
 *******************************************/

function clear_names(){
    $("#p1").html("");
    $("#p2").html("");
}

function swap_lobby_info(){
    if( $("#lobby").is(":visible")){
        $("#lobby").hide();
        $("#game_info").show();
    } else {
        $("#lobby").show();
        $("#game_info").hide();
    }
}

function update_rand(rands){
    $("#rand_box").empty();
    if(rands.length > 0) $("#skip_button").show();
    for(let i = 0; i < rands.length; ++i){
        if(rands[i].playable == true)
            $("#skip_button").hide();
        $(`<span class="rand_span">${rands[i].value}</span>`).addClass((rands[i].playable) ? 'playable' : 'unplayable').appendTo("#rand_box");
    }
    $("#board").trigger("update_rand", [rands]);
}

function get_game_id_json(){
    return { game_id : $("#game_id").text() };
}

$(document).ready(() => {
    $("#game_info").hide();
    $("#game").hide();
    $("#skip_button").hide();
    let socket = io();

    /*** LOBBY ***/
    $("#create_button").click(() => {
        $("#error_lobby").html("");
        socket.emit("create", { name : $("#name").val() });
    });

    $("#join_button").click(() => {
        $("#error_lobby").html("");
        socket.emit("join", { game_id : $("#game_id_input").val(), name : $("#name").val() })
    });

    $("#leave_button").click(() => {
        socket.emit("leave", get_game_id_json());
    });

    socket.on("back_lobby", () => {
        swap_lobby_info();
        clear_names();
        $("#game").hide();
    });

    socket.on("create_res", (obj) => {
        swap_lobby_info();
        $("#game").show();
        $("#game_id").html(obj.game_id)
        $("#p1").html(`You : ${$("#name").val()}`);

        $("#board").trigger('set_player_nb', 1);
        $("#board").trigger('load_board', obj.board);
    });

    socket.on("join_res", (obj) => {
        swap_lobby_info();
        $("#game").show();
        $("#game_id").html(obj.game_id)
        $("#p2").html(`You : ${$("#name").val()}`);

        $("#board").trigger('set_player_nb', 2);
        $("#board").trigger('load_board', obj.board);
    });


    socket.on("game_filled", (obj) => {
        let selector = "#p2";
        if($("#p2").html().length > 0) selector = "#p1";
        $(selector).html(`Him : ${obj.opponent_name}`);
    });

    socket.on("error", (obj) => {
        $("#error_lobby").html(obj.msg);
    });

    /*** GAME ***/
    $("#rand_button").click(() => {
        socket.emit("ask_throw", get_game_id_json());
    });
    document.body.onkeyup = function(e){
        if(e.key === ' '){
            socket.emit("ask_throw", get_game_id_json());
        }
    }

    socket.on("get_throw", (obj) => {
        $("#message").html(obj.msg);

        if(obj.validated){
            $("#board").trigger("playaudio", "dices");
            update_rand(obj.throw);
        }
    });

    $("#skip_button").click(() => {
        socket.emit("ask_skip", get_game_id_json());
    })

    socket.on("res_skip", (obj) => {
        $("#message").html(obj.msg);
        if(obj.validated == true){
            update_rand([]);
        }
    });

    $("#board").on("move", (ev, obj) => {
        let o = get_game_id_json();
        o.from = obj.from,
        o.to = obj.to;
        socket.emit("ask_move", o);
    });

    socket.on("res_move", (obj) => {
        $("#message").html(obj.msg);

        if(obj.validated){
            $("#board").trigger("load_board", obj.board);
            update_rand(obj.throw);
        }

        if(obj.win){
            $("#board").trigger("win", obj.winner);
        }
    });

    socket.on("end_turn", (obj) => {
        console.log(obj.player_turn)
        $("#board").trigger("end_turn", obj.player_turn);
    });
})