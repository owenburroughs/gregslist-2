const fs=require('fs');

fs.readFile("nounlist.txt", function(err, data){
    console.log(err);
   var words = data.toString().split('\n');
   setInterval(function(){
        console.log(words[Math.floor(Math.random()*words.length)])
   }, 5000)
})