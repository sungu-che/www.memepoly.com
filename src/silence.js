/*
	개발 Part 79 (외부 주입 오류 억제 범위)
	현행 문제
	  이 파일 전체가 import.meta.env.DEV 로 감싸여 있었다.
	  그래서 프로덕션에서는 아래 예외가 그대로 콘솔에 남는다.
	    Uncaught TypeError: Cannot read properties of undefined (reading 'startTime')
	        at et.reportAllChanges (<anonymous>:2:19429)
	  이건 web-vitals 계측기가 확장 프로그램으로 주입돼 발생하는 것이고
	  memepoly 번들에는 reportAllChanges 라는 식별자 자체가 없다.
	  그런데 실제 게임 버그(사망 후 마이룸 이동 불가 등)를 조사할 때
	  이 예외가 먼저 눈에 띄어 원인을 오판하게 만든다.
	조치
	  환경 가드를 없애고 항상 등록한다.
	억제 범위를 넓히지 않는 이유
	  아래 두 가지 조건은 그대로 유지한다.
	    1) e.filename 이 있으면 즉시 통과시킨다.
	       우리 번들이 던진 예외는 반드시 파일명을 갖는다.
	    2) 화이트리스트 패턴에 걸릴 때만 삼킨다.
	  즉 "파일명 없는 예외 중 알려진 외부 패턴" 만 막는다.
	  범위를 넓히면 진짜 버그를 가리게 되므로 지금 폭이 정확하다.
*/
{
	var _consoleError = console.error
	var _ignorePatterns = [
		"is unrecognized in this browser"
	]
	console.error = function(){
		try{
			var first = arguments[0]
			if(typeof first == "string"){
				for(var i = 0; i < _ignorePatterns.length; i++){
					if(first.indexOf(_ignorePatterns[i]) > -1){
						return
					}
				}
			}
		}catch(err){
		}
		return _consoleError.apply(console, arguments)
	}
	/*
		개발 Part 16 (외부 주입 스크립트)
		Uncaught TypeError: Cannot read properties of undefined (reading 'startTime')
		    at et.reportAllChanges (<anonymous>:2:19429)
		위 예외는 web-vitals 계측기가 LCP/INP 엔트리가 비어 있는 프레임에서
		entries[0].startTime 을 읽어 발생한다.
		reportAllChanges 는 web-vitals 의 옵션 프로퍼티명이며
		memepoly 소스 어디에도 존재하지 않는다.
		<anonymous> / VM 접두 파일명은 eval 또는 확장 프로그램 주입을 뜻한다.
		우리 코드에서 잡을 방법이 없고 동작에도 영향이 없으므로
		"파일명이 없는 예외" 만 걸러 콘솔을 비운다.
		파일명이 있는 예외(우리 번들)는 절대 삼키지 않는다.
	*/
	var _foreignPatterns = [
		"reportAllChanges",
		"web-vitals"
	]
	window.addEventListener("error", function(e){
		try{
			var filename = e.filename ? String(e.filename) : ""
			if(filename){
				return
			}
			var stack = ""
			if(e.error && e.error.stack){
				stack = String(e.error.stack)
			}
			var message = e.message ? String(e.message) : ""
			var hay = stack + " " + message
			for(var i = 0; i < _foreignPatterns.length; i++){
				if(hay.indexOf(_foreignPatterns[i]) > -1){
					e.preventDefault()
					e.stopImmediatePropagation()
					return
				}
			}
		}catch(err){
		}
	}, true)
}