(async function(){
  'use strict';
  const root=document.getElementById('cloudThemeControls');
  if(!root||!window.EventPlatform)return;
  const $=id=>document.getElementById(id), catalog=EventPlatform.THEMES;
  const status=$('cloudThemeStatus'), select=$('cloudThemeSelect'), save=$('cloudThemeSave');
  const login=$('cloudThemeLogin'), logout=$('cloudThemeLogout'), mail=$('cloudThemeEmail'), pass=$('cloudThemePassword');
  const authStatus=$('cloudThemeAuthStatus'), last=$('cloudThemeTimestamp');
  const config=window.LUCKYDRAW_CLOUD_CONFIG||{};
  const ready=['apiKey','authDomain','projectId','appId'].every(k=>typeof config[k]==='string'&&config[k].trim().length>3);
  const DEFAULT=EventPlatform.DEFAULT_THEME_ID;
  let published=DEFAULT, hasPublished=false, live=false, allowed=false, busy=false, auth=null, db=null, fs=null, authMod=null, docRef=null;
  select.replaceChildren(...catalog.map(theme=>new Option(theme.name,theme.id)));
  select.value=DEFAULT;
  function valid(id){return EventPlatform.validTheme(id)}
  function display(id){
    if(!valid(id))return;
    window.LUCKYDRAW_SHARED_THEME_OVERRIDE=id;
    window.dispatchEvent(new CustomEvent('lucky-draw-theme-override',{detail:{themeId:id}}));
  }
  function paint(){
    save.disabled=!live||!allowed||busy||(hasPublished&&select.value===published);
    save.textContent=busy?'Đang lưu…':hasPublished&&select.value===published?'Đã áp dụng cho tất cả thiết bị':'Áp dụng cho tất cả thiết bị';
  }
  function tell(s){status.textContent=s}
  function showTime(t){last.textContent=t?'Cập nhật lần cuối: '+new Intl.DateTimeFormat('vi-VN',{dateStyle:'short',timeStyle:'short'}).format(t):''}
  select.addEventListener('change',()=>{
    display(select.value);tell('Đang xem thử: '+catalog.find(t=>t.id===select.value).name+' — chưa lưu chung.');
    paint();
  });
  if(!ready){
    tell('Chưa kết nối Firebase. Đang dùng giao diện hiện có trên máy này.');
    login.hidden=true;paint();return;
  }
  if(!/^https?:$/.test(location.protocol)){
    tell('Offline: dùng theme trên máy này; mở website online để đồng bộ.');
    login.hidden=true;paint();return;
  }
  try{
    const url='https://www.gstatic.com/firebasejs/13.4.0/';
    const [app,firestore,authLibrary]=await Promise.all([
      import(url+'firebase-app.js'),
      import(url+'firebase-firestore.js'),
      import(url+'firebase-auth.js')
    ]);
    const firebaseApp=app.initializeApp(config);
    fs=firestore;authMod=authLibrary;db=fs.getFirestore(firebaseApp);auth=authMod.getAuth(firebaseApp);
    docRef=fs.doc(db,'sharedTheme','live');
    await authMod.setPersistence(auth,authMod.browserSessionPersistence);
    authMod.onAuthStateChanged(auth,async user=>{
      allowed=false;logout.hidden=!user;login.hidden=!!user;
      if(!user){authStatus.textContent='Chưa đăng nhập quản trị.';paint();return}
      authStatus.textContent='Đang kiểm tra quyền quản trị…';
      try{
        const role=await fs.getDoc(fs.doc(db,'admins',user.uid));
        if(auth.currentUser?.uid!==user.uid)return;
        allowed=role.exists()&&role.data()?.enabled===true;
        authStatus.textContent=allowed?'Đã xác nhận quản trị: '+user.email:'Tài khoản này không có quyền lưu giao diện.';
      }catch(err){authStatus.textContent='Không xác minh được quyền: '+(err.code||err.message)}
      paint();
    });
    fs.onSnapshot(docRef,{includeMetadataChanges:true},snapshot=>{
      if(snapshot.metadata.hasPendingWrites)return;
      if(snapshot.metadata.fromCache){
        live=false;tell('Tạm mất kết nối. Đang xem theme cuối cùng trên máy.');paint();return;
      }
      live=true;
      const data=snapshot.exists()?snapshot.data():null;
      if(data&&(data.schemaVersion!==1||!valid(data.themeId))){
        live=false;tell('Dữ liệu theme chung không hợp lệ.');paint();return;
      }
      hasPublished=!!data;
      published=data?.themeId||DEFAULT;
      select.value=published;
      showTime(data?.updatedAt?.toDate?.()||null);
      display(published);
      tell(data?'Đã đồng bộ tới mọi thiết bị: '+catalog.find(t=>t.id===published).name:
                'Chưa có bản lưu chung. Mặc định: Sắc Màu Quyết Thắng.');
      paint();
    },err=>{live=false;tell('Không tải được theme chung: '+(err.code||err.message));paint()});
  }catch(err){tell('Kết nối Firebase thất bại: '+(err.code||err.message));login.hidden=true;paint();return}
  login.addEventListener('submit',async e=>{
    e.preventDefault();if(!authMod||busy)return;
    busy=true;paint();authStatus.textContent='Đang đăng nhập…';
    try{await authMod.signInWithEmailAndPassword(auth,mail.value.trim(),pass.value);pass.value=''}
    catch(err){authStatus.textContent='Đăng nhập thất bại: '+(err.code||err.message);pass.value=''}
    finally{busy=false;paint()}
  });
  logout.addEventListener('click',async()=>{try{await authMod.signOut(auth);allowed=false;paint()}catch(err){authStatus.textContent=err.message}});
  save.addEventListener('click',async()=>{
    if(!live||!allowed||busy||!auth.currentUser||!valid(select.value))return;
    const id=select.value;
    busy=true;paint();tell('Đang lưu theme cho mọi thiết bị…');
    try{
      await fs.setDoc(docRef,{schemaVersion:1,themeId:id,updatedAt:fs.serverTimestamp()});
      tell('Đang xác nhận thay đổi từ máy chủ…');
    }catch(err){tell('Không thể lưu: '+(err.code||err.message))}
    finally{busy=false;paint()}
  });
})();
