var express = require('express')
var router = express.Router()
var fs = require('fs')
var words = [];

fs.readFile('nounlist.txt', function(error, data){
    words=data.toString().split('\n');
})



router.post('/', function(req, res){
    let data = req.body

    //switch for all update requests
    switch(data.request){

        //create a game
        case "createGame":
            createGame(req,res);
        break;

        //request for player to join game
        case "joinGame":
            let game = getGameById(data.id)
            if (typeof(game) == 'undefined'){
                //game does not exist
                res.send('noGame');
            }else{
                if(!getPlayerById(req.sessionID, game)){
                    game.players.push({id: req.sessionID, score:0});
                }
                res.send('success');
            }
        break;

        //player submits name
        case "submitName":
            getPlayerById(req.sessionID, getGameById(data.id)).name=data.name;
            res.send('foobar');
        break;

        //returns list of active names
        case "names":
            let players=[];
            for(let i=0; i< getGameById(data.id).players.length; i++){
                players.push(getGameById(data.id).players[i].name)
            }
            res.send(players);
        break;

        //returns stage of game with given ID
        case "stage":
           res.send({stage: getGameById(data.id).stage})
        break;

        //starts game with given id
        case "startGame":
            getGameById(data.id).stage='openingInstructions';
            res.status(200).end();
        break;

        //begins writing stage of game
        case "startWriting":
            getGameById(data.id).stage='writing'
            res.status(200).end();
        break;

        case 'getPrompt':
            let generatedPrompt = randomWord();
            getPlayerById(req.sessionID, getGameById(data.id)).prompt= generatedPrompt;
            res.send({prompt: generatedPrompt})
        break;

        case 'stopWriting':
            getGameById(data.id).stage='responses'
            res.status(200).end();
        break;

        case 'submitAd':
            getPlayerById(req.sessionID, getGameById(data.id)).title = data.title;
            getPlayerById(req.sessionID, getGameById(data.id)).body = data.body;
            getPlayerById(req.sessionID, getGameById(data.id)).ready = true;
            res.status(200).end()
        break;

        case 'getResponses':
            let responses=[];
            let ready;
            let activePlayers=getGameById(data.id).players;
            for(let i=0; i< activePlayers.length; i++){
                //check player is ready
                if(!activePlayers[i].ready){
                    ready = false;
                } else{
                    //add player's responses to game's response array
                    responses.push({
                        'id': activePlayers[i].id,
                        'prompt':activePlayers[i].prompt,
                        'title': activePlayers[i].title,
                        'body': activePlayers[i].body
                     })
                     ready=true;

                 }
                }
            res.send({
                'ready':ready,
                'responses':responses
                });
        break;

        case 'startVoting':
            getGameById(data.id).stage='voting'
            res.status(200).end();
        break;

        case 'vote':
            let tempStage='results'
            console.log(data.id);
            getPlayerById(data.vote, getGameById(data.id)).score++;
            getPlayerById(req.sessionID, getGameById(data.id)).voted = true;
            for(let i=0; i<getGameById(data.id).players.length; i++){
                if(!getGameById(data.id).players[i].voted){
                    tempStage='vote'
                }
            }
            getGameById(data.id).stage=tempStage;
        break;
        
        case 'results':
            res.send(getGameById(data.id).players);
        break;

        case 'nextRound':
            getGameById(data.id).stage="writing"
        break;
    }

    res.end();
})


//function to create a new game
function createGame(req, res){
     //Create a new game id, check it is not already used and game limit is not exceeded
     let idLength = 1000;
     if(games.length<idLength+1){
         var gameId=Math.round(Math.random()*idLength)
         let i=0;
         while (i<games.length){
             if (games[i].id==gameId){
                 gameId=Math.round(Math.random()*idLength);
                 i=0; 
             }else{
                 i++;
             }
         }
         //gameId is established
         //create new game
         let currentGame={
             'id': gameId,
             'owner': req.sessionID,
             'stage': 'pendingStart',
             'players':[],
         }
         games.push(currentGame)
 
         res.writeHead('200',{'Content-Type': 'text/HTML'})
         res.write(JSON.stringify(currentGame))
         res.end();
 
     }else{
         console.log("too many active games")
         res.status(300);
         res.end();
     }
}

//function to get a random word
function randomWord(){
    return words[Math.floor(Math.random()*words.length)];
}

const getGameById = (id) => {return games.find(game => game.id == id)};
const getPlayerById = (id, game) => {return game.players.find(player => player.id == id)}

module.exports = router;