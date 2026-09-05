/*
	MEMEPOLY - src/sfx.js
	개발 Part 43 - 효과음 합성

	오디오 파일을 쓰지 않는다.
	오실레이터 + 화이트노이즈 + 필터 + 엔벨로프로 매번 파형을 만든다.
	  용량      0 (코드뿐)
	  요청      0
	  지연      없음 (미리 로드할 것이 없다)

	자동재생 정책
	  AudioContext 는 사용자 제스처 전까지 suspended 다.
	  첫 클릭 / 터치 / 키입력에서 resume() 을 부른다.
	  iOS Safari 는 이 규칙이 특히 엄격하므로
	  boot 자체를 제스처 시점으로 미룬다.

	설계 원칙
	  1) 소리 때문에 게임이 멈추면 안 된다.
	     모든 진입점이 try/catch 안에 있고 실패해도 조용히 넘어간다.
	  2) 폴링(600ms)마다 같은 소리가 반복되면 안 된다.
	     SfxSync 가 신호별 서명을 비교해 한 번만 울린다.
	  3) 동시 재생 수를 제한한다.
	     폭발이 겹치면 클리핑이 나고 모바일에서 끊긴다.
*/
window.Sfx = {
	ctx : null,
	master : null,
	noiseBuf : null,
	ready : false,
	active : 0,
	limit : 10,
	volume : 0.3,
	muted : false,
	/* SfxSync 가 신호별 마지막 서명을 여기 보관한다 */
	last : {}
}
try{
	window.Sfx.muted = localStorage.sfxMuted === "1"
}catch(err){
	window.Sfx.muted = false
}
/*
	AudioContext 를 만든다.
	제스처 없이 호출되면 suspended 로 생성되므로
	unlock() 이 뒤이어 resume 한다.
*/
window.Sfx.boot = function(){
	if(window.Sfx.ctx){
		return window.Sfx.ctx
	}
	var AC = window.AudioContext || window.webkitAudioContext
	if(!AC){
		return null
	}
	try{
		var ctx = new AC()
		var master = ctx.createGain()
		master.gain.value = window.Sfx.muted ? 0 : window.Sfx.volume
		master.connect(ctx.destination)
		window.Sfx.ctx = ctx
		window.Sfx.master = master
		window.Sfx.ready = true
		return ctx
	}catch(err){
		console.log("[sfx] boot err", err)
		return null
	}
}
window.Sfx.unlock = function(){
	var ctx = window.Sfx.boot()
	if(!ctx){
		return false
	}
	if(ctx.state === "suspended"){
		try{
			ctx.resume()
		}catch(err){
		}
	}
	return ctx.state === "running"
}
window.Sfx.mute = function(on){
	window.Sfx.muted = (typeof on === "undefined") ? !window.Sfx.muted : (on ? true : false)
	try{
		localStorage.sfxMuted = window.Sfx.muted ? "1" : "0"
	}catch(err){
	}
	if(window.Sfx.master && window.Sfx.ctx){
		window.Sfx.master.gain.setValueAtTime(
			window.Sfx.muted ? 0 : window.Sfx.volume,
			window.Sfx.ctx.currentTime
		)
	}
	$("body").attr("sfx", window.Sfx.muted ? "off" : "on")
	return window.Sfx.muted
}
/*
	화이트노이즈 버퍼.
	폭발 / 발소리 / 주사위 딸깍에 쓴다.
	1 초짜리 하나를 만들어 계속 재사용한다.
*/
window.Sfx.noise = function(){
	if(window.Sfx.noiseBuf){
		return window.Sfx.noiseBuf
	}
	var ctx = window.Sfx.ctx
	if(!ctx){
		return null
	}
	var len = Math.floor(ctx.sampleRate)
	var buf = ctx.createBuffer(1, len, ctx.sampleRate)
	var data = buf.getChannelData(0)
	for(var i = 0; i < len; i++){
		data[i] = (Math.random() * 2) - 1
	}
	window.Sfx.noiseBuf = buf
	return buf
}
/*
	엔벨로프.
	exponentialRampToValueAtTime 은 0 을 받지 못하므로
	0.0001 을 무음 기준으로 쓴다.
*/
window.Sfx.env = function(gain, t0, peak, attack, dur){
	gain.gain.setValueAtTime(0.0001, t0)
	gain.gain.exponentialRampToValueAtTime(peak > 0 ? peak : 0.0001, t0 + attack)
	gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
}
/*
	단음.
	  type    sine / square / sawtooth / triangle
	  from/to 주파수 (to 가 다르면 글라이드)
	  dur     길이(초)
	  gain    최대 진폭
	  delay   시작 지연(초). 아르페지오에 쓴다
*/
window.Sfx.tone = function(o){
	var ctx = window.Sfx.ctx
	if(!ctx || !window.Sfx.master){
		return
	}
	var t0 = ctx.currentTime + (o.delay ? o.delay : 0)
	var dur = o.dur ? o.dur : 0.15
	var osc = ctx.createOscillator()
	var g = ctx.createGain()
	osc.type = o.type ? o.type : "sine"
	osc.frequency.setValueAtTime(o.from, t0)
	if(o.to && o.to !== o.from){
		osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.to), t0 + dur)
	}
	window.Sfx.env(g, t0, o.gain ? o.gain : 0.3, o.attack ? o.attack : 0.005, dur)
	osc.connect(g)
	g.connect(window.Sfx.master)
	osc.start(t0)
	osc.stop(t0 + dur + 0.03)
}
/*
	노이즈 버스트.
	  cut     로우패스 시작 주파수
	  cutTo   끝 주파수 (스윕)
	  type    lowpass / highpass / bandpass
*/
window.Sfx.burst = function(o){
	var ctx = window.Sfx.ctx
	if(!ctx || !window.Sfx.master){
		return
	}
	var buf = window.Sfx.noise()
	if(!buf){
		return
	}
	var t0 = ctx.currentTime + (o.delay ? o.delay : 0)
	var dur = o.dur ? o.dur : 0.2
	var src = ctx.createBufferSource()
	var flt = ctx.createBiquadFilter()
	var g = ctx.createGain()
	src.buffer = buf
	src.loop = true
	flt.type = o.type ? o.type : "lowpass"
	flt.frequency.setValueAtTime(o.cut ? o.cut : 1200, t0)
	if(o.cutTo){
		flt.frequency.exponentialRampToValueAtTime(Math.max(20, o.cutTo), t0 + dur)
	}
	if(o.q){
		flt.Q.value = o.q
	}
	window.Sfx.env(g, t0, o.gain ? o.gain : 0.25, o.attack ? o.attack : 0.003, dur)
	src.connect(flt)
	flt.connect(g)
	g.connect(window.Sfx.master)
	src.start(t0)
	src.stop(t0 + dur + 0.03)
}
/*
	음색표.
	각 항목은 tone / burst 조합 한 덩어리다.
	주파수는 평균율 기준으로 골랐다.
	  523 C5   659 E5   784 G5   988 B5   1047 C6   1319 E6
*/
window.Sfx.bank = {
	/* UI */
	click : function(){
		window.Sfx.burst({ dur : 0.03, cut : 3000, type : "highpass", gain : 0.12 })
	},
	blip : function(){
		window.Sfx.tone({ type : "triangle", from : 880, dur : 0.06, gain : 0.18 })
	},
	deny : function(){
		window.Sfx.tone({ type : "square", from : 220, to : 165, dur : 0.12, gain : 0.16 })
		window.Sfx.tone({ type : "square", from : 165, to : 110, dur : 0.16, gain : 0.14, delay : 0.11 })
	},
	/* 이동 */
	step : function(){
		window.Sfx.burst({ dur : 0.05, cut : 900, cutTo : 300, gain : 0.1 })
	},
	dice : function(){
		/* 주사위 딸깍. 짧은 클릭 네 번을 불규칙하게 흩는다 */
		for(var i = 0; i < 4; i++){
			window.Sfx.burst({
				dur : 0.035,
				cut : 2600 + (Math.random() * 1200),
				type : "bandpass",
				q : 6,
				gain : 0.2,
				delay : i * 0.055 + (Math.random() * 0.015)
			})
		}
	},
	/* 경제 */
	coin : function(){
		window.Sfx.tone({ type : "square", from : 988, dur : 0.06, gain : 0.16 })
		window.Sfx.tone({ type : "square", from : 1319, dur : 0.2, gain : 0.14, delay : 0.06 })
	},
	loot : function(){
		var n = [523, 659, 784, 1047]
		for(var i = 0; i < n.length; i++){
			window.Sfx.tone({ type : "triangle", from : n[i], dur : 0.14, gain : 0.15, delay : i * 0.055 })
		}
	},
	build : function(){
		window.Sfx.burst({ dur : 0.09, cut : 700, cutTo : 180, gain : 0.28 })
		window.Sfx.tone({ type : "sine", from : 150, to : 70, dur : 0.16, gain : 0.22 })
		window.Sfx.burst({ dur : 0.09, cut : 700, cutTo : 180, gain : 0.24, delay : 0.13 })
		window.Sfx.tone({ type : "sine", from : 150, to : 70, dur : 0.16, gain : 0.2, delay : 0.13 })
	},
	bankrupt : function(){
		var n = [392, 311, 233]
		for(var i = 0; i < n.length; i++){
			window.Sfx.tone({ type : "sawtooth", from : n[i], dur : 0.28, gain : 0.15, delay : i * 0.16 })
		}
	},
	/* 아이템 */
	pickup : function(){
		window.Sfx.tone({ type : "triangle", from : 660, to : 990, dur : 0.11, gain : 0.18 })
	},
	drop : function(){
		window.Sfx.tone({ type : "triangle", from : 660, to : 330, dur : 0.13, gain : 0.16 })
	},
	heal : function(){
		window.Sfx.tone({ type : "sine", from : 523, to : 1047, dur : 0.3, gain : 0.16 })
		window.Sfx.burst({ dur : 0.16, cut : 5000, type : "highpass", gain : 0.06 })
	},
	/* 전투 */
	bomb : function(){
		window.Sfx.burst({ dur : 0.5, cut : 2400, cutTo : 90, gain : 0.4 })
		window.Sfx.tone({ type : "sine", from : 95, to : 32, dur : 0.55, gain : 0.35 })
	},
	damage : function(){
		window.Sfx.tone({ type : "sawtooth", from : 300, to : 80, dur : 0.22, gain : 0.22 })
		window.Sfx.burst({ dur : 0.12, cut : 1600, cutTo : 400, gain : 0.2 })
	},
	dead : function(){
		window.Sfx.tone({ type : "sine", from : 220, to : 45, dur : 1.1, gain : 0.28 })
		window.Sfx.tone({ type : "sawtooth", from : 110, to : 30, dur : 1.3, gain : 0.12, delay : 0.1 })
	},
	/* 진행 */
	deploy : function(){
		window.Sfx.tone({ type : "sawtooth", from : 70, to : 240, dur : 0.45, gain : 0.16 })
		window.Sfx.burst({ dur : 0.3, cut : 400, cutTo : 2000, type : "bandpass", q : 3, gain : 0.1 })
	},
	extract : function(){
		var n = [523, 659, 784, 1047, 1319]
		for(var i = 0; i < n.length; i++){
			window.Sfx.tone({ type : "triangle", from : n[i], dur : 0.22, gain : 0.16, delay : i * 0.07 })
		}
	},
	jail : function(){
		window.Sfx.tone({ type : "sine", from : 330, dur : 0.5, gain : 0.16 })
		window.Sfx.tone({ type : "sine", from : 220, dur : 0.7, gain : 0.14, delay : 0.06 })
	},
	flag : function(){
		window.Sfx.burst({ dur : 0.18, cut : 600, cutTo : 2600, type : "bandpass", q : 2, gain : 0.16 })
	}
}
/*
	재생.
	이름이 없으면 조용히 무시한다(오타로 게임이 멈추지 않게).
	동시 재생 수를 제한해 클리핑과 모바일 끊김을 막는다.
*/
window.Sfx.play = function(name){
	try{
		if(window.Sfx.muted){
			return false
		}
		var fn = window.Sfx.bank[name]
		if(!fn){
			return false
		}
		if(!window.Sfx.ctx){
			/* 아직 제스처가 없었다. 소리 없이 넘어간다 */
			return false
		}
		if(window.Sfx.ctx.state !== "running"){
			window.Sfx.unlock()
			if(window.Sfx.ctx.state !== "running"){
				return false
			}
		}
		if(window.Sfx.active >= window.Sfx.limit){
			return false
		}
		window.Sfx.active++
		setTimeout(function(){
			window.Sfx.active--
		}, 700)
		fn()
		return true
	}catch(err){
		return false
	}
}
/*
	서버 신호 -> 효과음.
	BoardCallback 이 폴링마다 부른다.

	중복 방지
	  window.Callback 은 조이스틱 이동 등에서 window.response 를 재생한다.
	  같은 cookies 객체가 두 번 이상 들어올 수 있으므로
	  신호마다 서명을 만들어 값이 바뀔 때만 울린다.
	  통행료처럼 같은 금액이 연달아 나올 수 있는 신호는
	  cookies.tolled(마지막 정산 칸)를 서명에 섞는다.
*/
window.SfxSync = function(cookies){
	if(!cookies){
		return
	}
	var tile = cookies.tolled ? String(cookies.tolled) : ""
	var fire = function(key, sound, sig){
		if(!sig){
			window.Sfx.last[key] = ""
			return
		}
		if(window.Sfx.last[key] === sig){
			return
		}
		window.Sfx.last[key] = sig
		window.Sfx.play(sound)
	}
	try{
		/* 경제 */
		fire("loot", "loot", cookies.treasuryLoot ? (cookies.treasuryLoot + "@" + tile) : "")
		fire("toll", "coin", cookies.tollPaid ? (cookies.tollPaid + "@" + tile) : "")
		fire("bankrupt", "bankrupt", cookies.tollFailed ? (cookies.tollFailed + "@" + tile) : "")
		/* 아이템 */
		fire("picked", "pickup", cookies.picked ? (cookies.picked + "@" + tile) : "")
		fire("gateDrop", "drop", cookies.gateDrop ? (cookies.gateDrop + "@" + tile) : "")
		fire("consumed", "heal", cookies.consumed ? (cookies.consumed + "@" + cookies.hp) : "")
		/* 전투 */
		fire("dead", "dead", (cookies.dead || cookies.damage) ? ("1@" + (cookies.deadAt ? cookies.deadAt : "")) : "")
		/* 진행 */
		fire("spawned", "deploy", cookies.spawned ? String(cookies.spawned) : "")
		fire("exited", "extract", cookies.exited ? "1" : "")
		fire("jail", "jail", cookies.onJail ? ("1@" + tile) : "")
		/* 거절 신호는 한 덩어리로 묶는다 */
		var deny = ""
		if(cookies.buildError){ deny = "b:" + cookies.buildError }
		else if(cookies.bidError){ deny = "a:" + cookies.bidError }
		else if(cookies.consumeBlocked){ deny = "c:" + cookies.consumeBlocked }
		else if(cookies.raidDeny){ deny = "r:" + cookies.raidDeny }
		else if(cookies.swapError){ deny = "s:" + cookies.swapError }
		else if(cookies.diceBlocked){ deny = "d:" + cookies.diceBlocked }
		fire("deny", "deny", deny ? (deny + "@" + tile) : "")
	}catch(err){
	}
}
;(function(){
	var unlocked = false
	var onGesture = function(){
		if(unlocked){
			return
		}
		unlocked = true
		window.Sfx.unlock()
		$("body").attr("sfx", window.Sfx.muted ? "off" : "on")
	}
	var events = ["pointerdown", "touchstart", "mousedown", "keydown"]
	for(var i = 0; i < events.length; i++){
		document.addEventListener(events[i], onGesture, { capture : true, once : false })
	}
	document.addEventListener("click", function(e){
		if(!window.Sfx.ctx){
			return
		}
		var t = e.target
		if(!t || !t.closest){
			return
		}
		if(t.closest(".sfx_toggle")){
			window.Sfx.mute()
			return
		}
		if(t.closest(".hashType.Fire")){
			window.Sfx.play("flag")
			return
		}
		if(t.closest(".hashType") || t.closest(".btn") ||
			t.closest("#panel .row") || t.closest(".emoji_asset")){
			window.Sfx.play("click")
		}
	}, true)
})()