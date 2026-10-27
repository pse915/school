// Reproduce the source inventory without executing Apps Script or its UI.
const fs=require('fs'),ts=require('../frontend/node_modules/typescript');
const source=fs.readFileSync('reference/exam-original/Code.gs','utf8');
const sf=ts.createSourceFile('Code.js',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const declarations=sf.statements.filter(ts.isFunctionDeclaration);const effective=new Map();
for(const node of declarations)effective.set(node.name.text,node);
const functions=declarations.map(n=>{
 const calls=new Set();const visit=x=>{if(ts.isCallExpression(x)&&ts.isIdentifier(x.expression))calls.add(x.expression.text);ts.forEachChild(x,visit)};visit(n);
 return {name:n.name.text,line:sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1,effective:effective.get(n.name.text)===n,disabledByExplicitError:n.getText(sf).includes('이전 관리 기능은 제거되었습니다.'),calls:[...calls].sort()};
});
const api=effective.get('api').getText(sf);const apiActions=[...api.matchAll(/case\s+'([^']+)'/g)].map(m=>m[1]);apiActions.push('getStatus','getConfirmed','getTeacher','bootstrap');
const index=fs.readFileSync('reference/exam-original/Index.html','utf8');
const frontendCalls=[...new Set([...index.matchAll(/\bcall\(\s*['"]([^'"]+)['"]/g)].map(m=>m[1]))].sort();
const declaredReadActions=[...(index.match(/const readActions=new Set\(\[([^\]]+)\]\)/)?.[1]||'').matchAll(/'([^']+)'/g)].map(m=>m[1]);
const out={declaredReadActionsNotExposed:declaredReadActions.filter(x=>!apiActions.includes(x)),note:'Top-level AST inventory. effective=false means overridden by a later definition. Literal UI calls are evidence of call sites, not proof of runtime reachability. See FEATURE_PARITY.csv for port mapping.',functions,apiActions:apiActions.sort(),literalFrontendCalls:frontendCalls,uiCallsNotExposedByApi:frontendCalls.filter(x=>!apiActions.includes(x))};
fs.writeFileSync('docs/exam-supervision/SOURCE_INVENTORY.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({declarations:functions.length,effective:effective.size,apiActions:apiActions.length,uiCallsNotExposed:out.uiCallsNotExposedByApi}));
