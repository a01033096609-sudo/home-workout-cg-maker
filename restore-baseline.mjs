import fs from 'node:fs'

function patchFile(file, replacements) {
  let s = fs.readFileSync(file, 'utf8')
  for (const [from, to, label] of replacements) {
    if (!s.includes(from)) throw new Error(`Baseline restore patch missing: ${label} in ${file}`)
    s = s.replace(from, to)
  }
  fs.writeFileSync(file, s)
}

patchFile('src/App.jsx', [
  [
    "useState('male-hd')",
    "useState('female-hd')",
    'default female instructor'
  ],
  [
    "const isHDCharacter=character==='male-hd'||character==='female-hd', isProxyCharacter=character==='male-proxy', rigProfile=status?.profile||null",
    "const baselineFemale=character==='female-hd'&&!modelUrl, isHDCharacter=character==='male-hd'||(character==='female-hd'&&!!modelUrl), isProxyCharacter=character==='male-proxy', rigProfile=status?.profile||null",
    'baseline female gate'
  ],
  [
    "const productionGateLabel=candidateMode?'후보 GLB · 검수 전용':character==='calibration'?'검수 전용 · 최종 녹화 금지':isProxyCharacter?'남성 프록시 · QA 전용':character==='neutral'?'절차형 캐릭터 · 테스트 녹화 가능':!assetRigReady?'FINAL GLB CHECK':!qaReady?'RUN 5-MOTION QA':'PRODUCTION READY'",
    "const productionGateLabel=candidateMode?'후보 GLB · 검수 전용':character==='calibration'?'검수 전용 · 최종 녹화 금지':isProxyCharacter?'남성 프록시 · QA 전용':baselineFemale?'여성 강사 · Phase 1.9 기준':character==='neutral'?'절차형 캐릭터 · 테스트 녹화 가능':!assetRigReady?'FINAL GLB CHECK':!qaReady?'RUN 5-MOTION QA':'PRODUCTION READY'",
    'female production label'
  ],
  [
    "['female-hd','여성 강사 HD']",
    "['female-hd','여성 강사 · 조정 완료']",
    'female selector label'
  ],
  [
    "남성/여성 HD는 각 기본 GLB 경로를 사용하고, <b>리그 테스트</b>는 앱에 포함된 캘리브레이션 GLB를 즉시 불러옵니다.",
    "여성 강사는 Phase 1.9에서 조정 완료한 절차형 3D 프리셋을 기본으로 사용합니다. 별도 여성 GLB가 없어도 정상 동작하며, <b>리그 테스트</b>는 캘리브레이션 GLB를 사용합니다.",
    'female help text'
  ],
  [
    "<div className={'status '+(status.loaded?'ok':'warn')}>{status.loaded?'GLB 로드됨 · 휴머노이드 본 매핑 '+(status.mapped?'완료':'부분'):'GLB 미탑재 시 절차형 Rig로 자동 테스트'}</div>",
    "<div className={'status '+(baselineFemale||status.loaded?'ok':'warn')}>{baselineFemale?'Phase 1.9 여성 프리셋 사용 중 · 조정 완료 모션 적용':status.loaded?'GLB 로드됨 · 휴머노이드 본 매핑 '+(status.mapped?'완료':'부분'):'GLB 미탑재 시 절차형 Rig로 자동 테스트'}</div>",
    'female status'
  ],
  [
    "<ProductionReadiness character={character} status={status} qaResults={qaSweepResults} stored={!!storedModels[character]}/>",
    "{!baselineFemale&&<ProductionReadiness character={character} status={status} qaResults={qaSweepResults} stored={!!storedModels[character]}/>} ",
    'female readiness panel'
  ],
  [
    "const clearStoredModel=async()=>{if(character!=='male-hd'&&character!=='female-hd')return;try{clearModelQA(currentModelFingerprint());await removeModelAsset(character);setStoredModels(v=>{const n={...v};delete n[character];return n});if(modelUrl?.startsWith('blob:'))URL.revokeObjectURL(modelUrl);setModelUrl(null);setModelName('');setStatus({loaded:false});setDiagnostics(null);setModelStoreMsg('저장된 GLB 삭제됨')}catch{setModelStoreMsg('저장 모델 삭제에 실패했습니다.')}}\n const updateModelCalibration",
    "const clearStoredModel=async()=>{if(character!=='male-hd'&&character!=='female-hd')return;try{clearModelQA(currentModelFingerprint());await removeModelAsset(character);setStoredModels(v=>{const n={...v};delete n[character];return n});if(modelUrl?.startsWith('blob:'))URL.revokeObjectURL(modelUrl);setModelUrl(null);setModelName('');setStatus({loaded:false});setDiagnostics(null);setModelStoreMsg('저장된 GLB 삭제됨')}catch{setModelStoreMsg('저장 모델 삭제에 실패했습니다.')}}\n const exportStoredModel=()=>{const row=storedModels[character];if(!row?.blob){setModelStoreMsg('현재 슬롯에 내보낼 GLB가 없습니다.');return}const url=URL.createObjectURL(row.blob),a=document.createElement('a');a.href=url;a.download=row.name||\`${character}.glb\`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);setModelStoreMsg(\`${character==='female-hd'?'여성':'남성'} GLB 파일로 내보냄\`)}\n const updateModelCalibration",
    'model export function'
  ],
  [
    "<div className=\"modelVault\"><span>브라우저 자산 보관함</span><b>남성 {storedModels['male-hd']?'✓':'-'} · 여성 {storedModels['female-hd']?'✓':'-'}</b>{(character==='male-hd'||character==='female-hd')&&storedModels[character]&&<button onClick={clearStoredModel}>현재 슬롯 삭제</button>}</div>",
    "<div className=\"modelVault\"><span>브라우저 자산 보관함</span><b>남성 {storedModels['male-hd']?'✓':'-'} · 여성 {storedModels['female-hd']?'✓':'-'}</b>{(character==='male-hd'||character==='female-hd')&&storedModels[character]&&<><button onClick={exportStoredModel}>현재 GLB 내보내기</button><button onClick={clearStoredModel}>현재 슬롯 삭제</button></>}</div>",
    'model export button'
  ]
])

patchFile('src/components/CharacterStage.jsx', [
  [
    "const wantsGLB=(character==='male-hd'||character==='female-hd'||character==='male-proxy'||character==='calibration')&&!failed",
    "const wantsGLB=(character==='male-hd'||(character==='female-hd'&&!!modelUrl)||character==='male-proxy'||character==='calibration')&&!failed",
    'female procedural baseline'
  ]
])

console.log('Phase 1.9 female procedural baseline restored. Model export enabled.')


const floorMotionSource = "import React,{useRef,useState} from 'react'\nimport {useFrame} from '@react-three/fiber'\nimport * as THREE from 'three'\nimport {poseFor} from '../lib/motions'\n\nconst Skin=({tone})=><meshStandardMaterial color={tone} roughness={.72}/>\nconst Cloth=({color})=><meshStandardMaterial color={color} roughness={.82}/>\nconst Shoe=()=> <meshStandardMaterial color=\"#202733\" roughness={.76}/>\nconst pt=(x,y,z=0)=>new THREE.Vector3(x,y,z)\nconst mix=(a,b,t)=>a.clone().lerp(b,t)\nconst clamp01=v=>Math.max(0,Math.min(1,v))\nfunction Limb({a,b,r=.09,material}){const mid=a.clone().add(b).multiplyScalar(.5),len=Math.max(.02,a.distanceTo(b)),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());return <mesh position={mid} quaternion={q}><cylinderGeometry args={[r,r,len,16]}/>{material}</mesh>}\nfunction Joint({p,r=.105,tone}){return <mesh position={p}><sphereGeometry args={[r,18,18]}/><Skin tone={tone}/></mesh>}\nfunction Head({p,tone}){return <group><mesh position={p}><sphereGeometry args={[.18,24,24]}/><Skin tone={tone}/></mesh><mesh position={[p.x,p.y+.11,p.z-.015]} scale={[1.04,.72,1.04]}><sphereGeometry args={[.19,24,24]}/><meshStandardMaterial color=\"#252525\" roughness={.8}/></mesh></group>}\nfunction ShoeMesh({p,rot=0}){return <group position={p} rotation={[rot,0,0]}><mesh position={[0,.02,.10]} scale={[.16,.055,.25]}><boxGeometry/><Shoe/></mesh><mesh position={[0,.02,.23]} scale={[.15,.05,.08]}><sphereGeometry args={[1,16,12]}/><Shoe/></mesh></group>}\nfunction Marker({p,scale=[1,1,1]}){return <mesh position={p} scale={scale}><sphereGeometry args={[.085,18,18]}/><meshStandardMaterial color=\"#ef4444\" emissive=\"#ef4444\" emissiveIntensity={.5} transparent opacity={.5} depthWrite={false}/></mesh>}\n\nexport default function FloorMotionCharacter({motion,speed=1,sessionPhase='idle',sessionStartMs=0,sessionDuration=0,previewEpochMs=0,muscleHighlight=true,character='female-hd'}){\n const [pose,setPose]=useState(()=>poseFor(motion,0,speed)),last=useRef(0)\n useFrame(({clock})=>{if(clock.elapsedTime-last.current<1/30)return;last.current=clock.elapsedTime;const synced=sessionPhase==='active'?Math.max(0,(performance.now()-sessionStartMs)/1000):sessionPhase==='complete'?sessionDuration:0,free=previewEpochMs>0?Math.max(0,(performance.now()-previewEpochMs)/1000):clock.elapsedTime,t=sessionPhase==='idle'?free:synced;setPose(poseFor(motion,t,speed))})\n const female=character==='female-hd'||character==='female',top=female?'#8b5f83':'#405d78',bottom=female?'#343847':'#1f2937',tone=female?'#dfb091':'#d8aa8d',p=pose||{}\n\n if(motion==='hip-bridge'){\n   const lift=clamp01((p.hipsY||0)/.32)\n   const hipC=pt(0,.34+.27*lift,0), shoulderC=pt(0,.23,-.62), headP=pt(0,.23,-.91)\n   const lh=pt(-.16,hipC.y,hipC.z),rh=pt(.16,hipC.y,hipC.z),ls=pt(-.19,.25,-.58),rs=pt(.19,.25,-.58)\n   const lk=pt(-.16,.48,.43),rk=pt(.16,.48,.43),la=pt(-.16,.075,.79),ra=pt(.16,.075,.79)\n   const le=pt(-.29,.14,-.27),re=pt(.29,.14,-.27),lw=pt(-.31,.085,.05),rw=pt(.31,.085,.05)\n   return <group scale={1.06}>\n    <Limb a={shoulderC} b={hipC} r={.225} material={<Cloth color={top}/>}/>\n    <Head p={headP} tone={tone}/>\n    <Limb a={ls} b={le} r={.085} material={<Skin tone={tone}/>}/><Limb a={le} b={lw} r={.072} material={<Skin tone={tone}/>}/>\n    <Limb a={rs} b={re} r={.085} material={<Skin tone={tone}/>}/><Limb a={re} b={rw} r={.072} material={<Skin tone={tone}/>}/>\n    <Joint p={ls} r={.10} tone={tone}/><Joint p={rs} r={.10} tone={tone}/>\n    <Limb a={lh} b={lk} r={.12} material={<Cloth color={bottom}/>}/><Limb a={lk} b={la} r={.10} material={<Skin tone={tone}/>}/>\n    <Limb a={rh} b={rk} r={.12} material={<Cloth color={bottom}/>}/><Limb a={rk} b={ra} r={.10} material={<Skin tone={tone}/>}/>\n    <Joint p={lk} r={.105} tone={tone}/><Joint p={rk} r={.105} tone={tone}/>\n    <ShoeMesh p={la}/><ShoeMesh p={ra}/>\n    {muscleHighlight&&<><Marker p={pt(-.11,hipC.y+.04,-.04)} scale={[1.3,1.05,1]}/><Marker p={pt(.11,hipC.y+.04,-.04)} scale={[1.3,1.05,1]}/><Marker p={mix(shoulderC,hipC,.55).add(pt(0,.05,.10))} scale={[1.45,1.5,.7]}/></>}\n   </group>\n }\n\n const a=clamp01((p.handLX||0)/.12), b=clamp01((p.handRX||0)/.12)\n const hipC=pt(0,.69,-.26), shoulderC=pt(0,.69,.30), headP=pt(0,.73,.58)\n const lh=pt(-.16,.68,-.24),rh=pt(.16,.68,-.24),ls=pt(-.20,.69,.28),rs=pt(.20,.69,.28)\n const lSupportE=pt(-.24,.34,.45),rSupportE=pt(.24,.34,.45),lExtendE=pt(-.20,.69,.72),rExtendE=pt(.20,.69,.72)\n const lSupportW=pt(-.25,.065,.58),rSupportW=pt(.25,.065,.58),lExtendW=pt(-.20,.69,1.08),rExtendW=pt(.20,.69,1.08)\n const le=mix(lSupportE,lExtendE,a),re=mix(rSupportE,rExtendE,b),lw=mix(lSupportW,lExtendW,a),rw=mix(rSupportW,rExtendW,b)\n const lLegExt=b,rLegExt=a\n const lk=mix(pt(-.16,.065,-.35),pt(-.16,.67,-.61),lLegExt),rk=mix(pt(.16,.065,-.35),pt(.16,.67,-.61),rLegExt)\n const la=mix(pt(-.16,.065,-.67),pt(-.16,.68,-1.05),lLegExt),ra=mix(pt(.16,.065,-.67),pt(.16,.68,-1.05),rLegExt)\n return <group scale={1.06}>\n   <Limb a={shoulderC} b={hipC} r={.215} material={<Cloth color={top}/>}/>\n   <Head p={headP} tone={tone}/>\n   <Joint p={ls} r={.10} tone={tone}/><Joint p={rs} r={.10} tone={tone}/>\n   <Limb a={ls} b={le} r={.085} material={<Skin tone={tone}/>}/><Limb a={le} b={lw} r={.072} material={<Skin tone={tone}/>}/>\n   <Limb a={rs} b={re} r={.085} material={<Skin tone={tone}/>}/><Limb a={re} b={rw} r={.072} material={<Skin tone={tone}/>}/>\n   <Joint p={lw} r={.075} tone={tone}/><Joint p={rw} r={.075} tone={tone}/>\n   <Limb a={lh} b={lk} r={.12} material={<Cloth color={bottom}/>}/><Limb a={lk} b={la} r={.10} material={<Skin tone={tone}/>}/>\n   <Limb a={rh} b={rk} r={.12} material={<Cloth color={bottom}/>}/><Limb a={rk} b={ra} r={.10} material={<Skin tone={tone}/>}/>\n   <ShoeMesh p={la} rot={lLegExt?-.08:0}/><ShoeMesh p={ra} rot={rLegExt?-.08:0}/>\n   {muscleHighlight&&<><Marker p={mix(shoulderC,hipC,.5).add(pt(0,.08,0))} scale={[1.5,1.5,.7]}/><Marker p={mix(shoulderC,hipC,.55).add(pt(0,0,-.12))} scale={[1.55,1.5,.7]}/></>}\n </group>\n}\n"
fs.writeFileSync('src/components/FloorMotionCharacter.jsx', floorMotionSource)

patchFile('src/components/CharacterStage.jsx', [
  [
    "import ProceduralCharacter from './ProceduralCharacter'",
    "import ProceduralCharacter from './ProceduralCharacter'\nimport FloorMotionCharacter from './FloorMotionCharacter'",
    'floor motion renderer import'
  ],
  [
    "function FrameMonitor({onSample}){",
    "const FLOOR_MOTIONS=new Set(['hip-bridge','bird-dog'])\nfunction ProceduralRouter(props){return FLOOR_MOTIONS.has(props.motion)&&!props.motionData?<FloorMotionCharacter {...props}/>:<ProceduralCharacter {...props}/>}\n\nfunction FrameMonitor({onSample}){",
    'floor motion router'
  ],
  [
    "<Suspense fallback={<ProceduralCharacter {...common}/> }>",
    "<Suspense fallback={<ProceduralRouter {...common}/> }>",
    'floor suspense fallback'
  ],
  [
    "fallback={<ProceduralCharacter {...common}/>}><HumanoidGLBCharacter",
    "fallback={<ProceduralRouter {...common}/>}><HumanoidGLBCharacter",
    'floor glb fallback'
  ],
  [
    ": <ProceduralCharacter {...common}/>} ",
    ": <ProceduralRouter {...common}/>} ",
    'floor procedural selection'
  ],
  [
    "<CameraRig preset={cameraPreset} controlsRef={controlsRef}/>",
    "<CameraRig preset={FLOOR_MOTIONS.has(motion)&&cameraPreset==='auto'?'lower':cameraPreset} controlsRef={controlsRef}/>",
    'floor camera preset'
  ]
])

console.log('Floor-motion renderer enabled for hip-bridge and bird-dog with fixed floor contacts.')
