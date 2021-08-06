const fs = require("fs");
const https = require("https");
const http = require("http");
const url = require("url");


const {consumer_key, redirect_uri} = require("./auth/credentials.json"); // variables have to match with key

const tokens = [];  //tokens[0] = request tokens(code), tokens[1] = access_token, tokens[2] = username
const task = [];    // store the season(task[0]) and year (task[1])
const port = 3000;                                                  //enter ' localhost:3000' into the brower after this runs
const server = http.createServer();
server.on("listening", listen_handler);
server.listen(port);
function listen_handler(){
	console.log(`Listening on Port ${port}`);
}

server.on("request", request_handler);
function request_handler(req, res){
    console.log(`New Request from ${req.socket.remoteAddress} for ${req.url}`);
    if(req.url === "/"){                                            //when visit root page goto the html
        const form = fs.createReadStream("html/Forms_for_User.html");
		res.writeHead(200, {"Content-Type": "text/html"})
		form.pipe(res);
    }
    else if (req.url.startsWith("/anime_list")){                    //after fill out form from user
		let user_input = url.parse(req.url, true).query;            //get variable of form filled (year, season)
		if(user_input === null){                                    // if there is no input
			res.writeHead(404, {"Content-Type": "text/html"});
			res.end(`<h1>404 Content Not Found</h1>`);
		}
        const {year, sea} = user_input;                             //assign input
        task.push(sea);
        task.push(year);
        get_request_token(res);                                     //try to get request token to authenticate
    }
    else if(req.url.startsWith("/receive_code")){   // go here after getting the request token 
       get_access_token(tokens[0], res);                           // allow user to log in (need to pass the res[in order to redirect later on to pocket] and tokens[to use values]) 
    }
    else{
        res.writeHead(404, {"Content-Type": "text/html"});
		res.end(`<h1>404 Content Not Found</h1>`);
    }
}


function get_request_token(res){                                    // get the request token
    if (tokens.length !=0){
        find_task(tokens, res);
    }
    else{
        let url ='https://getpocket.com/v3/oauth/request';
        let options = {
            method: 'POST',
		    headers: { 
                'Content-Type': 'application/json; charset=UTF-8',
                'X-Accept': 'application/json'      //This tells us what format the server return to us json or x-www-form-urlencoded(default)
		    }
        }
        let auth = JSON.stringify({
		    consumer_key, redirect_uri
        });
    
        https.request(url, options, (token_stream) => process(token_stream, res)).end(auth); //process callback after getting request token
    }
}
function process(token_stream,res){ // go to the authorize page if authorize go to the redurct which is the http://localhost:3000/receive_code
    let body = "";
    token_stream.on("data", chunck => body += chunck);   // stream of data to String
    token_stream.on("end" , () => {
        if (body != undefined){
            /*body = body.split('=');       //this section for when server returns x-www-form-urlencoded form
            tokens.push(body[1]);
            const endp = `https://getpocket.com/auth/authorize?request_token=${body[1]}&redirect_uri=${redirect_uri}`;
            */
            let jsons = JSON.parse(body);
            tokens.push(jsons["code"]);
            redirectss(tokens,res);
        }
    });
}
function redirectss(token,res){
    const endp = `https://getpocket.com/auth/authorize?request_token=${token[0]}&redirect_uri=${redirect_uri}`;
    res.writeHead(302, {Location: `${endp}`}).end();
}
function get_access_token(code, res){ // from http://localhost:3000/receive_code go here with the request token to get the access code
    console.log(code);
    let url ='https://getpocket.com/v3/oauth/authorize';
    let options = {
        method: 'POST',
		headers: { 
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Accept': 'application/json' 
		}
    }
    let auth = JSON.stringify({
		 consumer_key,
		"code": code
    });
    
    https.request(url, options, (token_stream) => process2(token_stream, res)).end(auth);
}




function process2(token_stream, res){ // after getting access code stores it
    let body = "";
    token_stream.on("data", chunck => body += chunck);
    token_stream.on("end" , () => {
        if (body != undefined){
           /* body = body.split('=');
            console.log(body);
            let acc = body[1].split('&');  // porfessor help notice that this need to furthur be split
            tokens.push(acc[0]);
            tokens.push(body[2]);
            */
           let jjjj = JSON.parse(body);
           tokens.push(jjjj["access_token"]);
           tokens.push(jjjj["username"]);
           find_task(tokens, res); // add the anilist website to the pocket
        }
    });
}

function find_task(tokens, res){
    let query = `
                    query ($seasonYear: Int, $season: MediaSeason) {        
                        Page (page: 1, perPage: 1000) {
                            media(type: ANIME , seasonYear: $seasonYear, season: $season) {
                                id
                                title{romaji}
                            }
                        }
                    }
                `; // the $season have to be MediaSeason so it can use value
    let variables = {   //task is the value user put
            seasonYear: task.pop(),
            season: task.pop()
            
    };
    let url = 'https://graphql.anilist.co';
	let options = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
	
			}
	};
    let post_query = JSON.stringify({
        query,
        variables
    })
    https.request(url, options, response => proc(response, tokens, res)).end(post_query); // what to do after getting the query

}
function proc(response, tokens, res){ // got anilist query
    let body = "";
	response.on("data", chunck => body += chunck);
	response.on("end", ()=>{
		let data = JSON.parse(body);         
		let array = data['data']['Page']['media']; // array will store the anime id and title which is what we need
		add_to_pocket(array, tokens, res);
	});
}

function add_to_pocket(array,tokens, res){ 
	let urls =[]
    for (i = 0; i < array.length; i++){
        let ts = array[i]
		let temp = {
			action: "add",
			"url": `https://anilist.co/anime/${ts['id']}/${ts['title']['romaji'].replace(/\s/g, '-')}/`,
			"title" : ts['title']['romaji'],
		};
		urls.push(temp);
    }
	add_to_pocket2(urls, tokens);// for all the anime in the array
    donesall(res);
}
function add_to_pocket2(item, tokens){ // add to pocket 
    let url = 'https://getpocket.com/v3/send';
    let options = {
        method: 'POST',
		headers: { 
            'Content-Type': 'application/json; charset=UTF-8'
		}
    }
    let auth = JSON.stringify({
		consumer_key, 
		"access_token": tokens[1],
		"actions": item
    });
    https.request(url, options, (final) => endAlll(final)).end(auth);
}
function endAlll(final){ // give the status 
    let body = "";
    final.on("data", ch => body += ch);
    final.on("end", () => {
        console.log(body);
    });
}
function donesall(res){ // call by add_to_pocket after finishing the adding for loop.
    res.writeHead(302, {Location: `https://app.getpocket.com/`})
			   .end();
}



/*                            //  adding one at a time
function add_to_pocket(array,tokens, res){ 
    for (i = 0; i < array.length; i++){
        add_to_pocket2(array[i], tokens);// for all the anime in the array
    }
    donesall(res);
}
function add_to_pocket2(item, tokens){ // add to pocket 
    let url = 'https://getpocket.com/v3/add';
    let options = {
        method: 'POST',
		headers: { 
            'Content-Type': 'application/json; charset=UTF-8',
            
		}
    }
    let auth = JSON.stringify({
        "url": `https://anilist.co/anime/${item['id']}/${item['title']['romaji'].replace(/\s/g, '-')}/`,
        "title" : item['title']['romaji'],
		consumer_key, 
		"access_token": tokens[1]
    });
    https.request(url, options, (final) => endAlll(final)).end(auth);
}*/