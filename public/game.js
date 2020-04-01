var gameLoopInterval=500;
var playerName;
let gameId="";
var stage="";
let counter=0;
var responses=[];
var responseCounter=0;
var gameLoop;

////// HOST FUNCTIONALITY/////

function createGame(){
    console.log('posted request')
    $.post('./update',{request: 'createGame'}, function(data, status){
        if (status=="success"){
            console.log(data);
            hostWaitingRoom(JSON.parse(data))
        }else{
            console.error(status);
        }
    })
}
     
function hostWaitingRoom(data){
    //set game id
    gameId=data.id;

    //hide and show relevant elements
     $('#menu').hide();
     $('#hostWaitingRoom').show();

     //change elements onscreen
     $('#gameId').html(gameId);

     //start host game loop
     var gameLoop = setInterval(hostGameLoop, gameLoopInterval)
     stage = "waitingRoom"
}

function startTheFuckingGame(){
    $('#hostWaitingRoom').hide();
    $('#hostInstructions').show();
    console.log("Starting Game");
    $.post('/update', {request: 'startGame', id: gameId}, function(data, status){
        if (status == 'success'){
            stage = 'instructions';
        }else{
            alert('error starting game')
        }
    })
}


///// PLAYER FUNCTIONALITY ///////

function joinGame(){
    $.post('/update',{request:'joinGame', id:$('#joinGameId').val()}, function(data, status){
        console.log(status);
        if (data=='success'){
            gameId=$('#joinGameId').val();
            $('#menu').hide();
            $('#playerWaitingRoomStage').show();
        }else{
            alert('Game does not exist!')
        }
    })
}

function submitName(){
    $.post('/update', {request: 'submitName', id: gameId, name: $('#enterName').val()}, function(data, status){
        if (status=='success'){
            playerName=$('#enterName').val();
            stage = "waitingRoom"
            gameLoop= setInterval(playerGameLoop, gameLoopInterval)
            $("#nameEntry").hide();
            $("#playerWaitingRoom").show();
            $("#playerName").text("Welcome "+playerName)
            $("#instructions").text("Waiting for game to start!");

        }else{
            alert('Error submitting name, try again!');
        }
    })
}

function playerGameLoop(){
    //change behavior depending on the stage of the game
    switch (stage){
        case "waitingRoom":
            $.post('/update', {request: 'stage', id: gameId}, function(data, status){
                if(status == "success"){
                    if (data.stage == "openingInstructions"){
                        $("#instructions").text("Watch screen for instructions");
                    }else if (data.stage == 'writing'){
                        $.post('/update', {request: 'getPrompt', id: gameId}, function(data, status){
                            if (status=='success'){
                                $('#playerWaitingRoomStage').hide()
                                $('#playerWrite').show();
                                $('#prompt').text(data.prompt)
                                stage = 'writing';
                            }
                        })
                        
                    }
                }
            })
        break;

        case "writing":
            $.post('/update', {request: 'stage', id: gameId}, function(data, status){
                if(status=='success'){
                    if (data.stage == 'responses'){
                        $.post('/update',{request:'submitAd', id: gameId, title:$('#title').val(), body:$('#body').val()}, function(data, status){
                            if (status=='success'){
                                stage='responses';
                                $('#playerWrite').hide();
                                $('#playerResponses').show();
                            }
                        })
                    }
                }
            })
        break;

        case "responses":
            $.post('/update', {request: 'stage', id: gameId}, function(data, status){
                if(status=='success'){
                    if(data.stage=='voting'){
                        $('#playerResponses').hide();
                        $('#playerVoting').show();
                        $.post('/update', {request: 'getResponses', id:gameId}, function(data, status){
                            if(status=='success'){
                                for(let i=0; i<data.responses.length; i++){
                                    if(data.responses[i].title!=$('#title').val()){
                                        $('#ballot').append('<br><button onclick=\"vote(\''+data.responses[i].id+'\')\"><h1>'+data.responses[i].title+'</h1></button>')
                                    }
                                    }
                                stage='awaitVote'
                            }
                        })
                    }
                }
            })
        break;

        case "awaitNewGame":{
            $.post('/update', {request: 'stage', id:gameId}, function(data, status){
                if (status=="success"){
                    if (data.stage == 'writing'){
                        $.post('/update', {request: 'getPrompt', id: gameId}, function(data, status){
                            if (status=='success'){
                                $('#playerAwaitNewGame').hide()
                                $('#playerWrite').show();
                                $('#prompt').text(data.prompt)
                                stage = 'writing';
                            }
                        })  
                    }
                }
            })
        }
    }
}

function vote(voteId){
    console.log(voteId);
    console.log(gameId);
    $.post('/update', {request: 'vote', id: gameId, vote: voteId}, function(data, status){
        if(status=='success'){
            stage='awaitNewGame'
            $('#title').val("");
            $('#body').val("");
            $('#ballot').html("");
            $('#playerVoting').hide()
            $('#playerAwaitNewGame').show()
        }
    })
}

function hostGameLoop(){
    //change behavior depending on stage of the game
    switch (stage){
        case "waitingRoom":
            $.post("/update", {request: "names", id: gameId}, function(data, status){
                if (status=='success'){
                    $('#players').text(JSON.stringify(data))
                }
            })
        break;

        case "instructions":
            if (counter<30){
                $('#instructionsCounter').html("Game Starts In: <br>" + Math.ceil(15-counter/2));
                counter++;
            }else{
                $.post('/update', {request: 'startWriting', id: gameId}, function(data, status){
                    if (status == 'success'){
                        stage="write";
                        counter=0;
                        console.log('timer is up')
                    }
                })
            }
        break;

        case "write":
            $('#hostInstructions').hide();
            $('#hostWrite').show();
            if (counter<90){
                $('#writeTimer').html(Math.ceil(45-counter/2));
                counter++;
            }else{
                counter=0;
                $.post('/update', {request: 'stopWriting', id:gameId}, function(data, status){
                    if (status=='success'){
                        stage='getResponses';
                    }
                }) 
            }
        break;

        case "getResponses":
            $.post('/update', {request: 'getResponses', id: gameId}, function(data, status){
                if(status=="success"){
                    if(data.ready){
                        console.log(data);
                        responses = data.responses;
                        $('#hostWrite').hide();
                        $('#hostResponses').show();
                        stage="responses"
                    }else{
                        console.log('not ready')
                    }
                }
            })
        break;

        case "responses":
            if(responseCounter<responses.length){
                if (counter<30){
                    $('#responsePrompt').text("Catagory: "+ responses[responseCounter].prompt);
                    $('#responseTitle').text('\"'+responses[responseCounter].title+'\"');
                    $('#responseBody').text(responses[responseCounter].body);
                    $('#responsesCounter').html("Next Ad in: <br>" + Math.ceil(15-counter/2));
                    counter++;
                }else{
                   responseCounter++
                   counter=0;
                }
            }else{
                $.post('/update', {request: 'startVoting', id:gameId}, function(data, status){
                    if(status=='success'){
                        stage="voting"
                        $('#hostResponses').hide();
                        $('#hostVoting').show();
                    }
                })
            }

        break;

        case "voting":
            $.post('/update', {request: 'stage', id: gameId}, function(data, status){
                if(status=="success"){
                    if(data.stage=='results'){
                        $('#hostVoting').hide();
                        $('#hostResults').show();
                        stage='results';
                    }
                }
            })
        break;

        case "results":
            $.post('/update', {request: 'results', id: gameId}, function(data, status){
                if(status=='success'){
                    for(let i=0; i<data.length; i++){
                        $("#playerScores").append(data[i].name + ": " + data[i].score + "<br>")
                    }
                    stage='awaitNewGame'
                }
            })
        break;
    }
}

function nextRound(){
    $.post('/update', {request:"nextRound", id:gameId}, function(data, status){
        if (status=='success'){
            stage="write";
            counter=0;
            responses=[];
            responseCounter=0;
            $("#playerScores").html("");
            $("#hostResults").hide();
        }
    })
}