import React, { useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "./supabase.js";

export default function AuthPanel({ session, onSessionChange }) {
  const [mode,setMode]=useState("signin");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const [recovery,setRecovery]=useState(false);

  useEffect(()=>{
    if(!supabase) return;
    const { data:{ subscription } }=supabase.auth.onAuthStateChange((event,nextSession)=>{
      onSessionChange(nextSession);
      if(event==="PASSWORD_RECOVERY"){ setRecovery(true); setMode("password"); }
    });
    return ()=>subscription.unsubscribe();
  },[onSessionChange]);

  if(!supabaseConfigured) return <div className="auth-status warning">Supabase environment variables are not configured.</div>;

  const submit=async e=>{
    e.preventDefault(); setBusy(true); setMessage("");
    try{
      if(mode==="signin"){
        const {error}=await supabase.auth.signInWithPassword({email,password});
        if(error) throw error;
      }else if(mode==="signup"){
        const {error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin}});
        if(error) throw error;
        setMessage("Account created. Check your email if confirmation is required.");
      }else if(mode==="forgot"){
        const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});
        if(error) throw error;
        setMessage("Password reset link sent. Check your email.");
      }else if(mode==="password"){
        const {error}=await supabase.auth.updateUser({password});
        if(error) throw error;
        setRecovery(false); setMode("signin"); setPassword("");
        setMessage("Password updated successfully.");
      }
    }catch(err){ setMessage(err.message||"Authentication failed."); }
    finally{ setBusy(false); }
  };

  if(session) return <div className="auth-user"><span>Signed in as <b>{session.user.email}</b></span><button className="secondary" onClick={()=>supabase.auth.signOut()}>Sign out</button></div>;

  return <form className="auth-panel" onSubmit={submit}>
    <div className="auth-tabs">
      {!recovery&&<><button type="button" className={mode==="signin"?"active":""} onClick={()=>{setMode("signin");setMessage("")}}>Sign in</button><button type="button" className={mode==="signup"?"active":""} onClick={()=>{setMode("signup");setMessage("")}}>Sign up</button></>}
      {recovery&&<strong>Choose a new password</strong>}
    </div>
    {mode!=="password"&&<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" autoComplete="email"/>}
    {mode!=="forgot"&&<input type="password" required minLength="6" value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode==="password"?"New password":"Password"} autoComplete={mode==="signin"?"current-password":"new-password"}/>}
    <button type="submit" disabled={busy}>{busy?"Please wait...":mode==="signup"?"Create account":mode==="forgot"?"Send reset link":mode==="password"?"Update password":"Sign in"}</button>
    {!recovery&&mode!=="forgot"&&<button type="button" className="auth-link" onClick={()=>{setMode("forgot");setMessage("")}}>Forgot password?</button>}
    {!recovery&&mode==="forgot"&&<button type="button" className="auth-link" onClick={()=>{setMode("signin");setMessage("")}}>Back to sign in</button>}
    {message&&<span className="auth-message">{message}</span>}
  </form>;
}
