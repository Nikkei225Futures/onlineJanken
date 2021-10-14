let svr = new WebSocket('ws://localhost:8888');
let playerNames = [];


function createConnection(){
    //detect name duplication
    let name = document.getElementById('name').value;
    for(let i = 0; i < playerNames.length; i++){
        if(name == playerNames[i]){
            addLog("name should be unique");
            return false;
        }
    }

    //delete submitButton to avoid duplication
    let submitButton = document.getElementById('nameSubmitBtn');
    submitButton.setAttribute("style", "display: none;");

    //send request of register
    let connectionReq = 
    {
        "jsonrpc": "2.0",
        "method": "join",
        "name": `${name}`
    };

    svr.send(JSON.stringify(connectionReq));
    console.log(`connectionRequest`);

}

function decideHand(hand){
    //user can decide their hand when they have already registered name
    let submitButton = document.getElementById("nameSubmitBtn");
    if(submitButton.hasAttribute("style")){
        let name = document.getElementById('name').value;
        let handReq = 
        {
            "jsonrpc": "2.0",
            "method": "decide",
            "name": `${name}`,
            "hand": `${hand}`
        };
    
        svr.send(JSON.stringify(handReq));
        console.log(`decisionRequest`);
    }else{
        addLog("register your name before playing");
    }
}

//when events happened
svr.addEventListener('open', () => {
    console.log('socket opened');
});

svr.addEventListener('message', msg => {
    msg = msg.data;
    //console.log(msg);
    msg = JSON.parse(msg);

    if(msg.method == "join"){
        console.log("person joined: " + msg.name);
        addLog(`${msg.name} joined the game`);
    }else if(msg.method == "leave"){
        console.log("person left: " + msg.name);
        addLog(`${msg.name} left the game`);
    }else if(msg.method == "status"){
        showStatus(msg.names, msg.status);
        console.log("status");
        console.log(msg);
    }else if(msg.method == "result"){
        showResult(msg.names, msg.hands, msg.settle, msg.winners);
        console.log("result:");
        console.log(msg);
    }else if(msg.method == "namesInfo"){
        playerNames = msg.names;
        console.log("namesInfo");
        console.log(playerNames);
    }
});

function showResult(names, hands, settle, winners){
    //delete prev data first
    let parent = document.getElementById("prevStats");
    parent.innerHTML = "";

    //update result
    for(let i = 0; i < names.length; i++){
        let newParagraph = document.createElement("pre");
        let sentence = document.createTextNode("loading");
        newParagraph.appendChild(sentence);
        newParagraph.setAttribute("class", "results");
        parent.insertBefore(newParagraph, parent.firstChild);  
    }

    let resultLists = document.getElementsByClassName("results");
    for(let i = 0; i < names.length; i++){
        resultLists[i].innerHTML = names[i] + ":&#009;" + hands[i];
    }

    let resultTitle = document.getElementById("prevResultTitle");
    if(settle == "draw"){
        resultTitle.innerHTML = "previous result: draw";
    }else{
        let winnerStr = "";
        for(let i = 0; i < winners.length; i++){
            winnerStr += winners[i];
            if(i != winners.length-1){
                winnerStr += ", ";
            }
        }
        resultTitle.innerHTML = "previous result: " + winnerStr + " won the game";
    }

}

function showStatus(names, status){
    //delete prev data first
    let parent = document.getElementById("status");
    parent.innerHTML = "";

    for(let i = 0; i < names.length; i++){
        let newParagraph = document.createElement("pre");
        let sentence = document.createTextNode("loading");
        newParagraph.appendChild(sentence);

        newParagraph.setAttribute("class", "person");
    
        parent.insertBefore(newParagraph, parent.firstChild);  
    }

    let statusLists = document.getElementsByClassName("person");
    for(let i = 0; i < names.length; i++){
        statusLists[i].innerHTML = names[i] + ":&#009;" + status[i];
    }
}

function addLog(message){
    let logs = document.getElementsByClassName("log");
    //rotate the logs
    for(let i = logs.length-1; i > 0; i--){
        if(logs[i-1].innerHTML != null){
            logs[i].innerHTML = logs[i-1].innerHTML;
        }
    }
    
    logs[0].innerHTML = message;
}



//close
function closeConnection(){
    let name = document.getElementById('name').value;
    let leaveReq = 
    {
        "jsonrpc": "2.0",
        "method": "leave",
        "name": `${name}`
    };

    svr.send(JSON.stringify(leaveReq));
    console.log(`leaveRequest`);
    console.log(leaveReq);

    svr.close(3005);
}

window.onunload = function(){
    closeConnection();
}