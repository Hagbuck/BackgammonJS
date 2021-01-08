/********************************************
 * ............. BackgammonJS ............. *
 * file : draw.js ......................... *
 * author : Vuillemin Anthony ............. *
 *******************************************/

let dice_map = new Map();
dice_map[1] = [{x : .5, y : .5}];
dice_map[2] = [{x : 1/4, y : 1/4}, {x : 3/4, y : 3/4}];
dice_map[3] = [{x : 1/4, y : 1/4}, {x : .5, y : .5}, {x : 3/4, y : 3/4}];
dice_map[4] = [{x : 1/4, y : 1/4}, {x : 3/4, y : 1/4}, {x : 1/4, y : 3/4}, {x : 3/4, y : 3/4}];
dice_map[5] = [{x : 1/4, y : 1/4}, {x : 3/4, y : 1/4}, {x : .5, y : .5}, {x : 1/4, y : 3/4}, {x : 3/4, y : 3/4}];
dice_map[6] = [{x : 1/4, y : 1/4}, {x : 3/4, y : 1/4}, {x : 1/4, y : .5}, {x : 3/4, y : .5}, {x : 1/4, y : 3/4}, {x : 3/4, y : 3/4}];


function draw_triangle(ctx, points, color){
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.lineTo(points[0].x, points[0].y);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();
}

function draw_dice(ctx, x, y, l, color, value){
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.rect(x, y, l ,l);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    for(let pid in dice_map[value]){
        let point = dice_map[value][pid];
        draw_disc(ctx, x + l * point.x, y + l * point.y, l/10, "#000000");
    }
   
}

function draw_disc(ctx, x, y, radius, color){
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.closePath()

    ctx.fillStyle = color;
    // if(mouse && ctx.isPointInPath(mouse.x, mouse.y)){
    //     ctx.fillStyle = (player == owner) ? "#00FF00" : "#FF0000";
    // }
    ctx.fill();
    ctx.stroke();
}

export function get_out_box_width(config, cnv, board){
    return get_pawn_radius(config, cnv, board) * 2 + 2 * config.out_border_size;
}

export function get_row_width(config, cnv, board){
    return (cnv.width - get_out_box_width(config, cnv, board)) / (board.rows.length / 2);
}

function get_height_triangle(config, cnv){
    return (cnv.height / 2) * config.height_triangle_coef;
}

export function get_pawn_radius(config, cnv, board){
    return get_height_triangle(config, cnv) / (config.max_pawns_row - 1) / 2; // -1  allow one pawn to overflow the triangle
}

export function draw(config, cnv, board, player, selected_row = null, possibles_moves = [], rands = [], player_turn = 0){
    let ctx = cnv.getContext("2d");
    ctx.clearRect(0, 0, cnv.width, cnv.height);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000000";
    let width = cnv.width;
    const height = cnv.height;

    if(player == 2){
        ctx.translate(width, height);
        ctx.rotate(Math.PI);
    }

    /* background color */
    ctx.fillStyle = config.board_color;
    ctx.fillRect(0, 0, width, height);

    /* OUT boxes */
    let out_size = get_out_box_width(config, cnv, board);

    ctx.fillStyle = config.p2_color;
    ctx.fillRect(width - out_size, 0, out_size, height / 2);
    ctx.fillStyle = config.board_color;
    ctx.fillRect(width - out_size + config.out_border_size, config.out_border_size, out_size - 2*config.out_border_size, height / 2 - 2*config.out_border_size);

    let pawn_size_w = out_size - 2 * config.out_border_size - 4;
    let pawn_size_h = (height / 2 - 2 * config.out_border_size) / config.number_pawn_per_player;

    ctx.fillStyle = config.p2_color;
    for(let i = 0; i < board.out2; ++i){
        ctx.fillRect(width - out_size + config.out_border_size + 2, config.out_border_size + 2 + i * pawn_size_h,
            pawn_size_w, pawn_size_h);
    }

    ctx.fillStyle = config.p1_color;
    ctx.fillRect(width - out_size, height / 2, out_size, height / 2);
    ctx.fillStyle = config.board_color;
    ctx.fillRect(width - out_size + config.out_border_size, height / 2 + config.out_border_size, out_size - 2*config.out_border_size, height / 2 - 2*config.out_border_size);

    ctx.fillStyle = config.p1_color;
    for(let i = 0; i < board.out1; ++i){
        ctx.fillRect(width - out_size + config.out_border_size + 2, height / 2 + config.out_border_size + 2 + i * pawn_size_h,
            pawn_size_w, pawn_size_h);
    }

    /* Separate the four square */
    ctx.lineWidth = 1;
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);

    ctx.moveTo((width - out_size) / 2, 0);
    ctx.lineTo((width - out_size) / 2, height);

    ctx.moveTo(width - out_size, 0);
    ctx.lineTo(width - out_size, height);

    ctx.stroke();

    /* to hoverflow the out boxes */
    width -= out_size;

    /* Draw the Rows */
    ctx.lineWidth = 0;
    const base_triangle = get_row_width(config, cnv, board);
    const height_triangle = get_height_triangle(config, cnv);
    
    // TOP triangles
    for(let i = 0; i < board.rows.length / 2; ++i){
        let x = i * base_triangle;
        let triangle = [
            {x : x, y : 0},
            {x : x + base_triangle / 2, y : height_triangle},
            {x : x + base_triangle, y : 0}
        ];
        let color = (i % 2 != 0) ? config.p1_color : config.p2_color;
        //if(selected_row != null && i == board.rows.length / 2 - selected_row - 1) color = config.selected_color;
        if(possibles_moves.includes(board.rows.length / 2 - i - 1)) color = config.purpose_color;
        draw_triangle(ctx, triangle, color);
    }

    // BOT triangles
    for(let i = 0, j = board.rows.length / 2; j < board.rows.length; ++i, ++j){
        let x = i * base_triangle;
        let triangle = [
            {x : x, y : height},
            {x : x + base_triangle / 2, y : height - height_triangle},
            {x : x + base_triangle, y : height}
        ];

        let color = (i % 2 == 0) ? config.p1_color : config.p2_color;
        //if(selected_row != null && j == selected_row) color = config.selected_color;
        if(possibles_moves.includes(j)) color = config.purpose_color;
        draw_triangle(ctx, triangle, color)
    }

    /* Draw Pawns */
    ctx.font = '18px serif';
    const pawn_radius = get_pawn_radius(config, cnv, board);

    for(let i = 0; i < board.rows.length; ++i){
        let owner = board.rows[i].owner;
        let number = board.rows[i].number;

        if(number > 0 && owner != null){
            let x, y;
            if (i < board.rows.length / 2){
                x = width - base_triangle / 2 - i * base_triangle;
                y = pawn_radius;
            }
            else{
                x = base_triangle / 2 + (i - board.rows.length / 2) * base_triangle;
                y = height - pawn_radius;
            }

            for(let j = 0; j < number && j < config.max_pawns_row; ++j){
                let color = (owner == 1) ? config.p1_color : config.p2_color;
                if(selected_row && selected_row.type == "row" && i == selected_row.row_id && (j == number-1 || j == config.max_pawns_row -1)) color = config.selected_color;
                draw_disc(ctx, x, y, pawn_radius, color);

                if(j == config.max_pawns_row - 1 && number > config.max_pawns_row){
                    ctx.fillStyle = '#000000';
                    ctx.fillText(number, x - 5, y + 5);
                }

                y += (i < board.rows.length / 2) ? pawn_radius * 2 : -(pawn_radius * 2);
            }
        }
    }
    // Draw middle pawns 
    let y = (board.middle2 == 0) ? height / 2 : height / 2 - pawn_radius;
    let w = board.middle1 * pawn_radius / 2 + pawn_radius / 2;
    for(let i = 0; i < board.middle1; ++i){
        let x = width / 2 + (i+1) * pawn_radius - w;
        let color = config.p1_color;
        if(player == 1 && selected_row && selected_row.type == "middle" && i == board.middle1 - 1) color = config.selected_color;
        draw_disc(ctx, x, y , pawn_radius, color);
    }
    y = (board.middle1 == 0) ? height / 2 : height / 2 + pawn_radius;
    w = board.middle2 * pawn_radius / 2 + pawn_radius / 2;
    for(let i = 0; i < board.middle2; ++i){
        let x = width / 2 + (i+1) * pawn_radius  - w;
        let color = config.p2_color;
        if(player == 2 && selected_row && selected_row.type == "middle" && i == board.middle2 - 1) color = config.selected_color;
        draw_disc(ctx, x, y , pawn_radius, color);

    }

    // Draw dices
    let x;
    let l = base_triangle / 2;
    y = height / 2 - l / 2;
    let color;
    let coef = 1;

    if(player_turn == 0 && rands.length == 2){ // First throw
        draw_dice(ctx, width - l, y, l, config.p1_color, rands[0]);
        draw_dice(ctx, 0, y, l, config.p2_color, rands[1]);
    } else {
        if(player_turn == 1){
            x = width - l;
            coef = -1;
            color = config.p1_color;
        } else {
            x = 0;
            color = config.p2_color;
        }
    
        for(let i = 0; i < rands.length; ++i){
            draw_dice(ctx, x + coef*i * l, y, l, color, rands[i]);
        }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
}