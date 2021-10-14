class Person{
    constructor(name){
        this.name = name;
        this.hand = "none";
    }
}

const server = require('ws').Server;
const ws = new server({port: 8888});
let person = [];

ws.on('connection', socket => {
    console.log('connected');
    bcNameInfo();

    socket.on('message', msg => {
        msg = JSON.parse(msg);

        if(msg.method == "join"){
            addPerson(msg.name);

        }else if(msg.method == "decide"){
            console.log(`decide hand(${msg.name}): ${msg.hand}`);
            setHand(msg.name, msg.hand);
            bcCurrentStat();
            if(isAllReady()){
                console.log("all ready");
                bcAllHands();
            }

        }else if(msg.method == "leave"){
            deletePerson(msg.name);
            bcCurrentStat();
        }

    });

    socket.on('close', () => {
        console.log('byebye');
    });

});

function addPerson(name){
    console.log("person joined: " + name);
    //add person @ tail
    person.push(new Person(name));

    let joinRes =
    {
        "jsonrpc": "2.0",
        "method": "join",
        "name": `${name}`
    };

    //broadcast the msg about person joined
    ws.clients.forEach(client => {
        client.send(JSON.stringify(joinRes));
    });
    debug();
}

function deletePerson(name){
    console.log("person left: " + name);
    //delete personData which is matched to request
    for(let i = 0; i < person.length; i++){
        if(person[i].name == name){
            person.splice(i, 1);
            break;
        }
    }

    let leaveRes =
    {
        "jsonrpc": "2.0",
        "method": "leave",
        "name": `${name}`
    };    
    
    //broadcast the msg about person left
    ws.clients.forEach(client => {
        client.send(JSON.stringify(leaveRes));
    });
    debug();
}

function setHand(name, hand){
    for(let i = 0; i < person.length; i++){
        if(person[i].name == name){
            person[i].hand = hand;
            break;
        }
    }
}

//bc = broadcast
function bcCurrentStat(){
    let msg =
    {
        "jsonrpc": "2.0",
        "method": "status",
        "names": [],       
        "status": []        //"ready" or "voting"
    }

    for(let i = 0; i < person.length; i++){
        msg.names.push(person[i].name);
        //if ready
        if(person[i].hand != "none"){
            msg.status.push("ready");
        }else if(person[i].hand == "none"){
            msg.status.push("voting");
        }else{
            console.log(`invalid value @ person[${i}].hand`);
        }
    }

    console.log(msg);

    ws.clients.forEach(client => {
        client.send(JSON.stringify(msg));
    });

}

//broadcast result
function bcAllHands(){
    let msg =
    {
        "jsonrpc": "2.0",
        "method": "result",
        "names": [],       
        "hands": [],        //"ready" or "voting"
        "settle": "draw",
        "winners": []
    }
    
    for(let i = 0; i < person.length; i++){
        msg.names.push(person[i].name);
        msg.hands.push(person[i].hand);
    }

    let winners = judge();
    if(winners == false){
        msg.settle = "draw";
    }else{
        msg.settle = "settled";
        for(let i = 0; i < winners.length; i++){
            msg.winners.push(winners[i]);
        }
    }

    console.log(msg);

    ws.clients.forEach(client => {
        client.send(JSON.stringify(msg));
    });

    initHands();
}

function isAllReady(){
    for(let i = 0; i < person.length; i++){
        if(person[i].hand == "none"){
            return false;
        }
    }
    return true;
}

function judge(){
    if(person.length >= 2){
        let result = isSettled();
        if(result == false){
            return false;
        }else{
            let rocks = result[0];
            let scissors = result[1];
            let papers = result[2];
            console.log("rocks: " + rocks);
            console.log("scissors: " + scissors);
            console.log("papers: " + papers);
            let winners = [];
            let rockPpl = [];
            let scissorPpl = [];
            let paperPpl = [];

            for(let i = 0; i < person.length; i++){
                if(person[i].hand == "rock"){
                    rockPpl.push(person[i].name);
                }else if(person[i].hand == "scissor"){
                    scissorPpl.push(person[i].name);
                }else if(person[i].hand == "paper"){
                    paperPpl.push(person[i].name);
                }
            }


            if(rocks == 0){
                winners = scissorPpl;
            }else if(scissors == 0){
                winners = paperPpl;
            }else if(papers == 0){
                winners = rockPpl;
            }
            console.log("winners: " + winners);
            return winners;
        }
    }else{
        return false;
    }
}

//settled -> true, draw -> false
function isSettled(){
    let rocks = 0;
    let scissors = 0;
    let papers = 0;
    for(let i = 0; i < person.length; i++){
        if(person[i].hand == "rock"){
            rocks++;
        }else if(person[i].hand == "scissor"){
            scissors++;
        }else if(person[i].hand == "paper"){
            papers++;
        }
    }

    //when all hands appear
    if(rocks != 0 && scissors != 0 && papers != 0){
        return false;
    //all ppl take same hands
    }else if(rocks == person.length || scissors == person.length || papers == person.length){
        return false;
    }else{
        console.log([rocks, scissors, papers]);
        return [rocks, scissors, papers];
    }
}


function debug(){
    for(let i = 0; i < person.length; i++){
        console.log(person[i].name);
    }
}

function initHands(){
    for(let i = 0; i < person.length; i++){
        person[i].hand = "none";
    }
    bcCurrentStat();
}

function bcNameInfo(){
    names = getAllNames();
    let msg =
    {
        "jsonrpc": "2.0",
        "method": "namesInfo",
        "names": []
    }

    for(let i = 0; i < names.length; i++){
        msg.names.push(names[i]);
    }

    console.log("sent nameInfo");
    console.log(msg);
    
    ws.clients.forEach(client => {
        client.send(JSON.stringify(msg));
    });
}

function getAllNames(){
    let names = [];
    for(let i = 0; i < person.length; i++){
        names.push(person[i].name);
    }
    return names;
}
