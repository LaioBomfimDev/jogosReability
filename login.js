(() => {
  const form=document.querySelector('#auth-form');
  form.onsubmit=async e=>{
    e.preventDefault(); const button=document.querySelector('#auth-submit'); button.disabled=true;
    document.querySelector('#auth-error').textContent='';
    try {
      const response=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(form)))});
      const body=await response.json().catch(()=>({error:'Servidor indisponível. Inicie o servidor Reability.'}));
      if(!response.ok) throw new Error(body.error);
      const target=new URLSearchParams(location.search).get('return');
      location.assign(/^\/(?!\/)[a-zA-Z0-9/_-]*(?:\.html)?$/.test(target||'')?target:'/index.html');
    } catch(error) { document.querySelector('#auth-error').textContent=error.message; button.disabled=false; }
  };
})();
