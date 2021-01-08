/********************************************
 * ............. BackgammonJS ............. *
 * file : name-generator.js ............... *
 * created : 2020-12-13 ................... *
 * author : Vuillemin Anthony ............. *
 *******************************************/

let pre = ["", "XXX", "xxx", "xXx", "Dark", "Light", "Master", "Noob", "Expert", "Pussy", "Emperator", "Fat", "Cutty", "The", "Epic"];

let mid = ["Explorer", "Killer", "Sasuke", "Fire", "Kitty", "Bob", "Farmer", "Destroyer"];

let su = ["", "XXX", "xXx", "xxx"];

function get_rand_number(){
    let how_many = Math.floor(Math.random() * Math.floor(3)) + 1;
    let nb = "";
    for(let i = 0; i < how_many; ++i)
        nb += Math.floor(Math.random() * Math.floor(9)).toString();
    return nb;
}

export function generate_name(is_pre = true, is_su = true){
    let name = "";
    if(is_pre) name += pre[Math.floor(Math.random() * Math.floor(pre.length))];
    name += mid[Math.floor(Math.random() * Math.floor(mid.length))];
    if(is_su){
        if(Math.floor(Math.random() * Math.floor(2)) == 1)
            name += su[Math.floor(Math.random() * Math.floor(su.length))];
        else
            name += get_rand_number();
    }
    return name;
}

$(document).ready(() => {
    $("#name").val(generate_name());
    $("#rand_name").click(() => {
        $("#name").val(generate_name());
    })
})