import fs from 'node:fs'
import crypto from 'node:crypto'

const URL='https://v3b.fal.media/files/b/0aab2388/jumQAcWvMtvW9Zj5aMaCQ_rigged_character.glb'
const OUT='public/models/female-instructor-hd.glb'
const EXPECTED_SIZE=11083968
const EXPECTED_SHA='c44f0a78faa20ea442dc022e10922c5fea0997c24501f09d55ab22ca680a2a62'

function validate(buf){
  if(buf.length!==EXPECTED_SIZE) throw new Error('Female HD size mismatch: '+buf.length)
  if(buf.subarray(0,4).toString('utf8')!=='glTF') throw new Error('Female HD is not GLB')
  const sha=crypto.createHash('sha256').update(buf).digest('hex')
  if(sha!==EXPECTED_SHA) throw new Error('Female HD SHA mismatch: '+sha)
  const jsonLen=buf.readUInt32LE(12), jsonType=buf.readUInt32LE(16)
  if(jsonType!==0x4E4F534A) throw new Error('Female HD missing GLB JSON chunk')
  const doc=JSON.parse(buf.subarray(20,20+jsonLen).toString('utf8').replace(/\0+$/,'').trim())
  const skins=doc.skins||[], nodes=doc.nodes||[]
  const jointCount=skins.reduce((n,s)=>n+(s.joints?.length||0),0)
  if(!skins.length||jointCount<15) throw new Error('Female HD rig invalid: skins='+skins.length+' joints='+jointCount)
  return {sha,skins:skins.length,joints:jointCount,names:nodes.map(n=>n.name).filter(Boolean)}
}

fs.mkdirSync('public/models',{recursive:true})
let buf
let source='repository'
if(fs.existsSync(OUT)){
  buf=fs.readFileSync(OUT)
  try{ validate(buf) }catch(e){ console.warn('Repository female GLB invalid; recovery download will be attempted:',e.message); buf=null }
}
if(!buf){
  source='recovery'
  const res=await fetch(URL)
  if(!res.ok) throw new Error('Female HD recovery download failed: '+res.status+' '+res.statusText)
  buf=Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(OUT,buf)
}
const v=validate(buf)
console.log('FEMALE_HD_READY source='+source+' size='+buf.length+' sha256='+v.sha+' skins='+v.skins+' joints='+v.joints)
console.log('FEMALE_HD_NODES '+v.names.slice(0,120).join('|'))
