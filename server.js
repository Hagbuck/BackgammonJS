/********************************************
 * ............. BackgammonJS ............. *
 * file : server.js ....................... *
 * author : Vuillemin Anthony ............. *
 *******************************************/

const { builtinModules } = require("module");

let express = require("express"),
    http = require("http"),
    io = require("socket.io")(http),
    bkgm = require("./backgammon")
;

let config = {
    port : 8080,
}

let app = express();

app.use(express.static("public"));
app.set("port", process.env.PORT || config.port);
let server = http.createServer(app).listen(app.get("port"), () => {
    console.log(`Server running on port ${config.port}`);
});
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

let GAMES = [];

function create_new_game(){
    let game = {
        id : 0,
        open : true,
        ended : false,
        p1_socket : null,
        p1_name : "",
        p2_socket : null,
        p2_name : "",
        board : new bkgm.Board(),
        player_turn : 1,
        last_throw : []
    };
    game.id = GAMES.push(game) - 1;
    return game;
}

function get_game_by_id(id){
    id = parseInt(id);
    return GAMES.find(x => x.id == id);
}

function does_socket_belong_game(socket, game){
    if(socket.id == game.p1_socket || socket.id == game.p2_socket)
        return true;
    return false;
}

function get_current_player_from_socket(socket, game){
    if(socket.id == game.p1_socket) return 1;
    else if(socket.id == game.p2_socket) return 2;
    else return null;
}

function get_current_player_name_from_socket(socket, game){
    if(socket.id == game.p1_socket) return game.p1_name;
    else if(socket.id == game.p2_socket) return game.p2_name;
    else return null;
}

io.listen(server);
io.on("connection", (socket) => {
    socket.on("create", (obj) => {
        let game = create_new_game();
        game.p1_socket = socket.id;
        game.p1_name = obj.name;
        console.log(`${game.p1_socket} Create new game :  ${game.id}`);
        socket.emit("create_res", { game_id : game.id, board : game.board });
    });

    socket.on("leave", (obj) => {
        let game = get_game_by_id(obj.game_id);
        console.log(`${socket.id} try to close game ${obj.game_id}`);
        if(game != undefined && game.ended == false){
            console.log(`P1 : ${game.p1_socket} P2 : ${game.p2_socket}`);
            if(does_socket_belong_game(socket, game)){
                io.to(game.p1_socket).emit("back_lobby");
                io.to(game.p2_socket).emit("back_lobby");
                game.ended = true;
            } else {
                socket.emit("error", { msg : "You can't close this game "});
            }
        } else {
            socket.emit("error", { msg : "You can't close this game, because it doesn't exist "});
        }
    });

    socket.on("join", (obj) => {
        let game = get_game_by_id(obj.game_id);

        if(game == undefined || game.ended == true){
            socket.emit("error", { msg : "Game doesn't exist"});
        } else if(game.open == false){
            socket.emit("error", { msg : "Game is already full "});
        } else {
            console.log(`${socket.id} join game ${game.id}`);
            game.p2_socket = socket.id;
            game.p2_name = obj.name;
            game.open = false;
            socket.emit("join_res", { game_id : game.id, board : game.board });

            io.to(game.p1_socket).emit("game_filled", {opponent_name : game.p2_name });
            io.to(game.p2_socket).emit("game_filled", {opponent_name : game.p1_name });
        }
    });

    socket.on("ask_throw", (obj) => {
        let game = get_game_by_id(obj.game_id);
        let curr_player = get_current_player_from_socket(socket, game);
        let player_name = get_current_player_name_from_socket(socket, game);

        if(game == undefined || game.ended == true){
            socket.emit("error", { msg : "Game doesn't exist"});
        } else if(does_socket_belong_game(socket, game)){
            
            let is_validated = false;
            let msg = `${player_name} ask throw dices. `;

            if(game.p1_socket == null || game.p2_socket == null){
                msg += "Please wait your opponent";
            }
            else if(curr_player != game.player_turn){ // Check player turn
                msg += "It's his your turn";
            } else if(game.last_throw.length > 0){
                msg += "You have some move to play !";
            } else {
                is_validated = true;
                game.last_throw = bkgm.get_playable_rands(game.board, curr_player, bkgm.throw_rand());
                msg = `${get_current_player_name_from_socket(socket, game)} trow dices`;
                console.log(msg);
            }
            io.to(game.p1_socket).emit("get_throw", { throw : game.last_throw, validated : is_validated, msg : msg});
            io.to(game.p2_socket).emit("get_throw", { throw : game.last_throw, validated : is_validated, msg : msg});
        } else {
            socket.emit("error", { msg : "You can't play in this game"});
        }
    });

    socket.on("ask_move", (obj) => {
        let game = get_game_by_id(obj.game_id);
        
        if(game == undefined || game.ended == true){
            socket.emit("error", { msg : "Game doesn't exist"});
        } else if(does_socket_belong_game(socket, game)){
            let player_name = get_current_player_name_from_socket(socket, game);
            let msg = `${player_name} move (${obj.from.row_id}:${obj.to.row_id}). `;
            console.log(msg);
            let curr_player = get_current_player_from_socket(socket, game);
            let is_validated = false;
            let is_win = false;

            if(game.p1_socket == null || game.p2_socket == null){
                msg += "Please wait your opponent";
            } else if(curr_player != game.player_turn){ // Check player turn
                msg += "It's his your turn";
            } else if(game.last_throw.length == 0){ // Check if dices have been thrown
                msg += "You must throw the dices"; 
            } else {

                if(obj.from.type == "middle"){
                    if(curr_player == 1) obj.from.row_id = -1;
                    else obj.from.row_id = game.board.rows.length;
                }

                const move_id = bkgm.is_valid_move(game.board, curr_player, obj.from, obj.to, game.last_throw);

                if(move_id >= 0){
                    is_validated = true;
                    bkgm.move(game.board, curr_player, obj.from, obj.to, game.last_throw[move_id]);
                    game.last_throw.splice(move_id, 1);
                    game.last_throw = bkgm.get_playable_rands(game.board, curr_player, game.last_throw);

                    if(bkgm.does_player_win(game.board, curr_player)){
                        is_win = true;
                    }

                    if(game.last_throw.length == 0) {
                        if(curr_player == 1) game.player_turn = 2;
                        else game.player_turn = 1;
                        io.to(game.p1_socket).emit("end_turn", {player_turn : game.player_turn});
                        io.to(game.p2_socket).emit("end_turn", {player_turn : game.player_turn});
                    }

                } else {
                    msg += "Move is refused !";
                }
            }
            
            let res = { 
                from : obj.from,
                to : obj.to,
                validated : is_validated,
                win : is_win,
                winner : (is_win) ? player_name : null,
                throw : game.last_throw,
                msg : msg,
                board : game.board
            };
            io.to(game.p1_socket).emit("res_move", res);
            io.to(game.p2_socket).emit("res_move", res);
        
        } else {
            socket.emit("error", { msg : "You can't play in this game" });
        }
    });

    socket.on("ask_skip", (obj) => {
        let game = get_game_by_id(obj.game_id);
        
        if(game == undefined || game.ended == true){
            socket.emit("error", { msg : "Game doesn't exist"});
        } else if(does_socket_belong_game(socket, game)){
            let player_name = get_current_player_name_from_socket(socket, game);
            let msg = `${player_name} ask skip. `;
            console.log(msg);
            let curr_player = get_current_player_from_socket(socket, game);
            let is_validated = true;

            if(game.p1_socket == null || game.p2_socket == null){
                msg += "Please wait your opponent";
            } else if(curr_player != game.player_turn){ // Check player turn
                msg += "It's not his turn";
            } else if(game.last_throw.length == 0){ // Check if dices have been thrown
                msg += "You must throw the dices"; 
            } else {
                for(let r in game.last_throw){
                    if(r.playable == true){
                        is_validated = false;
                        msg += ". Skip refused !";
                        break;
                    }
                }
                if(is_validated){
                    msg += "Skip validated";
                    if(curr_player == 1) game.player_turn = 2;
                    else game.player_turn = 1;
                    game.last_throw = [];
                    io.to(game.p1_socket).emit("end_turn", {player_turn : game.player_turn});
                    io.to(game.p2_socket).emit("end_turn", {player_turn : game.player_turn});                    
                }            
            }
            io.to(game.p1_socket).emit("res_skip", { validated : is_validated, msg : msg});
            io.to(game.p2_socket).emit("res_skip", { validated : is_validated, msg : msg});
        }
    });

    socket.on("disconnect", () => {
        // disconnect current game and send to the oppenent he wins by disconnect
        GAMES.forEach((game) => {
            if(game.p1_socket == socket.id || game.p2_socket == socket.id){
                io.to(game.p1_socket).emit("back_lobby");
                io.to(game.p2_socket).emit("back_lobby");
                game.ended = true;
            }
        });
    });
});