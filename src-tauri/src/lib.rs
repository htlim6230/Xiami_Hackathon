use base64::{engine::general_purpose::STANDARD, Engine};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{io::Cursor, sync::{Arc, Mutex}, time::Duration};
use tauri::{Emitter, Manager, PhysicalPosition, PhysicalSize, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};

#[derive(Clone, Copy, Deserialize, Serialize)]
pub enum Language { Cantonese, Hokkien }
#[derive(Clone, Deserialize, Serialize)]
pub struct BoxRect { x: f64, y: f64, width: f64, height: f64 }
#[derive(Deserialize, Serialize)]
enum Phase { Idle, Selecting, Reading, Translating, Ready, Speaking, Paused, Sleeping, Error }
#[derive(Deserialize, Serialize)]
#[serde(tag="type",rename_all="lowercase",deny_unknown_fields)]
enum WorkerEvent {
    State { state: Phase }, Source { text: String, boxes: Vec<BoxRect> },
    Chunk { text: String }, Romanization { text: String },
    Fallback { text: String, notice: String }, Audio { data: String, mime: String },
    Done, Error { message: String },
}
struct CaptureData { id: String, image: image::RgbaImage, x: i32, y: i32, scale: f64, language: Language }
#[derive(Default)]
struct Session { capture: Option<CaptureData>, task: Option<tauri::async_runtime::JoinHandle<()>>, id: String, language: Option<Language> }
#[derive(Clone, Default)]
struct Shared(Arc<Mutex<Session>>);
fn emit(app: &tauri::AppHandle, id: &str, mut payload: Value) { payload["requestId"] = json!(id); let _ = app.emit_to("main", "xiami:event", payload); }
fn main_window(app:&tauri::AppHandle)->Result<tauri::WebviewWindow,String>{ app.get_webview_window("main").ok_or("Main window unavailable".into()) }
fn authorized(window:&tauri::WebviewWindow, allowed:&[&str])->Result<(),String>{ if allowed.contains(&window.label()){Ok(())}else{Err("Window not authorized".into())} }
fn stop(app: &tauri::AppHandle, shared:&Shared) {
    let mut state=shared.0.lock().unwrap(); let previous=state.id.clone(); if let Some(task)=state.task.take(){task.abort();} state.capture=None;state.id.clear();drop(state);if !previous.is_empty(){emit(app,&previous,json!({"type":"state","state":"Idle"}));}
    if let Some(w)=app.get_webview_window("selection"){let _=w.close();}
    if let Ok(w)=main_window(app){let _=w.set_ignore_cursor_events(false);let _=w.show();}
}
#[tauri::command]
fn cancel(app:tauri::AppHandle, window:tauri::WebviewWindow, shared:tauri::State<Shared>)->Result<(),String>{authorized(&window,&["main","selection"])?;stop(&app,&shared);Ok(())}
#[tauri::command]
fn set_click_through(app:tauri::AppHandle, window:tauri::WebviewWindow, enabled:bool)->Result<(),String>{authorized(&window,&["main"])?;main_window(&app)?.set_ignore_cursor_events(enabled).map_err(|e|e.to_string())}

#[cfg(target_os="macos")]
fn capture_permission()->bool {
    #[link(name="CoreGraphics",kind="framework")]
    extern "C" { fn CGPreflightScreenCaptureAccess()->bool; fn CGRequestScreenCaptureAccess()->bool; }
    unsafe { CGPreflightScreenCaptureAccess() || CGRequestScreenCaptureAccess() }
}
#[cfg(not(target_os="macos"))]
fn capture_permission()->bool { true }

async fn begin(app:tauri::AppHandle, shared:Shared, language:Language)->Result<String,String>{
    stop(&app,&shared);
    let id=uuid::Uuid::new_v4().to_string(); {let mut s=shared.0.lock().unwrap();s.id=id.clone();s.language=Some(language);} emit(&app,&id,json!({"type":"state","state":"Selecting"}));
    if !capture_permission(){return Err("Allow Xiami in macOS System Settings > Privacy & Security > Screen Recording, then reopen Xiami.".into());}
    let w=main_window(&app)?;
    let cursor=w.cursor_position().map_err(|e|e.to_string())?;
    w.hide().map_err(|e|e.to_string())?;
    tokio::time::sleep(Duration::from_millis(180)).await;
    let result=tauri::async_runtime::spawn_blocking(move ||->Result<_,String>{
        let monitors=xcap::Monitor::all().map_err(|e|e.to_string())?;
        let monitor=monitors.into_iter().find(|m| {
            let x=m.x().unwrap_or(0);let y=m.y().unwrap_or(0);
            cursor.x>=x as f64&&cursor.y>=y as f64&&cursor.x<(x as f64+m.width().unwrap_or(0) as f64)&&cursor.y<(y as f64+m.height().unwrap_or(0) as f64)
        }).ok_or("No display under cursor")?;
        let x=monitor.x().map_err(|e|e.to_string())?;let y=monitor.y().map_err(|e|e.to_string())?;
        let scale=monitor.scale_factor().map_err(|e|e.to_string())? as f64;
        let img=monitor.capture_image().map_err(|e|e.to_string())?;
        Ok((img,x,y,scale))
    }).await.map_err(|e|e.to_string())?;
    let (img,x,y,scale)=match result{Ok(v)=>v,Err(e)=>{let _=w.show();return Err(format!("Screen capture failed: {e}"));}};
    if shared.0.lock().unwrap().id!=id{return Err("Selection cancelled".into());}
    let width=img.width();let height=img.height();
    shared.0.lock().unwrap().capture=Some(CaptureData{id:id.clone(),image:img,x,y,scale,language});
    let overlay=WebviewWindowBuilder::new(&app,"selection",WebviewUrl::App("index.html?selection=1".into()))
        .title("Xiami — select English text").decorations(false).resizable(false).always_on_top(true).visible(false).build().map_err(|e|e.to_string());
    let overlay=match overlay{Ok(v)=>v,Err(e)=>{stop(&app,&shared);return Err(e);}};
    overlay.set_position(PhysicalPosition::new(x,y)).map_err(|e|e.to_string())?;
    overlay.set_size(PhysicalSize::new(width,height)).map_err(|e|e.to_string())?;
    emit(&app,&id,json!({"type":"state","state":"Selecting"}));
    overlay.show().map_err(|e|e.to_string())?;overlay.set_focus().map_err(|e|e.to_string())?;
    Ok(id)
}
#[tauri::command]
async fn begin_selection(app:tauri::AppHandle,window:tauri::WebviewWindow,shared:tauri::State<'_,Shared>,language:Language)->Result<String,String>{authorized(&window,&["main"])?;begin(app,shared.inner().clone(),language).await}
#[tauri::command]
fn get_capture(window:tauri::WebviewWindow,shared:tauri::State<Shared>)->Result<Value,String>{
    authorized(&window,&["selection"])?;let s=shared.0.lock().unwrap();let c=s.capture.as_ref().ok_or("Selection expired")?;
    let mut bytes=Cursor::new(Vec::new());c.image.write_to(&mut bytes,image::ImageFormat::Png).map_err(|e|e.to_string())?;
    Ok(json!({"image":STANDARD.encode(bytes.into_inner()),"width":c.image.width(),"height":c.image.height(),"requestId":c.id}))
}
fn launch_worker(app:tauri::AppHandle,shared:Shared,id:String,payload:Value)->Result<(),String>{
    let python=std::env::var("XIAMI_PYTHON").unwrap_or_else(|_|if cfg!(windows){"python".into()}else{"python3".into()});
    let script=if cfg!(debug_assertions){std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../worker/main.py")}else{app.path().resource_dir().map_err(|e|e.to_string())?.join("worker/main.py")};
    let task_id=id.clone();let shared_task=shared.clone();
    let task=tauri::async_runtime::spawn(async move{
        let run=async{
            let mut command=tokio::process::Command::new(python);command.arg(script).stdin(std::process::Stdio::piped()).stdout(std::process::Stdio::piped()).stderr(std::process::Stdio::null()).kill_on_drop(true);
            #[cfg(windows)] command.creation_flags(0x08000000);
            let mut child=command.spawn().map_err(|e|format!("Cannot start Python worker. Set XIAMI_PYTHON: {e}"))?;
            let mut input=child.stdin.take().ok_or("Worker input unavailable")?;
            input.write_all(serde_json::to_string(&payload).unwrap().as_bytes()).await.map_err(|e|e.to_string())?;input.write_all(b"\n").await.map_err(|e|e.to_string())?;drop(input);
            let mut lines=BufReader::new(child.stdout.take().ok_or("Worker output unavailable")?).lines();let mut terminal=false;
            while let Some(line)=lines.next_line().await.map_err(|e|e.to_string())? {
                if line.len()>8_000_000{return Err("Worker response too large".into());}
                let typed:WorkerEvent=serde_json::from_str(&line).map_err(|_|"Invalid worker event payload")?;let event=serde_json::to_value(typed).map_err(|_|"Invalid worker event")?;
                let kind=event["type"].as_str().unwrap_or("");
                if !["state","source","chunk","romanization","fallback","audio","done","error"].contains(&kind){return Err("Unknown worker event".into());}
                if shared_task.0.lock().unwrap().id!=task_id{return Ok(());}
                terminal|=kind=="done"||kind=="error";emit(&app,&task_id,event);
            }
            let exit=child.wait().await.map_err(|e|e.to_string())?;if !exit.success()||!terminal{return Err("Translation worker ended before finishing".into());}Ok::<(),String>(())
        };
        match tokio::time::timeout(Duration::from_secs(120),run).await{Ok(Ok(()))=>{},Ok(Err(e))=>emit(&app,&id,json!({"type":"error","message":e})),Err(_)=>emit(&app,&id,json!({"type":"error","message":"Request timed out. Please try a smaller selection."}))}
    });
    shared.0.lock().unwrap().task=Some(task);Ok(())
}
#[tauri::command]
fn submit_region(app:tauri::AppHandle,window:tauri::WebviewWindow,shared:tauri::State<Shared>,request_id:String,r#box:BoxRect)->Result<(),String>{
    authorized(&window,&["selection"])?;
    let mut s=shared.0.lock().unwrap();let c=s.capture.as_ref().ok_or("Selection expired")?;if c.id!=request_id{return Err("Selection expired".into());}
    let b=r#box;if ![b.x,b.y,b.width,b.height].iter().all(|v|v.is_finite())||b.x<0.||b.y<0.||b.width<12.||b.height<12.||b.x+b.width>c.image.width() as f64+1.||b.y+b.height>c.image.height() as f64+1.{return Err("Invalid selection rectangle".into());}
    let x=b.x.floor() as u32;let y=b.y.floor() as u32;let width=(b.width.ceil() as u32).min(c.image.width()-x);let height=(b.height.ceil() as u32).min(c.image.height()-y);
    let crop=image::imageops::crop_imm(&c.image,x,y,width,height).to_image();let mut bytes=Cursor::new(Vec::new());crop.write_to(&mut bytes,image::ImageFormat::Png).map_err(|e|e.to_string())?;
    let px=c.x as f64+(b.x+b.width+16.).min((c.image.width() as f64-460.*c.scale).max(0.));let py=c.y as f64+b.y.min((c.image.height() as f64-850.*c.scale).max(0.));
    let payload=json!({"operation":"translate","image":STANDARD.encode(bytes.into_inner()),"language":c.language,"origin":{"x":c.x as f64+b.x,"y":c.y as f64+b.y}});
    s.capture=None;drop(s);if let Some(w)=app.get_webview_window("selection"){let _=w.close();}let w=main_window(&app)?;let _=w.set_position(PhysicalPosition::new(px as i32,py as i32));w.show().map_err(|e|e.to_string())?;
    emit(&app,&request_id,json!({"type":"state","state":"Reading"}));launch_worker(app,shared.inner().clone(),request_id,payload)
}
#[tauri::command]
fn speak(app:tauri::AppHandle,window:tauri::WebviewWindow,shared:tauri::State<Shared>,text:String,language:Language,request_id:String)->Result<String,String>{
    authorized(&window,&["main"])?;if text.trim().is_empty()||text.len()>20000{return Err("Invalid speech text length".into());}
    if uuid::Uuid::parse_str(&request_id).is_err(){return Err("Invalid request id".into());} stop(&app,&shared);let id=request_id;shared.0.lock().unwrap().id=id.clone();
    launch_worker(app,shared.inner().clone(),id.clone(),json!({"operation":"speak","text":text,"language":language}))?;Ok(id)
}
#[tauri::command]
fn set_language(window:tauri::WebviewWindow,shared:tauri::State<Shared>,language:Language)->Result<(),String>{authorized(&window,&["main"])?;shared.0.lock().unwrap().language=Some(language);Ok(())}
pub fn run(){
    tauri::Builder::default().manage(Shared::default())
    .plugin(tauri_plugin_global_shortcut::Builder::new().with_handler(|app,_,event|{if event.state()==ShortcutState::Pressed{
        let a=app.clone();let s=app.state::<Shared>().inner().clone();tauri::async_runtime::spawn(async move{if let Err(e)=begin(a.clone(),s.clone(),{let lang=s.0.lock().unwrap().language.unwrap_or(Language::Cantonese);lang}).await{let id=s.0.lock().unwrap().id.clone();emit(&a,&id,json!({"type":"error","message":e}));}});
    }}).build())
    .setup(|app|{app.global_shortcut().register("CommandOrControl+Shift+X")?;Ok(())})
    .invoke_handler(tauri::generate_handler![begin_selection,get_capture,submit_region,cancel,set_click_through,speak,set_language])
    .run(tauri::generate_context!()).expect("Xiami could not start");
}



