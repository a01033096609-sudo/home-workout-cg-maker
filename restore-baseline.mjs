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
    "const productionGateLabel=candidateMode?'후보 GLB · 검수 전용':character==='calibration'?'검수 전용 · 최종 녹화 금지':isProxyCharacter?'남성 프록시 · QA 전용':baselineFemale?'여성 강사 · 기존 기준본 복구':character==='neutral'?'절차형 캐릭터 · 테스트 녹화 가능':!assetRigReady?'FINAL GLB CHECK':!qaReady?'RUN 5-MOTION QA':'PRODUCTION READY'",
    'female production label'
  ],
  [
    "['female-hd','여성 강사 HD']",
    "['female-hd','여성 강사 · 기존 기준']",
    'female selector label'
  ],
  [
    "남성/여성 HD는 각 기본 GLB 경로를 사용하고, <b>리그 테스트</b>는 앱에 포함된 캘리브레이션 GLB를 즉시 불러옵니다.",
    "여성 강사는 기존 조정 완료 기준 캐릭터를 즉시 사용합니다. 여성 GLB를 별도로 불러오면 같은 슬롯에서 교체 검수할 수 있고, <b>리그 테스트</b>는 캘리브레이션 GLB를 사용합니다.",
    'female help text'
  ],
  [
    "<div className={'status '+(status.loaded?'ok':'warn')}>{status.loaded?'GLB 로드됨 · 휴머노이드 본 매핑 '+(status.mapped?'완료':'부분'):'GLB 미탑재 시 절차형 Rig로 자동 테스트'}</div>",
    "<div className={'status '+(baselineFemale||status.loaded?'ok':'warn')}>{baselineFemale?'기존 여성 강사 기준본 사용 중 · 조정 완료 모션 적용':status.loaded?'GLB 로드됨 · 휴머노이드 본 매핑 '+(status.mapped?'완료':'부분'):'GLB 미탑재 시 절차형 Rig로 자동 테스트'}</div>",
    'female status'
  ],
  [
    "<ProductionReadiness character={character} status={status} qaResults={qaSweepResults} stored={!!storedModels[character]}/>",
    "{!baselineFemale&&<ProductionReadiness character={character} status={status} qaResults={qaSweepResults} stored={!!storedModels[character]}/>} ",
    'female readiness panel'
  ]
])

patchFile('src/components/CharacterStage.jsx', [
  [
    "const wantsGLB=(character==='male-hd'||character==='female-hd'||character==='male-proxy'||character==='calibration')&&!failed",
    "const wantsGLB=(character==='male-hd'||(character==='female-hd'&&!!modelUrl)||character==='male-proxy'||character==='calibration')&&!failed",
    'female procedural baseline'
  ]
])

console.log('Baseline female instructor restoration applied.')
