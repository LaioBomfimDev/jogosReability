(() => {
  const form=document.querySelector('#auth-form'); let register=false;
  document.querySelector('#auth-toggle').onclick=()=>{
    register=!register;
    document.querySelector('#name-field').hidden=!register;
    form.elements.name.required=register;
    form.elements.password.autocomplete=register?'new-password':'current-password';
    document.querySelector('#auth-title').textContent=register?'Criar conta profissional':'Entrar na conta';
    document.querySelector('#auth-submit').textContent=register?'Criar conta':'Entrar';
    document.querySelector('#auth-toggle').textContent=register?'Já tenho uma conta':'Criar conta profissional';
    document.querySelector('#auth-error').textContent='';
  };
  form.onsubmit=async e=>{
    e.preventDefault(); const button=document.querySelector('#auth-submit'); button.disabled=true;
    document.querySelector('#auth-error').textContent='';
    try {
      const response=await fetch(register?'/api/register':'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(form)))});
      const body=await response.json().catch(()=>({error:'Servidor indisponível. Inicie o servidor Reability.'}));
      if(!response.ok) throw new Error(body.error);
      const target=new URLSearchParams(location.search).get('return');
      location.assign(/^\/(?!\/)[a-zA-Z0-9/_-]*(?:\.html)?$/.test(target||'')?target:'/index.html');
    } catch(error) { document.querySelector('#auth-error').textContent=error.message; button.disabled=false; }
  };
})();
