import fs from 'node:fs'
import crypto from 'node:crypto'

const URL='https://v3b.fal.media/files/b/0aab2388/jumQAcWvMtvW9Zj5aMaCQ_rigged_character.glb'
const OUT='public/models/female-instructor-hd.glb'
const EXPECTED_SIZE=11083968

fs.mkdirSync('public/models',{recursive:true})
const res=await fetch(URL)
if(!res.ok) throw new Error('Female HD download failed: '+res.status+' '+res.statusText)
const buf=Buffer.from(await res.arrayBuffer())
if(buf.length!==EXPECTED_SIZE) throw new Error('Female HD size mismatch: '+buf.length)
if(buf.subarray(0,4).toString('utf8')!=='glTF') throw new Error('Female HD is not GLB')
const jsonLen=buf.readUInt32LE(12)
const jsonType=buf.readUInt32LE(16)
if(jsonType!==0x4E4F534A) throw new Error('Female HD missing GLB JSON chunk')
const doc=JSON.parse(buf.subarray(20,20+jsonLen).toString('utf8').replace(/\0+$/,'').trim())
const skins=doc.skins||[]
const nodes=doc.nodes||[]
const jointCount=skins.reduce((n,s)=>n+(s.joints?.length||0),0)
if(!skins.length||jointCount<15) throw new Error('Female HD rig invalid: skins='+skins.length+' joints='+jointCount)
const names=nodes.map(n=>n.name).filter(Boolean)
const sha=crypto.createHash('sha256').update(buf).digest('hex')
fs.writeFileSync(OUT,buf)
console.log('FEMALE_HD_READY size='+buf.length+' sha256='+sha+' skins='+skins.length+' joints='+jointCount)
console.log('FEMALE_HD_NODES '+names.slice(0,120).join('|'))
