import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname=path.dirname(fileURLToPath(import.meta.url))
const distDir=path.join(__dirname,'dist')
const PORT=Number(process.env.PORT||3000)
const HOST='0.0.0.0'

const MIME={
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml',
  '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif',
  '.glb':'model/gltf-binary','.gltf':'model/gltf+json','.mp3':'audio/mpeg','.wav':'audio/wav','.webm':'video/webm',
  '.ico':'image/x-icon','.txt':'text/plain; charset=utf-8'
}
const sendJson=(res,status,obj)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj))}
const readJson=async req=>{
  const chunks=[];let size=0
  for await(const chunk of req){size+=chunk.length;if(size>5*1024*1024)throw Object.assign(new Error('요청이 너무 큽니다.'),{status:413});chunks.push(chunk)}
  const text=Buffer.concat(chunks).toString('utf8');return text?JSON.parse(text):{}
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]))
const VOICES=new Set(['ko-KR-InJoonNeural','ko-KR-HyunsuNeural','ko-KR-SunHiNeural','ko-KR-YuJinNeural','ko-KR-BongJinNeural','ko-KR-GookMinNeural','ko-KR-JiMinNeural','ko-KR-SeoHyeonNeural','ko-KR-SoonBokNeural'])

async function handleTts(req,res){
  if(req.method!=='POST')return sendJson(res,405,{error:'POST만 지원합니다.'})
  const key=process.env.AZURE_SPEECH_KEY,region=process.env.AZURE_SPEECH_REGION
  if(!key||!region)return sendJson(res,503,{error:'Azure Speech 환경 변수가 설정되지 않았습니다.'})
  const body=await readJson(req),voice=VOICES.has(body.voice)?body.voice:'ko-KR-InJoonNeural'
  const rate=Math.min(1.25,Math.max(.8,Number(body.rate)||1)),ratePct=Math.round((rate-1)*100),rateText=`${ratePct>=0?'+':''}${ratePct}%`
  const segments=Array.isArray(body.segments)?body.segments.slice(0,25):[]
  if(!segments.length)return sendJson(res,400,{error:'생성할 음성 문장이 없습니다.'})
  if(segments.some(x=>!x?.id||!String(x.text||'').trim()||String(x.text).length>240))return sendJson(res,400,{error:'음성 문장 형식이 올바르지 않거나 너무 깁니다.'})
  const output=new Array(segments.length),queue=segments.map((segment,index)=>({segment,index}))
  const worker=async()=>{while(queue.length){const {segment,index}=queue.shift();const ssml=`<speak version="1.0" xml:lang="ko-KR"><voice name="${voice}"><prosody rate="${rateText}">${esc(segment.text)}</prosody></voice></speak>`;const r=await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,{method:'POST',headers:{'Ocp-Apim-Subscription-Key':key,'Content-Type':'application/ssml+xml','X-Microsoft-OutputFormat':'audio-24khz-48kbitrate-mono-mp3','User-Agent':'home-workout-cg-maker'},body:ssml});if(!r.ok)throw new Error(`Azure TTS ${r.status}: ${(await r.text()).slice(0,180)}`);const buf=Buffer.from(await r.arrayBuffer());output[index]={id:segment.id,text:segment.text,mime:'audio/mpeg',audioBase64:buf.toString('base64')}}}
  try{await Promise.all(Array.from({length:Math.min(5,segments.length)},worker));return sendJson(res,200,{voice,rate,segments:output})}catch(err){return sendJson(res,502,{error:err?.message||'음성 생성 중 오류가 발생했습니다.'})}
}
async function handleVoice(req,res){
  if(req.method!=='POST')return sendJson(res,405,{error:'POST 요청만 지원합니다.'})
  const apiKey=process.env.ELEVENLABS_API_KEY,body=await readJson(req),{audioBase64,mimeType='audio/webm',fileName='narration.webm',preset='balanced'}=body
  const voiceId=preset==='deep'?process.env.ELEVENLABS_VOICE_ID_DEEP:process.env.ELEVENLABS_VOICE_ID_BALANCED
  if(!apiKey)return sendJson(res,500,{error:'ELEVENLABS_API_KEY가 설정되지 않았습니다.'})
  if(!voiceId)return sendJson(res,500,{error:`${preset==='deep'?'ELEVENLABS_VOICE_ID_DEEP':'ELEVENLABS_VOICE_ID_BALANCED'}가 설정되지 않았습니다.`})
  if(!audioBase64)return sendJson(res,400,{error:'음성 데이터가 없습니다.'})
  const bytes=Buffer.from(audioBase64,'base64');if(!bytes.length)return sendJson(res,400,{error:'빈 음성 파일입니다.'});if(bytes.length>3*1024*1024)return sendJson(res,413,{error:'음성 파일은 3MB 이하로 올려주세요.'})
  try{const form=new FormData();form.append('audio',new Blob([bytes],{type:mimeType||'application/octet-stream'}),fileName||'narration.webm');form.append('model_id','eleven_multilingual_sts_v2');const r=await fetch(`https://api.elevenlabs.io/v1/speech-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,{method:'POST',headers:{'xi-api-key':apiKey},body:form});if(!r.ok)return sendJson(res,r.status,{error:`ElevenLabs 음색 변조 실패: ${(await r.text()).slice(0,800)||r.statusText}`});const out=Buffer.from(await r.arrayBuffer());return sendJson(res,200,{audioBase64:out.toString('base64'),mimeType:'audio/mpeg',preset})}catch(err){return sendJson(res,500,{error:err?.message||'음색 변조 중 오류가 발생했습니다.'})}
}
async function serveStatic(req,res){
  let pathname
  try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{return sendJson(res,400,{error:'Bad URL'})}
  if(pathname==='/health'){res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8'});return res.end('ok')}
  if(pathname==='/api/tts')return handleTts(req,res)
  if(pathname==='/api/voice-convert')return handleVoice(req,res)
  if(req.method!=='GET'&&req.method!=='HEAD')return sendJson(res,405,{error:'Method not allowed'})
  const relative=pathname==='/'?'index.html':pathname.replace(/^\/+/, '')
  let filePath=path.join(distDir,relative)
  if(!filePath.startsWith(distDir))return sendJson(res,403,{error:'Forbidden'})
  try{const stat=await fs.stat(filePath);if(stat.isDirectory())filePath=path.join(filePath,'index.html')}catch{filePath=path.join(distDir,'index.html')}
  try{const data=await fs.readFile(filePath),ext=path.extname(filePath).toLowerCase();res.writeHead(200,{'Content-Type':MIME[ext]||'application/octet-stream','Cache-Control':filePath.endsWith('index.html')?'no-cache':'public, max-age=31536000, immutable'});if(req.method==='HEAD')return res.end();res.end(data)}catch{sendJson(res,404,{error:'Not found'})}
}
const server=http.createServer((req,res)=>{Promise.resolve(serveStatic(req,res)).catch(err=>sendJson(res,err?.status||500,{error:err?.message||'Server error'}))})
server.listen(PORT,HOST,()=>console.log(`Home Workout CG Maker listening on http://${HOST}:${PORT}`))
