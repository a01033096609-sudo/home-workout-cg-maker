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
