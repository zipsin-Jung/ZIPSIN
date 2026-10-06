import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=path.resolve(fileURLToPath(new URL('../out/',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.ico':'image/x-icon'};
async function resolveStaticFile(pathname){
  let file=path.resolve(root,'.'+pathname);
  if(file!==root&&!file.startsWith(root+path.sep))return null;
  try{
    if((await stat(file)).isDirectory()){
      const indexFile=path.join(file,'index.html');
      try{await stat(indexFile);return indexFile;}catch{
        if(file===root)return indexFile;
        return `${file}.html`;
      }
    }
    return file;
  }catch{
    if(path.extname(file))return file;
    const htmlFile=`${file.replace(/[\\/]$/,'')}.html`;
    if(htmlFile!==root&&!htmlFile.startsWith(root+path.sep))return null;
    return htmlFile;
  }
}
const server=http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=await resolveStaticFile(pathname);if(!file){res.writeHead(403);res.end();return;}const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}});
let port=3000;
server.on('error',err=>{if(err.code==='EADDRINUSE'&&port<3010){port++;server.listen(port,'127.0.0.1');}else{console.error(err.message);process.exitCode=1;}});
server.on('listening',()=>{const url=`http://127.0.0.1:${port}`;console.log(`집신 미리보기: ${url}\n종료: Control+C`);if(process.platform==='darwin')spawn('open',[url],{stdio:'ignore'}).on('error',()=>{});});
server.listen(port,'127.0.0.1');
