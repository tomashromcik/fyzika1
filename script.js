// =========================
// Pomocné funkce + parser
// =========================
function $(id){return document.getElementById(id);}

// Tokenizace: čísla (i s tečkou), operátory, závorky
function tokenize(expr){
  const tokens=[]; let i=0;
  while(i<expr.length){
    const ch=expr[i];
    if(/\s/.test(ch)){ i++; continue; }
    if(/[0-9.]/.test(ch)){
      let num=ch; i++;
      while(i<expr.length && /[0-9.]/.test(expr[i])){ num+=expr[i++]; }
      tokens.push({type:'num', value:num});
      continue;
    }
    if(/[+\-*/()]/.test(ch)){ tokens.push({type:'op', value:ch}); i++; continue; }
    return null;
  }
  return tokens;
}

function normalizeUnary(expr){
  let out=expr.replace(/\s+/g,'');
  out = out.replace(/^\-/,'0-');
  out = out.replace(/\(\-/g,'(0-');
  return out;
}

function toRPN(tokens){
  const out=[]; const stack=[];
  const prec={'+':1,'-':1,'*':2,'/':2};
  const leftAssoc={'+':true,'-':true,'*':true,'/':true};
  for(const t of tokens){
    if(t.type==='num'){ out.push(t); }
    else if(t.type==='op' && /[+\-*/]/.test(t.value)){
      while(stack.length){
        const top=stack[stack.length-1];
        if(top.type==='op' && /[+\-*/]/.test(top.value) &&
           ((leftAssoc[t.value] && prec[t.value] <= prec[top.value]) ||
            (!leftAssoc[t.value] && prec[t.value] < prec[top.value]))){
          out.push(stack.pop());
        } else break;
      }
      stack.push(t);
    } else if(t.type==='op' && t.value==='('){
      stack.push(t);
    } else if(t.type==='op' && t.value===')'){
      let found=false;
      while(stack.length){
        const top=stack.pop();
        if(top.type==='op' && top.value==='('){ found=true; break; }
        out.push(top);
      }
      if(!found) return null;
    }
  }
  while(stack.length){
    const top=stack.pop();
    if(top.type==='op' && (top.value==='('||top.value===')')) return null;
    out.push(top);
  }
  return out;
}

function evalRPN(rpn){
  const st=[];
  for(const t of rpn){
    if(t.type==='num'){ st.push(parseFloat(t.value)); }
    else{
      const b=st.pop(), a=st.pop();
      if(a===undefined||b===undefined) return NaN;
      switch(t.value){
        case '+': st.push(a+b); break;
        case '-': st.push(a-b); break;
        case '*': st.push(a*b); break;
        case '/': st.push(b===0? NaN : a/b); break;
        default: return NaN;
      }
