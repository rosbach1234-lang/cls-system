const http=require('http');const fs=require('fs');const path=require('path');const p=process.env.PORT||8080;

async function callAI(messages){
  const res=await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY||'','anthropic-version':'2023-06-01'},
    body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,
      system:'You are an expert in Aviation Ground Handling Training for CLS — Clear Leadership Systems. Answer questions about ramp safety, dangerous goods, passenger handling, SMS, IATA, ICAO and EASA standards. Detect the user language and respond in the same language (German or English).',
      messages})
  });
  return res.json();
}

http.createServer(async(q,r)=>{
  r.setHeader('Access-Control-Allow-Origin','*');
  r.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(q.method==='OPTIONS'){r.writeHead(204);r.end();return;}

  if(q.method==='POST'&&q.url==='/ai'){
    let body='';
    q.on('data',d=>body+=d);
    q.on('end',async()=>{
      try{
        const{messages}=JSON.parse(body);
        const d=await callAI(messages);
        r.writeHead(200,{'Content-Type':'application/json'});
        r.end(JSON.stringify(d));
      }catch(e){
        r.writeHead(500,{'Content-Type':'application/json'});
        r.end(JSON.stringify({error:e.message}));
      }
    });
    return;
  }

  const u=q.url==='/'||q.url==='/index.html'?'index.html':
          q.url==='/platform'||q.url==='/platform.html'?'platform.html':null;
  if(!u){r.writeHead(404);r.end('Not found');return;}
  fs.readFile(path.join(__dirname,u),(e,d)=>{
    r.writeHead(e?404:200,{'Content-Type':'text/html'});
    r.end(e?'Not found':d);
  });
}).listen(p,()=>console.log('CLS OK '+p));
